import * as deasync from "deasync";
import * as mongodb from "mongodb";
import { connect, Query } from "../../../connections";
import * as utils from "../../../utils";
import Base from "../../Driver";
import { isID, OPERATORS, prepareKey, prepareValue } from "../utils";
import Filter from "./Filter";
import Join from "./Join";

const { ObjectId } = mongodb;

class Driver<T = any> extends Base<T> {
  public static connect(con: connect.Connection) {
    if (con.connection)
      return () => new this((con.connection as mongodb.MongoClient).db(con.database));

    const uri = `mongodb://${con.host || "127.0.0.1"}:${con.port || "27017"}/admin`;

    const server = <mongodb.MongoClient>deasync(mongodb.MongoClient.connect)(uri, {
      useNewUrlParser: true,
      auth: con.user && con.password ? {
        user: con.user,
        password: con.password,
      } : undefined,
    });

    return () => new this(server.db(con.database));
  }

  protected _table!: string;

  public readonly driver = "MongoDB";

  protected _query!: mongodb.Collection;

  protected _filter = new Filter();

  private _pipeline: object[] = [];

  private _mappers: Array<Base.Mapper<T>> = [];

  protected get _filters() {
    return this._filter.filters;
  }

  constructor(query: Query) {
    super(query);

    this.map(this._prepareToRead);
  }

  private _prepareToRead = (document: any): any => {
    if (
      !document ||
      !(utils.object.isObject(document) || typeof document === "object") ||
      utils.date.isDate(document)
    ) return document;

    if (Array.isArray(document)) return document.map(this._prepareToRead);

    return utils.object.mapValues(
      utils.object.mapKeys(document, (value, key) => key === "_id" ? "id" : key),
      (value, key) => isID(key as string) ?
        value && value.toString() :
        this._prepareToRead(value)
    );
  }

