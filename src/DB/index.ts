import * as mongodb from "mongodb";
import { connection as getConnection } from "../Connect";
import { date, function as func, isID, makeTableId, object, prepareKey } from "../utils";
import Filter from "./Filter";
import Join from "./Join";

const ObjectId = mongodb.ObjectId;

namespace DB {
  export type Callback<T = any> = (error: Error, result: T) => void;

  export type Operator = "<" | "<=" | "=" | "<>" | ">=" | ">";

  export type Order = "asc" | "desc";

  export type Id = string;

  export interface Filter {
    where(query: FilterQuery): this;
    where(field: string, value: any): this;
    where(field: string, operator: Operator, value: any): this;

    orWhere(query: FilterQuery): this;
    orWhere(field: string, value: any): this;
    orWhere(field: string, operator: Operator, value: any): this;

    whereLike(field: string, value: any): this;

    whereNotLike(field: string, value: any): this;

    whereIn(field: string, values: any[]): this;

    whereNotIn(field: string, values: any[]): this;

    whereBetween(field: string, start: any, end: any): this;

    whereNotBetween(field: string, start: any, end: any): this;

    whereNull(field: string): this;

    whereNotNull(field: string): this;
  }

  export type FilterQuery = (query: Filter) => Filter;

  export interface Join<T = any> extends Filter {
    join(table: string, query?: JoinQuery<T>, as?: string): this;

    whereIn(field: string, embeddedField: string): this;
    whereIn(field: string, values: any[]): this;

    whereNotIn(field: string, embeddedField: string): this;
    whereNotIn(field: string, values: any[]): this;
  }

  export type JoinQuery<T = any> = (query: Join<T>) => Join<T>;

  export interface GroupQueryObject<T = any> {
    having: (field: string, operator: Operator | any, value?: any) => GroupQueryObject<T>;
  }

  export type GroupQuery<T = any> = (query: GroupQueryObject<T>) => void;

  export type Mapper<T = any> = (item: T, index: number, items: T[]) => any;
}

class DB<T extends object = any> extends Filter {
  protected _query: mongodb.Collection;

  protected _collection!: string;

  protected _pipeline: Array<{ [key: string]: any }> = [];

  protected _mappers: Array<DB.Mapper<T>> = [];

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

  public static connection(connection: string) {
    return new this(connection);
  }

