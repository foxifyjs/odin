import * as mongodb from "mongodb";
import * as deasync from "deasync";
import Base from "../Driver";
import { connect } from "../../connections";

module Driver {
  export interface Filters<T = any> {
    $and?: Array<mongodb.FilterQuery<T>>;
    $or?: Array<mongodb.FilterQuery<T>>;
    [operator: string]: any;
  }
}

interface Driver<T = any> {
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

  insert(item: T | T[]): Promise<number>;
  insert(item: T | T[], callback: mongodb.MongoCallback<number>): void;

  insertGetId(item: T): Promise<mongodb.ObjectId>;
  insertGetId(item: T, callback: mongodb.MongoCallback<mongodb.ObjectId>): void;

  create(item: T): Promise<T>;
  create(item: T, callback: mongodb.MongoCallback<T>): void;

  update(update: T): Promise<number>;
  update(update: T, callback: mongodb.MongoCallback<number>): void;

  increment(field: string, count?: number): Promise<number>;
  increment(field: string, callback: mongodb.MongoCallback<number>): void;
  increment(field: string, count: number, callback: mongodb.MongoCallback<number>): void;

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
      connection.host || "localhost"
      }:${
      connection.port || "27017"
      }/${
      connection.database
      }`;

    const server = <mongodb.MongoClient>deasync(mongodb.MongoClient.connect)(uri);

    return () => new this(server.db(connection.database));
  }

  get driver(): "mongodb" {
    return "mongodb";
  }

  protected _query!: mongodb.Collection;

  private _filters: Driver.Filters = {
    $and: [],
  };

  private _options: mongodb.FindOneOptions = {};

  private get _filter() {
    const filter = {
      ...this._filters,
    };

    if (filter.$and && filter.$and.length === 0) delete filter.$and;

    return filter;
  }

  private _prepare(document: any): T {
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
      "like": "regex",
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
      "like": "regex",
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
    this._options.sort = {
      [field]: order === "desc" ? -1 : 1,
    };

    return this;
  }

  skip(offset: number) {
    this._options.skip = offset;

    return this;
  }

  limit(limit: number) {
    this._options.limit = limit;

    return this;
  }

  /*********************************** Read ***********************************/

  private _aggregate(pipeline: object[], options?: mongodb.CollectionAggregationOptions) {
    const _options = this._options;
    const _pipeline: object[] = [
      { $match: this._filter },
    ];

    if (_options.sort) _pipeline.push({ $sort: _options.sort });
    if (_options.skip) _pipeline.push({ $skip: _options.skip });
    if (_options.limit) _pipeline.push({ $skip: _options.limit });

    _pipeline.push(...pipeline);

    return this._query.aggregate(_pipeline, options);
  }

  async exists(callback?: mongodb.MongoCallback<boolean>) {
    if (callback) return this.count((err, res) => callback(err, res !== 0));

    return (await this.count()) !== 0;
  }

  async count(callback?: mongodb.MongoCallback<number>) {
    if (callback) return this._query.count(this._filter, callback);

    return await this._query.count(this._filter);
  }

  async get(fields?: string[] | mongodb.MongoCallback<T[]>, callback?: mongodb.MongoCallback<T[]>) {
    if (Function.isInstance(fields)) {
      callback = fields;
      fields = undefined;
    }

    const _fields: { [field: string]: 1 | 0 } = {};

    if (fields) {
      _fields._id = 0;

      const length = fields.length;
      let i = 0;

      for (; i < length; i++)
        _fields[fields[i] === "id" ? "_id" : fields[i]] = 1;
    }

    const query = this._query.find(
      this._filter,
      {
        ...this._options,
        fields: _fields,
      },
    ).map(this._prepare);

    if (callback) return query.toArray(callback);

    return await query.toArray();
  }

  async first(fields?: string[] | mongodb.MongoCallback<T>, callback?: mongodb.MongoCallback<T>) {
    if (Function.isInstance(fields)) {
      callback = fields;
      fields = undefined;
    }

    const _fields: { [field: string]: 1 | 0 } = {};

    if (fields) {
      _fields._id = 0;

      const length = fields.length;
      let i = 0;

      for (; i < length; i++)
        _fields[fields[i] === "id" ? "_id" : fields[i]] = 1;
    }

    const options = {
      ...this._options,
      fields: _fields,
    };

    if (callback)
      return this._query.findOne(
        this._filter,
        options,
        (err, res) => (callback as mongodb.MongoCallback<T>)(err, this._prepare(res)),
      );

    return this._prepare(await this._query.findOne(this._filter, options));
  }

  async value(field: string, callback?: mongodb.MongoCallback<any>) {
    const keys = field.split(".");

    const query = this._query.find(
      this._filter,
      {
        ...this._options,
        fields: {
          _id: 0,
          [field === "id" ? "_id" : field]: 1,
        },
      },
    ).map(this._prepare).map((item: any) => keys.reduce((prev, key) => prev[key], item));

    if (callback) return query.toArray(callback);

    return await query.toArray();
  }

  async max(field: string, callback?: mongodb.MongoCallback<any>) {
    const keys = field.split(".");

    this.orderBy(field, "desc");

    if (callback)
      return this.first([field], (err, res) => callback(err, keys.reduce((prev: any, key) => prev[key], res)));

    return keys.reduce((prev: any, key) => prev[key], (await this.first([field])));
  }

  async min(field: string, callback?: mongodb.MongoCallback<any>) {
    const keys = field.split(".");

    this.orderBy(field, "asc");

    if (callback)
      return this.first([field], (err, res) => callback(err, keys.reduce((prev: any, key) => prev[key], res)));

    return keys.reduce((prev: any, key) => prev[key], (await this.first([field])));
  }

  async avg(field: string, callback?: mongodb.MongoCallback<any>) {
    const query = this._aggregate([
      { $group: { _id: null, avg: { $avg: `$${field}` } } },
    ]);

    if (callback)
      return query.toArray((err, res) => {
        if (err) return callback(err, res);

        callback(err, res.first().avg);
      });

    return (await query.toArray()).first().avg;
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

  async create(item: T, callback?: mongodb.MongoCallback<T>) {
    if (callback)
      return this._query.insertOne(item, (err, res) => callback(err, res.ops.first()));

    return (await this._query.insertOne(item)).ops.first();
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
    else if (Function.isInstance(count)) {
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