  private _prepareToStore = (document: any): any => {
    if (
      !document ||
      !(utils.object.isObject(document) || typeof document === "object") ||
      utils.date.isDate(document)
    ) return document;

    if (Array.isArray(document)) return document.map(this._prepareToStore);

    return utils.object.mapValues(
      utils.object.mapKeys(document, (value, key) => key === "id" ? "_id" : key),
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

    if (utils.object.size(FILTER) > 0) {
      this._pipeline.push({ $match: FILTER });

      this._filter = new Filter();
    }

    return this;
  }

  public table(table: string) {
    if (!(this._query as any).collection)
      throw new Error("Can't change table name in the middle of query");

    this._query = ((this._query as any) as mongodb.Db).collection(table);

    this._table = table;

    return this;
  }

  /*********************************** Extra **********************************/

  public pipeline(...objs: object[]) {
    this._pipeline.push(...objs);

    return this;
  }

  /*********************************** Joins **********************************/

  public join(
    table: string,
    query: Base.JoinQuery<T> = q => q.where(utils.makeTableId(table), `${table}.id`),
    as: string = table
  ) {
    const join: Join = query(new Join(this._table, table, as)) as any;

    this._resetFilters();

    this._pipeline.push(join.pipeline);

    return this;
  }

  /******************************* Where Clauses ******************************/

  public where(query: Base.FilterQuery): this;
  public where(field: string, value: any): this;
  public where(field: string, operator: Base.Operator, value: any): this;
  public where() {
    this._filter = this._filter.where.apply(this._filter, arguments);

    return this;
  }

  public orWhere(query: Base.FilterQuery): this;
  public orWhere(field: string, value: any): this;
  public orWhere(field: string, operator: Base.Operator, value: any): this;
  public orWhere() {
    this._filter = this._filter.orWhere.apply(this._filter, arguments);

    return this;
  }

  public whereLike(field: string, value: any): this;
  public whereLike() {
    this._filter = this._filter.whereLike.apply(this._filter, arguments);

    return this;
  }

  public whereNotLike(field: string, value: any): this;
  public whereNotLike() {
    this._filter = this._filter.whereNotLike.apply(this._filter, arguments);

    return this;
  }

  public whereIn(field: string, values: any[]): this;
  public whereIn() {
    this._filter = this._filter.whereIn.apply(this._filter, arguments);

    return this;
  }

  public whereNotIn(field: string, values: any[]): this;
  public whereNotIn() {
    this._filter = this._filter.whereNotIn.apply(this._filter, arguments);

    return this;
  }

  public whereBetween(field: string, start: any, end: any): this;
  public whereBetween() {
    this._filter = this._filter.whereBetween.apply(this._filter, arguments);

    return this;
  }

  public whereNotBetween(field: string, start: any, end: any): this;
  public whereNotBetween() {
    this._filter = this._filter.whereNotBetween.apply(this._filter, arguments);

    return this;
  }

  public whereNull(field: string): this;
  public whereNull() {
    this._filter = this._filter.whereNull.apply(this._filter, arguments);

    return this;
  }

  public whereNotNull(field: string): this;
  public whereNotNull() {
    this._filter = this._filter.whereNotNull.apply(this._filter, arguments);

    return this;
  }

  /*************** Mapping, Ordering, Grouping, Limit & Offset ****************/

  public map(fn: Base.Mapper<T>) {
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

  public orderBy(field: string, order?: Base.Order) {
    return this.pipeline({ $sort: { [field]: order === "desc" ? -1 : 1 } });
  }

  public skip(offset: number) {
    return this.pipeline({ $skip: offset });
  }

  public limit(limit: number) {
    return this.pipeline({ $limit: limit });
  }

  /*********************************** Read ***********************************/

  private _aggregate(options?: mongodb.CollectionAggregationOptions) {
    // FIXME: the mongodb typing has a bug i think (aggregation mapping)
    return this._mappers.reduce(
      (query: any, mapper) => query.map(mapper),
      this._query.aggregate(
        [
          { $match: this._filters },
          ...this._pipeline,
        ],
        options
      )
    ) as mongodb.AggregationCursor;
  }

  public exists(): Promise<boolean>;
  public exists(callback: mongodb.MongoCallback<boolean>): void;
  public async exists(callback?: mongodb.MongoCallback<boolean>) {
    if (callback) return this.count((err, res) => callback(err, res !== 0));

    return (await this.count()) !== 0;
  }

  public count(): Promise<number>;
  public count(callback: mongodb.MongoCallback<number>): void;
  public count(callback?: mongodb.MongoCallback<number>): Promise<number> | void {
    return this._query.countDocuments(this._filters, callback as any);
  }

  public get(fields?: string[]): Promise<T[]>;
  public get(fields: string[], callback: mongodb.MongoCallback<T[]>): void;
  public get(callback: mongodb.MongoCallback<T[]>): void;
  public get(
    fields?: string[] | mongodb.MongoCallback<T[]>,
    callback?: mongodb.MongoCallback<T[]>
  ): Promise<T[]> | void {
    if (utils.function.isFunction(fields)) {
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
  public first(fields: string[], callback: mongodb.MongoCallback<T>): void;
  public first(callback: mongodb.MongoCallback<T>): void;
  public async first(
    fields?: string[] | mongodb.MongoCallback<T>,
    callback?: mongodb.MongoCallback<T>
  ) {
    if (utils.function.isFunction(fields)) {
      callback = fields;
      fields = undefined;
    }

    this.limit(1);

    if (fields) this.pipeline({
      $project: fields.reduce(
        (prev, cur) => (prev[prepareKey(cur)] = 1, prev),
        { _id: 0 } as { [key: string]: any }
      ),
    });

    if (callback) return this._aggregate().toArray((err, res) => err
      ? (callback as mongodb.MongoCallback<T>)(err, res as any)
      : (callback as mongodb.MongoCallback<T>)(err, res[0]
      ));

    return (await this._aggregate().toArray())[0];
  }

  public value(field: string): Promise<any>;
  public value(field: string, callback: mongodb.MongoCallback<any>): void;
  public value(field: string, callback?: mongodb.MongoCallback<any>) {
    field = prepareKey(field);

    const keys = field.split(".");

    return this.pipeline(
      {
        $project: {
          _id: 0,
          [field]: { $ifNull: [`$${field}`, "$__NULL__"] },
        },
      }
    ).map((item: any) => keys.reduce((prev, key) => prev[key], item))
      ._aggregate()
      .toArray(callback as any) as any;
  }

  public max(field: string): Promise<any>;
  public max(field: string, callback: mongodb.MongoCallback<any>): void;
  public async max(field: string, callback?: mongodb.MongoCallback<any>) {
    const query = this.pipeline({ $group: { _id: null, max: { $max: `$${field}` } } })
      ._aggregate();

    if (callback)
      return query.toArray((err, res) => {
        if (err) return callback(err, res);

        callback(err, res[0].max);
      });

    return (await query.toArray())[0].max;
  }

  public min(field: string): Promise<any>;
  public min(field: string, callback: mongodb.MongoCallback<any>): void;
  public async min(field: string, callback?: mongodb.MongoCallback<any>) {
    const query = this.pipeline({ $group: { _id: null, min: { $min: `$${field}` } } })
      ._aggregate();

    if (callback)
      return query.toArray((err, res) => {
        if (err) return callback(err, res);

        callback(err, res[0].min);
      });

    return (await query.toArray())[0].min;
  }

  public avg(field: string): Promise<any>;
  public avg(field: string, callback: mongodb.MongoCallback<any>): void;
  public async avg(field: string, callback?: mongodb.MongoCallback<any>) {
    const query = this.pipeline({ $group: { _id: null, avg: { $avg: `$${field}` } } })
      ._aggregate();

    if (callback)
      return query.toArray((err, res) => {
        if (err) return callback(err, res);

        callback(err, res[0].avg);
      });

    return (await query.toArray())[0].avg;
  }

  /********************************** Inserts *********************************/

  public insert(item: T | T[]): Promise<number>;
  public insert(item: T | T[], callback: mongodb.MongoCallback<number>): void;
  public async insert(item: T | T[], callback?: mongodb.MongoCallback<number>) {
    item = this._prepareToStore(item);

    if (Array.isArray(item)) {
      if (callback)
        return this._query.insertMany(item, (err, res) => callback(err, res.insertedCount));

      return (await this._query.insertMany(item)).insertedCount;
    }

    if (callback)
      return this._query.insertOne(item, (err, res) => callback(err, res.insertedCount));

    return (await this._query.insertOne(item)).insertedCount;
  }

  public insertGetId(item: T): Promise<string>;
  public insertGetId(item: T, callback: mongodb.MongoCallback<string>): void;
  public async insertGetId(item: T, callback?: mongodb.MongoCallback<string>) {
    item = this._prepareToStore(item);

    if (callback)
      return this._query.insertOne(item, (err, res) => callback(err, res.insertedId.toString()));

    return (await this._query.insertOne(item)).insertedId.toString();
  }

  /********************************** Updates *********************************/

  private async _update(
    update: object,
    callback?: mongodb.MongoCallback<mongodb.UpdateWriteOpResult>
  ): Promise<mongodb.UpdateWriteOpResult> {
    if (callback)
      return this._query.updateMany(this._filters, update, callback) as any;

    return await this._query.updateMany(this._filters, update);
  }

  public update(update: T): Promise<number>;
  public update(update: T, callback: mongodb.MongoCallback<number>): void;
  public async update(update: T, callback?: mongodb.MongoCallback<number>) {
    const _update = {
      $set: this._prepareToStore(update),
    };

    if (callback)
      return this._update(_update, (err, res) => callback(err, res.modifiedCount));

    return (await this._update(_update)).modifiedCount;
  }

  public increment(field: string, count?: number): Promise<number>;
  public increment(field: string, callback: mongodb.MongoCallback<number>): void;
  public increment(field: string, count: number, callback: mongodb.MongoCallback<number>): void;
  public async increment(
    field: string,
    count?: number | mongodb.MongoCallback<number>,
    callback?: mongodb.MongoCallback<number>
  ) {
    if (count === undefined) count = 1;
    else if (utils.function.isFunction(count)) {
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

  /********************************** Deletes *********************************/

  public delete(): Promise<number>;
  public delete(callback: mongodb.MongoCallback<number>): void;
  public async delete(callback?: mongodb.MongoCallback<number>) {
    if (callback)
      return this._query.deleteMany(
        this._filters,
        (err, res: any) => callback(err, res.deletedCount)
      );

    return (await this._query.deleteMany(this._filters)).deletedCount;
  }
}

export default Driver;
