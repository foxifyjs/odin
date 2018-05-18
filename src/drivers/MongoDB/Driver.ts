import * as deasync from "deasync";
import * as mongodb from "mongodb";
import { connect, Query } from "../../connections";
import * as utils from "../../utils";
import Base from "../Driver";

const { ObjectId } = mongodb;

const isID = (id: string) => /(_id$|^id$)/.test(id);

const OPERATORS: { [operator: string]: string } = {
  "<": "lt",
  "<=": "lte",
  "=": "eq",
  "<>": "ne",
  ">=": "gte",
  ">": "gt",
};

module Driver {
  export interface Filters<T = any> {
    $and?: Array<mongodb.FilterQuery<T>>;
    $or?: Array<mongodb.FilterQuery<T>>;
    [operator: string]: any;
  }
}

interface Driver<T = any> extends Base<T> {
  /*********************************** Joins **********************************/

  /******************************* Where Clauses ******************************/

  /*************** Mapping, Ordering, Grouping, Limit & Offset ****************/

  /*********************************** Read ***********************************/

  exists(): Promise<boolean>;
  exists(callback: mongodb.MongoCallback<boolean>): void;

  count(): Promise<number>;
  count(callback: mongodb.MongoCallback<number>): void;

  get(fields?: string[]): Promise<T[]>;
  get(fields: string[], callback: mongodb.MongoCallback<T[]>): void;
  get(callback: mongodb.MongoCallback<T[]>): void;

  first(fields?: string[]): Promise<T>;
  first(fields: string[], callback: mongodb.MongoCallback<T>): void;
  first(callback: mongodb.MongoCallback<T>): void;

  value(field: string): Promise<any>;
  value(field: string, callback: mongodb.MongoCallback<any>): void;

  max(field: string): Promise<any>;
  max(field: string, callback: mongodb.MongoCallback<any>): void;

  min(field: string): Promise<any>;
  min(field: string, callback: mongodb.MongoCallback<any>): void;

  avg(field: string): Promise<any>;
  avg(field: string, callback: mongodb.MongoCallback<any>): void;

  /********************************** Inserts *********************************/

  insert(item: T | T[]): Promise<number>;
  insert(item: T | T[], callback: mongodb.MongoCallback<number>): void;

  insertGetId(item: T): Promise<mongodb.ObjectId>;
  insertGetId(item: T, callback: mongodb.MongoCallback<mongodb.ObjectId>): void;

  /********************************** Updates *********************************/

  update(update: T): Promise<number>;
  update(update: T, callback: mongodb.MongoCallback<number>): void;

  increment(field: string, count?: number): Promise<number>;
  increment(field: string, callback: mongodb.MongoCallback<number>): void;
  increment(field: string, count: number, callback: mongodb.MongoCallback<number>): void;

  /********************************** Deletes *********************************/

  delete(): Promise<number>;
  delete(callback: mongodb.MongoCallback<number>): void;
}

class Driver<T = any> extends Base<T> {
  static connect(con: connect.Connection) {
    if (con.connection)
      return () => new this(
        (con.connection as mongodb.MongoClient).db(con.database),
      );

    let uri = "mongodb://";

    if (con.user && con.password)
      uri += `${
        con.user
        }:${
        con.password
        }@`;

    uri += `${
      con.host || "127.0.0.1"
      }:${
      con.port || "27017"
      }/${
      con.database
      }`;

    const server = <mongodb.MongoClient>deasync(mongodb.MongoClient.connect)(uri);

    return () => new this(server.db(con.database));
  }

  get driver(): "MongoDB" {
    return "MongoDB";
  }

  protected _query!: mongodb.Collection;

  protected _filters: Driver.Filters = {
    $and: [],
  };

  private _pipeline: object[] = [];

  private _mappers: Array<Base.Mapper<T>> = [];

  protected get _filter() {
    const filter = {
      ...this._filters,
    };

    if (filter.$and && filter.$and.length === 0) delete filter.$and;

    return filter;
  }

  constructor(query: Query) {
    super(query);

    this.map(this._prepareToRead);
  }

  private _prepareToRead = (document: any): any => {
    if (
      !document ||
      !utils.object.isInstance(document) ||
      utils.date.isInstance(document)
    ) return document;

    if (Array.isArray(document)) return document.map(this._prepareToRead);

    if ((document as any)._id) {
      document = {
        id: (document as any)._id,
        ...document,
      };

      delete document._id;
    }

    return utils.object.map(
      document,
      (value, key) => isID(key as string) ?
        value.toString() :
        this._prepareToRead(value),
    );
  }

