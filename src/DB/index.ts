import * as assert from "assert";
import * as mongodb from "mongodb";
import { connection as getConnection } from "../Connect";
import { safeExec } from "../Error";
import {
  array,
  function as func,
  makeCollectionId,
  object,
  prepareKey,
  prepareToRead,
  prepareToStore,
  string,
} from "../utils";
import EventEmitter, { Event } from "./EventEmitter";
import Filter from "./Filter";
import Join from "./Join";

export type Operator = "<" | "<=" | "=" | "<>" | ">=" | ">";

export type Order = "asc" | "desc";

export type Id = mongodb.ObjectId;

export type FilterQuery<T extends Record<string, unknown> = any> = (
  query: Filter<T>,
) => Filter<T>;

export type JoinQuery<T extends Record<string, unknown> = any> = (
  query: Join<T>,
) => Join<T>;

export interface GroupQueryObject<T extends Record<string, unknown> = any> {
  having: (
    field: string,
    operator: Operator | any,
    value?: any,
  ) => GroupQueryObject<T>;
}

export type GroupQuery<T extends Record<string, unknown> = any> = (
  query: GroupQueryObject<T>,
) => void;

export type Mapper<T extends Record<string, unknown> = any> = (
  item: T,
  index: number,
  items: T[],
) => any;

export interface Iterator<T extends Record<string, unknown> = any> {
  hasNext: () => Promise<boolean>;
  next: () => Promise<T | undefined>;
  [Symbol.asyncIterator]: () => AsyncIterator<T>;
}

export default class DB<T extends Record<string, unknown> = any> extends Filter<
  T
