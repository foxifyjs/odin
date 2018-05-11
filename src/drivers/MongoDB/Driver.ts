import * as deasync from "deasync";
import * as mongodb from "mongodb";
import { connect } from "../../connections";
import * as utils from "../../utils";
import Base from "../Driver";

module Driver {
  export interface Filters<T = any> {
    $and?: Array<mongodb.FilterQuery<T>>;
    $or?: Array<mongodb.FilterQuery<T>>;
    [operator: string]: any;
  }
}

interface Driver<T = any> {
  /*********************************** Joins **********************************/

  /******************************* Where Clauses ******************************/

  /******************** Ordering, Grouping, Limit & Offset ********************/

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
  static connect(connection: connect.Connection): <T = any>() => Driver<T> {
    let uri = "mongodb://";

    if (connection.user && connection.password)
      uri += `${
        connection.user
        }:${
        connection.password
        }@`;

    uri += `${
      connection.host || "127.0.0.1"
      }:${
      connection.port || "27017"
      }/${
      connection.database
      }`;

    const server = <mongodb.MongoClient>deasync(mongodb.MongoClient.connect)(uri);

    return () => new this(server.db(connection.database));
  }

  get driver(): "MongoDB" {
    return "MongoDB";
  }

  protected _query!: mongodb.Collection;

  protected _filters: Driver.Filters = {
    $and: [],
  };

  private _pipeline: object[] = [];

  protected get _filter() {
    const filter = {
      ...this._filters,
    };

    if (filter.$and && filter.$and.length === 0) delete filter.$and;

    return filter;
  }

  private _prepare(document: any): any {
    if (document && document._id) {
      document = {
        id: document._id,
        ...document,
      };

      delete document._id;
    }

    return document;
  }

  table(table: string) {
    if (!(this._query as any).collection)
      throw new Error("Can't change table name in the middle of query");

    this._query = ((this._query as any) as mongodb.Db).collection(table);

    return this;
  }

  /*********************************** Joins **********************************/

  join(
    table: string,
    localKey: string = utils.makeTableId(table),
    foreignKey: string = "id",
    as: string = table,
  ) {
    this._pipeline.push({
      $lookup:
        {
          from: table,
          localField: localKey === "id" ? "_id" : localKey,
          foreignField: foreignKey === "id" ? "_id" : foreignKey,
          as,
        },
    });

    return this;
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
    return this._push_filter("and", {
      [field]: {
        [`$${operator}`]: value,
      },
    });
  }

  private _or_where(field: string, operator: string, value: any) {
    return this._push_filter("or", {
      [field]: {
        [`$${operator}`]: value,
      },
    });
  }

  where(field: string, operator: Base.Operator | any, value?: any) {
    const _operators: { [operator: string]: string } = {
      "<": "lt",
      "<=": "lte",
      "=": "eq",
      "<>": "ne",
      ">=": "gte",
      ">": "gt",
    };

    if (value === undefined) {
      value = operator;
      operator = "=";
    }

    if (field === "id") {
      field = "_id";
      value = new mongodb.ObjectId(value);
    }

    return this._where(field, _operators[operator], value);
  }

  orWhere(field: string, operator: Base.Operator | any, value?: any) {
    const _operators: { [operator: string]: string } = {
      "<": "lt",
      "<=": "lte",
      "=": "eq",
      "<>": "ne",
      ">=": "gte",
      ">": "gt",
    };

    if (value === undefined) {
      value = operator;
      operator = "=";
    }

    if (field === "id") {
      field = "_id";
      value = new mongodb.ObjectId(value);
    }

    if (operator === "like") value = new RegExp(value, "i");

    return this._or_where(field, _operators[operator], value);
  }

  whereLike(field: string, value: any) {
    if (field === "id") field = "_id";

    if (!(value instanceof RegExp)) value = new RegExp(value, "i");

    return this._where(field, "regex", value);
  }