  private _prepareToStore = (document: any): any => {
    if (
      !document ||
      !utils.object.isInstance(document) ||
      utils.date.isInstance(document)
    ) return document;

    if (Array.isArray(document)) return document.map(this._prepareToStore);

    if ((document as any).id) {
      document = {
        _id: (document as any).id,
        ...document,
      };

      delete document.id;
    }

    return utils.object.map(
      document,
      (value, key) => isID(key as string) ?
        (
          ObjectId.isValid(value) ?
            new ObjectId(value) :
            this._prepareToStore(value)
        ) :
        this._prepareToStore(value),
    );
  }

  table(table: string) {
    if (!(this._query as any).collection)
      throw new Error("Can't change table name in the middle of query");

    this._query = ((this._query as any) as mongodb.Db).collection(table);

    return this;
  }

  /*********************************** Extra **********************************/

  pipeline(...objs: object[]) {
    this._pipeline.push(...objs);

    return this;
  }

  /*********************************** Joins **********************************/

  join(
    table: string,
    localKey: string = utils.makeTableId(table),
    foreignKey: string = "id",
    as: string = table,
  ) {
    return this.pipeline({
      $lookup:
        {
          from: table,
          localField: localKey === "id" ? "_id" : localKey,
          foreignField: foreignKey === "id" ? "_id" : foreignKey,
          as,
        },
    });
  }

  /******************************* Where Clauses ******************************/

  private _push_filter(operator: "and" | "or", value: any) {
    const filters = { ...this._filters };

    if (operator === "and" && filters.$or) {
      filters.$and = [this._filters];
      delete filters.$or;
    } else if (operator === "or" && filters.$and) {
      filters.$or = [this._filters];
      delete filters.$and;
    }

    filters[`$${operator}`].push(value);

    this._filters = filters;

    return this;
  }

  private _where(field: string, operator: string, value: any) {
    if (isID(field)) {
      if (field === "id") field = "_id";

      if (utils.string.isInstance(value)) value = new ObjectId(value);
      else if (Array.isArray(value)) value = value.map((v) => new ObjectId(v));
    }

    return this._push_filter("and", {
      [field]: {
        [`$${operator}`]: value,
      },
    });
  }

  private _or_where(field: string, operator: string, value: any) {
    if (isID(field)) {
      if (field === "id") field = "_id";

      if (utils.string.isInstance(value)) value = new ObjectId(value);
      else if (Array.isArray(value)) value = value.map((v) => new ObjectId(v));
    }

    return this._push_filter("or", {
      [field]: {
        [`$${operator}`]: value,
      },
    });
  }

  where(field: string, operator: Base.Operator | any, value?: any) {
    if (value === undefined) {
      value = operator;
      operator = "=";
    }

    return this._where(field, OPERATORS[operator], value);
  }

  orWhere(field: string, operator: Base.Operator | any, value?: any) {
    if (value === undefined) {
      value = operator;
      operator = "=";
    }

    return this._or_where(field, OPERATORS[operator], value);
  }

  whereLike(field: string, value: any) {
    if (!(value instanceof RegExp)) value = new RegExp(value, "i");

    return this._where(field, "regex", value);
  }

  whereNotLike(field: string, value: any) {
    if (!(value instanceof RegExp)) value = new RegExp(value, "i");

    return this._where(field, "not", value);
  }

  whereIn(field: string, values: any[]) {
    return this._where(field, "in", values);
  }

  whereNotIn(field: string, values: any[]) {
    return this._where(field, "nin", values);
  }

  whereBetween(field: string, start: any, end: any) {
    return this._where(field, "gte", start)
      ._where(field, "lte", end);
  }

  whereNotBetween(field: string, start: any, end: any) {
    return this._where(field, "lt", start)
      ._or_where(field, "gt", end);
  }

  whereNull(field: string) {
    return this._where(field, "eq", null);
  }

  whereNotNull(field: string) {
    return this._where(field, "ne", null);
  }

  /*************** Mapping, Ordering, Grouping, Limit & Offset ****************/

  map(fn: Base.Mapper<T>) {
    this._mappers.push(fn);

    return this;
  }

  orderBy(field: string, order?: Base.Order) {
    return this.pipeline({ $sort: { [field]: order === "desc" ? -1 : 1 } });
  }

  skip(offset: number) {
    return this.pipeline({ $skip: offset });
  }

  limit(limit: number) {
    return this.pipeline({ $limit: limit });
  }

  /*********************************** Read ***********************************/