  public static collection(collection: string) {
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

  public pipeline(...objects: object[]) {
    this._pipeline.push(...objects);

    return this;
  }

  /*********************************** Joins **********************************/

  public join(
    collection: string,
    query: DB.JoinQuery<T> = q => q.where(makeTableId(collection), `${collection}.id`),
    as: string = collection
  ) {
    const join: Join = query(new Join(this._collection, collection, as)) as any;

    this._resetFilters();

    this._pipeline.push(join.pipeline);

    return this;
  }

  /*************** Mapping, Ordering, Grouping, Limit & Offset ***************/

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

  public orderBy(field: string, order?: DB.Order) {
    return this._resetFilters()
      .pipeline({ $sort: { [field]: order === "desc" ? -1 : 1 } });
  }

  public skip(offset: number) {
    return this._resetFilters()
      .pipeline({ $skip: offset });
  }

  public offset(offset: number) {
    return this.skip(offset);
  }

  public limit(limit: number) {
    return this._resetFilters()
      .pipeline({ $limit: limit });
  }

  public take(limit: number) {
    return this.limit(limit);
  }

  /*********************************** Read **********************************/

  private _aggregate(options?: mongodb.CollectionAggregationOptions) {
    this._resetFilters();

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
  public count(callback?: DB.Callback<number>): Promise<number> | void {
    return this._query.countDocuments(this._filtersOnly(), callback as any);
  }

  public exists(): Promise<boolean>;
  public exists(callback: DB.Callback<boolean>): void;
  public async exists(callback?: DB.Callback<boolean>) {
    if (callback) return this.count((err, res) => callback(err, res !== 0));

    return (await this.count()) !== 0;
  }

  public get(fields?: string[]): Promise<T[]>;
  public get(fields: string[], callback: DB.Callback<T[]>): void;
  public get(callback: DB.Callback<T[]>): void;
  public get(fields?: string[] | DB.Callback<T[]>, callback?: DB.Callback<T[]>): Promise<T[]> | void {
    if (func.isFunction(fields)) {
      callback = fields;
      fields = undefined;
    }

    if (fields) this.pipeline({
      $project: fields.reduce(
        (prev, cur) => (prev[prepareKey(cur)] = 1, prev),
        { _id: 0 } as { [key: string]: any }
      ),
    });

    return this._aggregate()
      .toArray(callback as any);
  }

  public first(fields?: string[]): Promise<T>;
  public first(fields: string[], callback: DB.Callback<T>): void;
  public first(callback: DB.Callback<T>): void;
  public async first(fields?: string[] | DB.Callback<T>, callback?: DB.Callback<T>) {
    if (func.isFunction(fields)) {
      callback = fields;
      fields = undefined;
    }

    this.limit(1);

    if (callback) return this.get(fields as any, (err, res) =>
      (callback as DB.Callback<T>)(err, res && res[0]));

    return (await this.get(fields))[0];
  }

  public value(field: string): Promise<any>;
  public value(field: string, callback: DB.Callback<any>): void;
  public value(field: string, callback?: DB.Callback<any>) {
    field = prepareKey(field);

    const keys = field.split(".");

    return this
      .map((item: any) => keys.reduce((prev, key) => prev[key], item))
      .pipeline({
        $project: {
          _id: 0,
          [field]: { $ifNull: [`$${field}`, "$__NULL__"] },
        },
      })
      ._aggregate()
      .toArray(callback as any) as any;
  }

  public pluck(field: string): Promise<any>;
  public pluck(field: string, callback: DB.Callback<any>): void;
  public pluck() {
    return this.value.apply(this, arguments);
  }

  public max(field: string): Promise<any>;
  public max(field: string, callback: DB.Callback<any>): void;
  public async max(field: string, callback?: DB.Callback<any>) {
    this._resetFilters()
      .pipeline({ $group: { _id: null, max: { $max: `$${field}` } } });

    if (callback)
      return this.first((err, res) => {
        if (err) return callback(err, res);

        callback(err, (res as any).max);
      });

    return ((await this.first()) as any).max;
  }

  public min(field: string): Promise<any>;
  public min(field: string, callback: DB.Callback<any>): void;
  public async min(field: string, callback?: DB.Callback<any>) {
    this._resetFilters()
      .pipeline({ $group: { _id: null, min: { $min: `$${field}` } } });

    if (callback)
      return this.first((err, res) => {
        if (err) return callback(err, res);

        callback(err, (res as any).min);
      });

    return ((await this.first()) as any).min;
  }

  public avg(field: string): Promise<any>;
  public avg(field: string, callback: DB.Callback<any>): void;
  public async avg(field: string, callback?: DB.Callback<any>) {
    this._resetFilters()
      .pipeline({ $group: { _id: null, avg: { $avg: `$${field}` } } });

    if (callback)
      return this.first((err, res) => {
        if (err) return callback(err, res);

        callback(err, (res as any).avg);
      });

    return ((await this.first()) as any).avg;
  }

  /********************************** Inserts *********************************/

  protected _insertMany(item: T[]): Promise<mongodb.InsertWriteOpResult>;
  protected _insertMany(item: T[], callback: DB.Callback<mongodb.InsertWriteOpResult>): void;
  protected _insertMany(item: T[], callback?: DB.Callback<mongodb.InsertWriteOpResult>) {
    item = this._prepareToStore(item);

    return this._query.insertMany(item, callback as any) as any;
  }

  protected _insertOne(item: T): Promise<mongodb.InsertOneWriteOpResult>;
  protected _insertOne(item: T, callback: DB.Callback<mongodb.InsertOneWriteOpResult>): void;
  protected _insertOne(item: T, callback?: DB.Callback<mongodb.InsertOneWriteOpResult>) {
    item = this._prepareToStore(item);

    return this._query.insertOne(item, callback as any) as any;
  }

  public insert(item: T | T[]): Promise<number>;
  public insert(item: T | T[], callback: DB.Callback<number>): void;
  public  async insert(item: T | T[], callback?: DB.Callback<number>) {
    if (Array.isArray(item)) {
      if (callback)
        return this._insertMany(item, (err, res) => callback(err, res.insertedCount));

      return (await this._insertMany(item)).insertedCount;
    }

    if (callback)
      return this._insertOne(item, (err, res) => callback(err, res.insertedCount));

    return (await this._insertOne(item)).insertedCount;
  }

  public insertGetId(item: T): Promise<string>;
  public insertGetId(item: T, callback: DB.Callback<string>): void;
  public async insertGetId(item: T, callback?: DB.Callback<string>) {
    if (callback)
      return this._insertOne(item, (err, res) => callback(err, res.insertedId.toString()));

    return (await this._insertOne(item)).insertedId.toString();
  }

  /********************************** Updates *********************************/

  protected async _update(
    update: object,
    callback?: DB.Callback<mongodb.UpdateWriteOpResult>
  ): Promise<mongodb.UpdateWriteOpResult> {
    if (callback)
      return this._query.updateMany(this._filtersOnly(), update, callback) as any;

    return await this._query.updateMany(this._filtersOnly(), update);
  }

  public update(update: T): Promise<number>;
  public update(update: T, callback: DB.Callback<number>): void;
  public async update(update: T, callback?: DB.Callback<number>) {
    const _update = {
      $set: this._prepareToStore(update),
    };

    if (callback)
      return this._update(_update, (err, res) => callback(err, res.modifiedCount));

    return (await this._update(_update)).modifiedCount;
  }

  public increment(field: string, count?: number): Promise<number>;
  public increment(field: string, callback: DB.Callback<number>): void;
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
  public decrement(field: string, callback: DB.Callback<number>): void;
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

    return this.increment.call(this, field, -count, callback);
  }

  /********************************** Deletes *********************************/

  public delete(): Promise<number>;
  public delete(callback: DB.Callback<number>): void;
  public async delete(callback?: DB.Callback<number>) {
    if (callback)
      return this._query.deleteMany(
        this._filtersOnly(),
        (err, res: any) => callback(err, res.deletedCount)
      );

    return (await this._query.deleteMany(this._filtersOnly())).deletedCount;
  }
}

export = DB;
