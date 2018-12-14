import * as mongodb from "mongodb";
import * as Odin from "..";
import { connection as getConnection } from "../Connect";
import OdinError, { safeExec } from "../Error";
import {
  array, date, function as func, isID, makeCollectionId, object, prepareKey, string
} from "../utils";
import Filter from "./Filter";
import Join from "./Join";

const ObjectId = mongodb.ObjectId;

namespace DB {
  export type Callback<T = any> = (error: OdinError, result: T) => void;

  export type Operator = "<" | "<=" | "=" | "<>" | ">=" | ">";

  export type Order = "asc" | "desc";

  export type Id = string;

  export type FilterQuery<T extends object = any> = (query: Filter<T>) => Filter<T>;

  export type JoinQuery<T extends object = any> = (query: Join<T>) => Join<T>;

  export interface GroupQueryObject<T extends object = any> {
    having: (field: string, operator: Operator | any, value?: any) => GroupQueryObject<T>;
  }

  export type GroupQuery<T extends object = any> = (query: GroupQueryObject<T>) => void;

  export type Mapper<T extends object = any> = (item: T, index: number, items: T[]) => any;
}

class DB<T extends object = any> extends Filter<T> {
  protected _query: mongodb.Collection;

  protected _collection!: string;

  protected _pipeline: Array<{ [key: string]: any }> = [];

  protected _mappers: Array<DB.Mapper<T>> = [];

  public get pipeline() {
    return this._pipeline;
  }

  constructor(connection: string) {
    super();

    this._query = getConnection(connection) as any;

    this.map(this._prepareToRead);
  }

  protected _prepareToRead = (document: any): any => {
    if (
      !document ||
      !(object.isObject(document) || typeof document === "object") ||
      date.isDate(document)
    ) return document;

    if (Array.isArray(document)) return document.map(this._prepareToRead);

    return object.mapValues(
      object.mapKeys(document, (value, key) => key === "_id" ? "id" : key),
      (value, key) => isID(key as string) ?
        value && value.toString() :
        this._prepareToRead(value)
    );
  }

  protected _prepareToStore = (document: any): any => {
    if (
      !document ||
      !(object.isObject(document) || typeof document === "object") ||
      date.isDate(document)
    ) return document;

    if (Array.isArray(document)) return document.map(this._prepareToStore);

    return object.mapValues(
      object.mapKeys(document, (value, key) => key === "id" ? "_id" : key),
      (value, key) => isID(key as string) ?
        (
          ObjectId.isValid(value) ?
            new ObjectId(value) :
            this._prepareToStore(value)
        ) :
        this._prepareToStore(value)
    );
  }

  protected _resetFilters() {
    const FILTER = this._filters;

    if (object.size(FILTER) > 0) this._pipeline.push({ $match: FILTER });

    this._filter = {
      $and: [],
    };

    return this;
  }

  /******************************** Collection *******************************/

  public static connection<T extends object = any>(connection: string): DB<T> {
    return new this(connection);
  }

  public static collection<T extends object = any>(collection: string): DB<T> {
    let connection = "default";

    const keys = collection.split(".");

    if (keys.length === 2) {
      connection = keys[0];
      collection = keys[1];
    }

    return this.connection(connection).collection(collection);
  }

  public collection(collection: string) {
    if (!(this._query as any).collection)
      throw new Error("Can't change collection name in the middle of query");

    this._query = ((this._query as any) as mongodb.Db).collection(collection);

    this._collection = collection;

    return this;
  }

  /********************************** Extra **********************************/

  public aggregate(...objects: object[] | object[][]) {
    this._resetFilters();

    this._pipeline.push(...array.deepFlatten(objects));

    return this;
  }

  /*********************************** Joins **********************************/

  public join(
    collection: string,
    query: DB.JoinQuery<T> = q => q.where(makeCollectionId(collection), `${collection}.id`),
    as: string = collection
  ) {
    const join: Join = query(new Join(this._collection, collection, as)) as any;

    this.aggregate(join.pipeline);

    return this;
  }

  /********* Mapping, Ordering, Grouping, Limit, Offset & Pagination *********/