> {
  protected _query: mongodb.Collection;

  protected _collection!: string;

  protected _pipeline: Array<{ [key: string]: any }> = [];

  protected _mappers: Array<Mapper<T>> = [];

  public get pipeline() {
    return this._resetFilters()._pipeline;
  }

  constructor(protected _connection: string) {
    super();

    assert(
      string.isString(_connection),
      `Expected "connection" to be string, got ${typeof _connection}`,
    );

    this._query = getConnection(_connection) as any;

    this.map(prepareToRead);
  }

  protected _resetFilters() {
    const FILTER = this._filters;

    if (object.size(FILTER) > 0) this._pipeline.push({ $match: FILTER });

    this._filter = {
      $and: [],
    };

    return this;
  }

  /********************************** Event **********************************/

  protected _emit(event: Event, data: T) {
    return new EventEmitter(this._connection, this._collection).emit(
      event,
      data,
    );
  }

  /******************************** Collection *******************************/

  public static connection<T extends Record<string, unknown> = any>(
    connection: string,
  ): DB<T> {
    return new this(connection);
  }

  public static collection<T extends Record<string, unknown> = any>(
    collection: string,
  ): DB<T> {
    let connection = "default";

    const keys = collection.split(".");

    if (keys.length === 2) {
      connection = keys[0];
      collection = keys[1];
    }

    return this.connection(connection).collection(collection);
  }

  public collection(collection: string) {
    assert(
      (this._query as any).collection,
      "Can't change collection name in the middle of query",
    );
    assert(
      string.isString(collection),
      `Expected "collection" to be string, got ${typeof collection}`,
    );

    this._query = ((this._query as any) as mongodb.Db).collection(collection);

    this._collection = collection;

    // this._query.watch(
    //   [{ $match: { operationType: "update" } }],
    //   { fullDocument: "updateLookup" }
    // ).on("change", console.log);

    return this;
  }

  /********************************** Extra **********************************/

  public aggregate(
    ...objects: Record<string, unknown>[] | Record<string, unknown>[][]
  ) {
    this._resetFilters();

    this._pipeline.push(...array.deepFlatten(objects));

    return this;
  }

  /*********************************** Joins **********************************/

  public join(
    collection: string,
    query: JoinQuery<T> = (q) =>
      q.where(makeCollectionId(collection), `${collection}.id`),
    as: string = collection,
  ) {
    assert(
      string.isString(collection),
      `Expected "collection" to be string, got ${typeof collection}`,
    );

    const join: Join = query(new Join(this._collection, collection, as)) as any;

    this.aggregate(join.pipeline);

    return this;
  }

  /********* Mapping, Ordering, Grouping, Limit, Offset & Pagination *********/

  public map(mapper: Mapper<T>) {
    assert(
      func.isFunction(mapper),
      `Expected "mapper" to be a function, got ${typeof mapper}`,
    );

    this._mappers.push(mapper);

    return this;
  }

  // groupBy(field: string, query?: Base.GroupQuery<T>) {
  //   const MATCH: { [key: string]: any } = {};

  //   this.pipeline({ $group: { _id: field } }, { $project: { [field]: "$_id" } });

  //   if (!query) return this;

  //   const QUERY = {
  //     having: (field: any, operator: any, value?: any) => {
  //       field = prepareKey(field);

  //       if (value === undefined) {
  //         value = operator;
  //         operator = "=";
  //       }

  //       MATCH[field] = {
  //         [`$${OPERATORS[operator]}`]: value,
  //       };

  //       return QUERY;
  //     },
  //   };

  //   query(QUERY);

  //   if (utils.object.isEmpty(MATCH)) return this;

  //   return this.pipeline({ $match: MATCH });
  // }

  public orderBy<K extends keyof T>(field: K, order?: Order): this;
  public orderBy(field: string, order?: Order): this;
  public orderBy(fields: { [field: string]: "asc" | "desc" }): this;
  public orderBy(
    fields: string | { [field: string]: "asc" | "desc" },
    order?: Order,
  ) {
    const $sort: { [field: string]: 1 | -1 } = {};

    if (string.isString(fields)) $sort[fields] = order === "desc" ? -1 : 1;
    else
      object.forEach(
        fields,
        (value, field) => ($sort[field] = value === "desc" ? -1 : 1),
      );

    return this.aggregate({ $sort });
  }

  public skip(offset: number) {
    return this.aggregate({ $skip: offset });
  }

  public offset(offset: number) {
    return this.skip(offset);
  }

  public limit(limit: number) {
    return this.aggregate({ $limit: limit });
  }

  public take(limit: number) {
    return this.limit(limit);
  }

  public paginate(page = 0, limit = 10) {
    return this.skip(page * limit).limit(limit);
  }

  /********************************* Indexes *********************************/

  public indexes(): Promise<any> {
    return safeExec(this._query, "indexes", []);
  }

  public index(
    fieldOrSpec: string | Record<string, unknown>,
    options?: mongodb.IndexOptions,
  ) {
    return safeExec(this._query, "createIndex", [fieldOrSpec, options]);
  }

  public reIndex(): Promise<any> {
    return safeExec(this._query, "reIndex", []);
  }

  public dropIndex(
    indexName: string,
    options?: mongodb.CommonOptions & { maxTimeMS?: number },
  ): Promise<any> {
    return safeExec(this._query, "dropIndex", [indexName, options]);
  }

  /*********************************** Read **********************************/

  private _aggregate(options?: mongodb.CollectionAggregationOptions) {
    this._resetFilters();

    return this._mappers.reduce(
      (query: any, mapper) => query.map(mapper),
      this._query.aggregate(this._pipeline, options),
    ) as mongodb.AggregationCursor;
  }

  private _filtersOnly() {
    this._resetFilters();

    let filters: { [key: string]: any } = {
      $and: this._pipeline
        .filter((pipe) => pipe.$match)
        .map((pipe) => pipe.$match),
    };

    if (filters.$and.length === 0) filters = {};

    return filters;
  }

  public async count(): Promise<number> {
    this.aggregate({ $count: "count" });

    const result = (await this.first()) as any;

    return result ? result.count : 0;
  }

  public async exists(): Promise<boolean> {
    return (await this.count()) !== 0;
  }

  public iterate(fields?: string[]): Iterator<T> {
    if (fields)
      this.aggregate({
        $project: fields.reduce(
          (prev, cur) => ((prev[prepareKey(cur)] = 1), prev),
          { _id: 0 } as { [key: string]: any },
        ),
      });

    const cursor = this._aggregate();

    const iterator = {
      hasNext: () => cursor.hasNext(),
      next: () => cursor.next(),
      [Symbol.asyncIterator]: () => ({
        next: async (): Promise<{ value: T; done: boolean }> => {
          const value = await iterator.next();

          if (value)
            return {
              value,
              done: false,
            };

          return { done: true } as any;
        },
      }),
    };

    return iterator;
  }

  public get<K extends keyof T>(fields?: Array<K | string>): Promise<T[]> {
    if (fields)
      this.aggregate({
        $project: fields.reduce(
          (prev, cur) => ((prev[prepareKey(cur as string)] = 1), prev),
          { _id: 0 } as { [key: string]: any },
        ),
      });

    return safeExec(this._aggregate(), "toArray", []);
  }

  public async first<K extends keyof T>(
    fields?: Array<K | string>,
  ): Promise<T> {
    this._resetFilters().limit(1);

    return (await this.get(fields))[0];
  }

  public value<K extends keyof T>(field: K): Promise<T[K]>;
  public value(field: string): Promise<any>;
  public value(field: string) {
    field = prepareKey(field);

    const keys = field.split(".");

    return safeExec(
      this.map((item: any) => keys.reduce((prev, key) => prev[key], item))
        .aggregate({
          $project: {
            _id: 0,
            [field]: { $ifNull: [`$${field}`, "$__NULL__"] },
          },
        })
        ._aggregate(),
      "toArray",
      [],
    );
  }

  public pluck<K extends keyof T>(field: K): Promise<T[K]>;
  public pluck(field: string): Promise<any>;
  public pluck(field: string) {
    return this.value(field) as any;
  }

  public max<K extends keyof T>(field: K): Promise<T[K]>;
  public max(field: string): Promise<any>;
  public async max(field: string) {
    this.aggregate({ $group: { _id: null, max: { $max: `$${field}` } } });

    const result = (await this.first()) as any;

    return result && result.max;
  }

  public min<K extends keyof T>(field: K): Promise<T[K]>;
  public min(field: string): Promise<any>;
  public async min(field: string) {
    this.aggregate({ $group: { _id: null, min: { $min: `$${field}` } } });

    const result = (await this.first()) as any;

    return result && result.min;
  }

  public avg<K extends keyof T>(field: K): Promise<T[K]>;
  public avg(field: string): Promise<any>;
  public async avg(field: string) {
    this.aggregate({ $group: { _id: null, avg: { $avg: `$${field}` } } });

    const result = (await this.first()) as any;

    return result && result.avg;
  }

  /********************************** Inserts *********************************/

  protected _insertMany(items: T[]): Promise<mongodb.InsertWriteOpResult> {
    items = prepareToStore(items);

    return safeExec(this._query, "insertMany", [items], (saved) => {
      if (!saved) return;

      saved.ops.forEach((op: any) => this._emit("create", op));
    });
  }

  protected _insertOne(item: T): Promise<mongodb.InsertOneWriteOpResult> {
    item = prepareToStore(item);

    return safeExec(this._query, "insertOne", [item], (saved) => {
      if (!saved) return;

      saved.ops.forEach((op: any) => this._emit("create", op));
    });
  }

  public async insert(item: T | T[]): Promise<number> {
    if (Array.isArray(item)) {
      return (await this._insertMany(item)).insertedCount;
    }

    return (await this._insertOne(item)).insertedCount;
  }

  public async insertGetId(item: T): Promise<Id> {
    return (await this._insertOne(item)).insertedId;
  }

  /********************************** Updates *********************************/

  protected async _update(
    update: Record<string, unknown>,
    soft?: {
      type: "delete" | "restore";
      field: string;
      value: Date;
    },
  ): Promise<mongodb.UpdateWriteOpResult> {
    const filters = this._filtersOnly();

    return safeExec(this._query, "updateMany", [filters, update]);
  }

  public async update(update: Partial<T>): Promise<number> {
    const _update = {
      $set: prepareToStore(update),
    };

    return (await this._update(_update)).modifiedCount;
  }

  public increment(field: string, count?: number): Promise<number>;
  public increment<K extends keyof T>(
    field: K,
    count?: number,
  ): Promise<number>;
  public async increment(field: string, count = 1) {
    const update = {
      $inc: {
        [field]: count,
      },
    };

    return (await this._update(update)).modifiedCount;
  }

  public decrement(field: string, count?: number): Promise<number>;
  public decrement<K extends keyof T>(
    field: K,
    count?: number,
  ): Promise<number>;
  public decrement(field: string, count = 1) {
    return this.increment(field, -count) as any;
  }

  public unset(fields: string[]): Promise<number>;
  public unset<K extends keyof T>(fields: K[]): Promise<number>;
  public unset(fields: string[]) {
    return this._update({
      $unset: fields.reduce((prev, cur) => ({ ...prev, [cur]: 1 }), {}),
    }) as any;
  }

  /********************************** Deletes *********************************/

  public async delete(): Promise<number> {
    const filters = this._filtersOnly();

    return (await safeExec(this._query, "deleteMany", [filters])).deletedCount;
  }
}