  whereNotLike(field: string, value: any) {
    if (field === "id") field = "_id";

    if (!(value instanceof RegExp)) value = new RegExp(value, "i");

    return this._where(field, "not", value);
  }

  whereIn(field: string, values: any[]) {
    if (field === "id") {
      field = "_id";
      values = values.map((value) => new mongodb.ObjectId(value));
    }

    return this._where(field, "in", values);
  }

  whereNotIn(field: string, values: any[]) {
    if (field === "id") {
      field = "_id";
      values = values.map((value) => new mongodb.ObjectId(value));
    }

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

  /******************** Ordering, Grouping, Limit & Offset ********************/

  orderBy(field: string, order?: Base.Order) {
    this._pipeline.push({ $sort: { [field]: order === "desc" ? -1 : 1 } });

    return this;
  }

  skip(offset: number) {
    this._pipeline.push({ $skip: offset });

    return this;
  }

  limit(limit: number) {
    this._pipeline.push({ $limit: limit });

    return this;
  }

  /*********************************** Read ***********************************/

  private _aggregate(options?: mongodb.CollectionAggregationOptions) {
    // FIXME the mongodb typing has a bug i think
    return (this._query.aggregate([{ $match: this._filter }, ...this._pipeline], options) as any)
      .map(this._prepare) as mongodb.AggregationCursor;
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

    if (fields) this._pipeline.push({
      $project: fields.reduce((prev, cur) => ({
        ...prev,
        [cur === "id" ? "_id" : cur]: 1,
      }), { _id: 0 }),
    });

    return this._aggregate().toArray(callback as any);
  }

  async first(fields?: string[] | mongodb.MongoCallback<T>, callback?: mongodb.MongoCallback<T>) {
    if (utils.function.isInstance(fields)) {
      callback = fields;
      fields = undefined;
    }

    if (fields) this._pipeline.push({
      $project: fields.reduce((prev, cur) => ({
        ...prev,
        [cur === "id" ? "_id" : cur]: 1,
      }), { _id: 0 }),
    });

    this.limit(1);

    // @ts-ignore:next-line
    if (callback) return this._aggregate().toArray((err, res) => err ? callback(err, res) : callback(err, res[0]));

    return (await this._aggregate().toArray())[0];
  }

  value(field: string, callback?: mongodb.MongoCallback<any>) {
    this._pipeline.push({
      $project: {
        _id: 0,
        [field === "id" ? "_id" : field]: 1,
      },
    });

    // FIXME the mongodb typing has a bug i think
    return (this._aggregate() as any)
      .map((item: any) => field.split(".").reduce((prev, key) => prev[key], item))
      .toArray(callback);
  }

  async max(field: string, callback?: mongodb.MongoCallback<any>) {
    this._pipeline.push({ $group: { _id: null, max: { $max: `$${field}` } } });

    const query = this._aggregate();

    if (callback)
      return query.toArray((err, res) => {
        if (err) return callback(err, res);

        callback(err, utils.array.first(res).max);
      });

    return utils.array.first((await query.toArray())).max;
  }

  async min(field: string, callback?: mongodb.MongoCallback<any>) {
    this._pipeline.push({ $group: { _id: null, min: { $min: `$${field}` } } });

    const query = this._aggregate();

    if (callback)
      return query.toArray((err, res) => {
        if (err) return callback(err, res);

        callback(err, utils.array.first(res).min);
      });

    return utils.array.first((await query.toArray())).min;
  }

  async avg(field: string, callback?: mongodb.MongoCallback<any>) {
    this._pipeline.push({ $group: { _id: null, avg: { $avg: `$${field}` } } });

    const query = this._aggregate();

    if (callback)
      return query.toArray((err, res) => {
        if (err) return callback(err, res);

        callback(err, utils.array.first(res).avg);
      });

    return utils.array.first((await query.toArray())).avg;
  }

  /********************************** Inserts *********************************/

  async insert(item: T | T[], callback?: mongodb.MongoCallback<number>) {
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
      $set: update,
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