  public map(fn: DB.Mapper<T>) {
    this._mappers.push(fn);

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
  //         [`$${OPERATORS[operator]}`]: prepareValue(field, value),
  //       };

  //       return QUERY;
  //     },
  //   };

  //   query(QUERY);

  //   if (utils.object.isEmpty(MATCH)) return this;

  //   return this.pipeline({ $match: MATCH });
  // }

  public orderBy<K extends keyof T>(field: K, order?: DB.Order): this;
  public orderBy(field: string, order?: DB.Order): this;
  public orderBy(fields: { [field: string]: "asc" | "desc" }): this;
  public orderBy(fields: string | { [field: string]: "asc" | "desc" }, order?: DB.Order) {
    const $sort: { [field: string]: 1 | -1 } = {};

    if (string.isString(fields)) $sort[fields] = (order === "desc" ? -1 : 1);
    else object.forEach(fields, (value, field) => $sort[field] = (value === "desc" ? -1 : 1));

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
    return this
      .skip(page * limit)
      .limit(limit);
  }

  /********************************* Indexes *********************************/

  public indexes(): Promise<any>;
  public indexes(callback: DB.Callback<any>): void;
  public indexes(callback?: DB.Callback<any>) {
    return safeExec(this._query, "indexes", [], callback);
  }

  public index(fieldOrSpec: string | object, options?: mongodb.IndexOptions): Promise<string>;
  public index(fieldOrSpec: string | object, callback: DB.Callback<string>): void;
  public index(fieldOrSpec: string | object, options: mongodb.IndexOptions, callback: DB.Callback<string>): void;
  public index(
    fieldOrSpec: string | object,
    options?: mongodb.IndexOptions | DB.Callback<string>,
    callback?: DB.Callback<string>
  ) {
    return safeExec(this._query, "createIndex", [fieldOrSpec, options], callback);
  }

  public reIndex(): Promise<any>;
  public reIndex(callback: DB.Callback<any>): void;
  public reIndex(callback?: DB.Callback<any>) {
    return safeExec(this._query, "reIndex", [], callback);
  }

  public dropIndex(indexName: string, options?: mongodb.CommonOptions & { maxTimeMS?: number }): Promise<any>;
  public dropIndex(
    indexName: string, options: mongodb.CommonOptions & { maxTimeMS?: number }, callback: DB.Callback<any>
  ): void;
  public dropIndex(
    indexName: string,
    options?: (mongodb.CommonOptions & { maxTimeMS?: number }) | DB.Callback<any>,
    callback?: DB.Callback<any>
  ) {
    return safeExec(this._query, "dropIndex", [indexName, options], callback);
  }

  /*********************************** Read **********************************/

  private _aggregate(options?: mongodb.CollectionAggregationOptions) {
    return this._mappers.reduce(
      (query: any, mapper) => query.map(mapper),
      this._query.aggregate(
        this._pipeline,
        options
      )
    ) as mongodb.AggregationCursor;
  }

  private _filtersOnly() {
    this._resetFilters();

    let filters: { [key: string]: any } = {
      $and: this._pipeline
        .filter(pipe => pipe.$match)
        .map(pipe => pipe.$match),
    };

    if (filters.$and.length === 0) filters = {};

    return filters;
  }

  public count(): Promise<number>;
  public count(callback: DB.Callback<number>): void;
  public async count(callback?: DB.Callback<number>) {
    this.aggregate({ $count: "count" });

    if (callback)
      return this.first((err, res) => {
        if (err) return callback(err, res as any);

        callback(err, res ? (res as any).count : 0);
      });

    const result = await this.first() as any;

    return result ? result.count : 0;
  }

  public exists(): Promise<boolean>;
  public exists(callback: DB.Callback<boolean>): void;
  public async exists(callback?: DB.Callback<boolean>) {
    if (callback) return this.count((err, res) => callback(err, res !== 0));

    return (await this.count()) !== 0;
  }

  public get<K extends keyof T>(fields?: Array<K | string>): Promise<T[]>;
  public get<K extends keyof T>(fields: Array<K | string>, callback: DB.Callback<T[]>): void;
  public get(callback: DB.Callback<T[]>): void;
  public get(fields?: string[] | DB.Callback<T[]>, callback?: DB.Callback<T[]>): Promise<T[]> | void {
    if (func.isFunction(fields)) {
      callback = fields;
      fields = undefined;
    }

    this._resetFilters();

    if (fields) this.aggregate({
      $project: fields.reduce(
        (prev, cur) => (prev[prepareKey(cur)] = 1, prev),
        { _id: 0 } as { [key: string]: any }
      ),
    });

    return safeExec(this._aggregate(), "toArray", [], callback);
  }

  public first<K extends keyof T>(fields?: Array<K | string>): Promise<T>;
  public first<K extends keyof T>(fields: Array<K | string>, callback: DB.Callback<T>): void;
  public first(callback: DB.Callback<T>): void;
  public async first(fields?: string[] | DB.Callback<T>, callback?: DB.Callback<T>) {
    if (func.isFunction(fields)) {
      callback = fields;
      fields = undefined;
    }

    this._resetFilters()
      .limit(1);

    if (callback) return this.get(fields as any, (err, res) =>
      (callback as DB.Callback<T>)(err, res && res[0]));

    return (await this.get(fields))[0];
  }

  public value<K extends keyof T>(field: K): Promise<T[K]>;
  public value(field: string): Promise<any>;
  public value<K extends keyof T>(field: K, callback: DB.Callback<T[K]>): void;
  public value(field: string, callback: DB.Callback<any>): void;
  public value(field: string, callback?: DB.Callback<any>) {
    field = prepareKey(field);

    const keys = field.split(".");

    return safeExec(
      this
        .map((item: any) => keys.reduce((prev, key) => prev[key], item))
        ._resetFilters()
        .aggregate({
          $project: {
            _id: 0,
            [field]: { $ifNull: [`$${field}`, "$__NULL__"] },
          },
        })
        ._aggregate(),
      "toArray",
      [],
      callback
    );
  }

  public pluck<K extends keyof T>(field: K): Promise<T[K]>;
  public pluck(field: string): Promise<any>;
  public pluck<K extends keyof T>(field: K, callback: DB.Callback<T[K]>): void;
  public pluck(field: string, callback: DB.Callback<any>): void;
  public pluck(field: string, callback?: DB.Callback<any>) {
    return this.value(field, callback as any) as any;
  }

  public max<K extends keyof T>(field: K): Promise<T[K]>;
  public max(field: string): Promise<any>;
  public max<K extends keyof T>(field: K, callback: DB.Callback<T[K]>): void;
  public max(field: string, callback: DB.Callback<any>): void;
  public async max(field: string, callback?: DB.Callback<any>) {
    this.aggregate({ $group: { _id: null, max: { $max: `$${field}` } } });

    if (callback)
      return this.first((err, res) => {
        if (err) return callback(err, res as any);

        callback(err, res && (res as any).max);
      });

    const result = await this.first() as any;

    return result && result.max;
  }

  public min<K extends keyof T>(field: K): Promise<T[K]>;
  public min(field: string): Promise<any>;
  public min<K extends keyof T>(field: K, callback: DB.Callback<T[K]>): void;
  public min(field: string, callback: DB.Callback<any>): void;
  public async min(field: string, callback?: DB.Callback<any>) {
    this.aggregate({ $group: { _id: null, min: { $min: `$${field}` } } });

    if (callback)
      return this.first((err, res) => {
        if (err) return callback(err, res as any);

        callback(err, res && (res as any).min);
      });

    const result = await this.first() as any;

    return result && result.min;
  }

  public avg<K extends keyof T>(field: K): Promise<T[K]>;
  public avg(field: string): Promise<any>;
  public avg<K extends keyof T>(field: K, callback: DB.Callback<T[K]>): void;
  public avg(field: string, callback: DB.Callback<any>): void;
  public async avg(field: string, callback?: DB.Callback<any>) {
    this.aggregate({ $group: { _id: null, avg: { $avg: `$${field}` } } });

    if (callback)
      return this.first((err, res) => {
        if (err) return callback(err, res as any);

        callback(err, res && (res as any).avg);
      });

    const result = await this.first() as any;

    return result && result.avg;
  }

  /********************************** Inserts *********************************/

  protected _insertMany(items: T[]): Promise<mongodb.InsertWriteOpResult>;
  protected _insertMany(items: T[], callback: DB.Callback<mongodb.InsertWriteOpResult>): void;
  protected _insertMany(items: T[], callback?: DB.Callback<mongodb.InsertWriteOpResult>) {
    items = this._prepareToStore(items);

    return safeExec(this._query, "insertMany", [items], callback);
    // return this._query.insertMany(items, callback as any) as any;
  }

  protected _insertOne(item: T): Promise<mongodb.InsertOneWriteOpResult>;
  protected _insertOne(item: T, callback: DB.Callback<mongodb.InsertOneWriteOpResult>): void;
  protected _insertOne(item: T, callback?: DB.Callback<mongodb.InsertOneWriteOpResult>) {
    item = this._prepareToStore(item);

    return safeExec(this._query, "insertOne", [item], callback);
    // return this._query.insertOne(item, callback as any) as any;
  }

  public insert(item: T | T[]): Promise<number>;
  public insert(item: T | T[], callback: DB.Callback<number>): void;
  public async insert(item: T | T[], callback?: DB.Callback<number>) {
    if (Array.isArray(item)) {
      if (callback)
        return this._insertMany(item, (err, res) => callback(err, res.insertedCount));

      return (await this._insertMany(item)).insertedCount;
    }

    if (callback)
      return this._insertOne(item, (err, res) => callback(err, res.insertedCount));

    return (await this._insertOne(item)).insertedCount;
  }

  public insertGetId(item: T): Promise<DB.Id>;
  public insertGetId(item: T, callback: DB.Callback<DB.Id>): void;
  public async insertGetId(item: T, callback?: DB.Callback<DB.Id>) {
    if (callback)
      return this._insertOne(item, (err, res) => callback(err, res.insertedId.toString()));

    return (await this._insertOne(item)).insertedId.toString();
  }

  /********************************** Updates *********************************/

  protected async _update(
    update: object,
    callback?: DB.Callback<mongodb.UpdateWriteOpResult>
  ): Promise<mongodb.UpdateWriteOpResult> {
    return safeExec(this._query, "updateMany", [this._filtersOnly(), update], callback);
  }

  public update(update: Partial<T>): Promise<number>;
  public update(update: Partial<T>, callback: DB.Callback<number>): void;
  public async update(update: Partial<T>, callback?: DB.Callback<number>) {
    const _update = {
      $set: this._prepareToStore(update),
    };

    if (callback)
      return this._update(_update, (err, res) => callback(err, res.modifiedCount));

    return (await this._update(_update)).modifiedCount;
  }

  public increment(field: string, count?: number): Promise<number>;
  public increment<K extends keyof T>(field: K, count?: number): Promise<number>;
  public increment(field: string, callback: DB.Callback<number>): void;
  public increment<K extends keyof T>(field: K, callback: DB.Callback<number>): void;
  public increment(field: string, count: number, callback: DB.Callback<number>): void;
  public async increment(
    field: string,
    count: number | DB.Callback<number> = 1,
    callback?: DB.Callback<number>
  ) {
    if (func.isFunction(count)) {
      callback = count;
      count = 1;
    }

    const update = {
      $inc: {
        [field]: count,
      },
    };

    if (callback)
      return this._update(update, (err, res) => (callback as any)(err, res.modifiedCount));

    return (await this._update(update)).modifiedCount;
  }

  public decrement(field: string, count?: number): Promise<number>;
  public decrement<K extends keyof T>(field: K, count?: number): Promise<number>;
  public decrement(field: string, callback: DB.Callback<number>): void;
  public decrement<K extends keyof T>(field: K, callback: DB.Callback<number>): void;
  public decrement(field: string, count: number, callback: DB.Callback<number>): void;
  public decrement(
    field: string,
    count: number | DB.Callback<number> = 1,
    callback?: DB.Callback<number>
  ) {
    if (func.isFunction(count)) {
      callback = count;
      count = 1;
    }

    return this.increment(field, -count, callback as any) as any;
  }

  /********************************** Deletes *********************************/

  public delete(): Promise<number>;
  public delete(callback: DB.Callback<number>): void;
  public async delete(callback?: DB.Callback<number>) {
    if (callback) return safeExec(this._query, "deleteMany", [this._filtersOnly()], (err, res) => {
      if (err) return callback(err, res);

      callback(err, res.deletedCount);
    });

    return (await safeExec(this._query, "deleteMany", [this._filtersOnly()])).deletedCount;
  }
}

export = DB;