  private _aggregate(options?: mongodb.CollectionAggregationOptions) {
    // FIXME the mongodb typing has a bug i think
    let query: any = this._query.aggregate(
      [
        { $match: this._filter },
        ...this._pipeline,
      ],
      options,
    );

    this._mappers.map((mapper) => query = query.map(mapper));

    return query as mongodb.AggregationCursor;
  }

  async exists(callback?: mongodb.MongoCallback<boolean>) {
    if (callback) return this.count((err, res) => callback(err, res !== 0));

    return (await this.count()) !== 0;
  }

  count(callback?: mongodb.MongoCallback<number>): Promise<number> | void {
    return this._query.count(this._filter, callback as any);
  }

  get(
    fields?: string[] | mongodb.MongoCallback<T[]>,
    callback?: mongodb.MongoCallback<T[]>,
  ): Promise<T[]> | void {
    if (utils.function.isInstance(fields)) {
      callback = fields;
      fields = undefined;
    }

    if (fields) this.pipeline({
      $project: fields.reduce((prev, cur) => ({
        ...prev,
        [cur === "id" ? "_id" : cur]: 1,
      }), { _id: 0 }),
    });

    return this._aggregate()
      .toArray(callback as any);
  }

  async first(fields?: string[] | mongodb.MongoCallback<T>, callback?: mongodb.MongoCallback<T>) {
    if (utils.function.isInstance(fields)) {
      callback = fields;
      fields = undefined;
    }

    this.limit(1);

    if (fields) this.pipeline({
      $project: fields.reduce((prev, cur) => ({
        ...prev,
        [cur === "id" ? "_id" : cur]: 1,
      }), { _id: 0 }),
    });

    // @ts-ignore:next-line
    if (callback) return this._aggregate().toArray((err, res) => err ? callback(err, res) : callback(err, res[0]));

    return (await this._aggregate().toArray())[0];
  }

  value(field: string, callback?: mongodb.MongoCallback<any>) {
    const keys = field.split(".");

    return this.pipeline({
      $project: {
        _id: 0,
        [field === "id" ? "_id" : field]: 1,
      },
    }).map((item: any) => keys.reduce((prev, key) => prev[key], item))
      ._aggregate()
      .toArray(callback as any) as any;
  }

  async max(field: string, callback?: mongodb.MongoCallback<any>) {
    const query = this.pipeline({ $group: { _id: null, max: { $max: `$${field}` } } })
      ._aggregate();

    if (callback)
      return query.toArray((err, res) => {
        if (err) return callback(err, res);

        callback(err, res[0].max);
      });

    return (await query.toArray())[0].max;
  }

  async min(field: string, callback?: mongodb.MongoCallback<any>) {
    const query = this.pipeline({ $group: { _id: null, min: { $min: `$${field}` } } })
      ._aggregate();

    if (callback)
      return query.toArray((err, res) => {
        if (err) return callback(err, res);

        callback(err, res[0].min);
      });

    return (await query.toArray())[0].min;
  }

  async avg(field: string, callback?: mongodb.MongoCallback<any>) {
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

  async insert(item: T | T[], callback?: mongodb.MongoCallback<number>) {
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

  async insertGetId(item: T, callback?: mongodb.MongoCallback<mongodb.ObjectId>) {
    item = this._prepareToStore(item);

    if (callback)
      return this._query.insertOne(item, (err, res) => callback(err, res.insertedId));

    return (await this._query.insertOne(item)).insertedId;
  }

  /********************************** Updates *********************************/

  private async _update(
    update: object,
    callback?: mongodb.MongoCallback<mongodb.UpdateWriteOpResult>,
  ): Promise<mongodb.UpdateWriteOpResult> {
    if (callback)
      return this._query.updateMany(this._filter, update, callback) as any;

    return await this._query.updateMany(this._filter, update);
  }

  async update(update: T, callback?: mongodb.MongoCallback<number>) {
    const _update = {
      $set: this._prepareToStore(update),
    };

    if (callback)
      return this._update(_update, (err, res) => callback(err, res.modifiedCount));

    return (await this._update(_update)).modifiedCount;
  }

  async increment(
    field: string,
    count?: number | mongodb.MongoCallback<number>,
    callback?: mongodb.MongoCallback<number>,
  ) {
    if (count === undefined) count = 1;
    else if (utils.function.isInstance(count)) {
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

  async delete(callback?: mongodb.MongoCallback<number>) {
    if (callback)
      return this._query.deleteMany(this._filter, (err, res: any) => callback(err, res.deletedCount));

    return (await this._query.deleteMany(this._filter)).deletedCount;
  }
}

export default Driver;
