import { getConnection, Connection } from "./connections";
import { Base as Driver, MongoDB } from "./drivers";

module DB { }

interface DB<T = any> {
  /******************************* Where Clauses ******************************/

  where(field: string, value: any): this;
  where(field: string, operator: Driver.Operator, value: any): this;

  orWhere(field: string, value: any): this;
  orWhere(field: string, operator: Driver.Operator, value: any): this;

  whereIn(field: string, values: any[]): this;

  whereNotIn(field: string, values: any[]): this;

  whereBetween(field: string, start: any, end: any): this;

  whereNotBetween(field: string, start: any, end: any): this;

  whereNull(field: string): this;

  whereNotNull(field: string): this;

  /******************** Ordering, Grouping, Limit & Offset ********************/

  orderBy(field: string, order?: Driver.Order): this;

  skip(offset: number): this;

  offset(offset: number): this;

  limit(limit: number): this;

  take(limit: number): this;

  /*********************************** Read ***********************************/

  exists(): Promise<boolean>;
  exists(callback: Driver.Callback<boolean>): void;

  count(): Promise<number>;
  count(callback: Driver.Callback<number>): void;

  get(fields?: string[]): Promise<T[]>;
  get(fields: string[], callback: Driver.Callback<T[]>): void;
  get(callback: Driver.Callback<T[]>): void;

  first(fields?: string[]): Promise<T>;
  first(fields: string[], callback: Driver.Callback<T>): void;
  first(callback: Driver.Callback<T>): void;

  value(field: string): Promise<any>;
  value(field: string, callback: Driver.Callback<any>): void;

  pluck(field: string): Promise<any>;
  pluck(field: string, callback: Driver.Callback<any>): void;

  max(field: string): Promise<any>;
  max(field: string, callback: Driver.Callback<any>): void;

  min(field: string): Promise<any>;
  min(field: string, callback: Driver.Callback<any>): void;

  /********************************** Inserts *********************************/

  insert(item: T | T[]): Promise<number>;
  insert(item: T | T[], callback: Driver.Callback<number>): void;

  insertGetId(item: T): Promise<Driver.Id>;
  insertGetId(item: T, callback: Driver.Callback<Driver.Id>): void;

  /********************************** Updates *********************************/

  update(update: T): Promise<number>;
  update(update: T, callback: Driver.Callback<number>): void;

  increment(field: string, count?: number): Promise<number>;
  increment(field: string, callback: Driver.Callback<number>): void;
  increment(field: string, count: number, callback: Driver.Callback<number>): void;

  /********************************** Deletes *********************************/

  delete(): Promise<number>;
  delete(callback: Driver.Callback<number>): void;
}

class DB<T = any> {
  private _query: Driver<T>;

  constructor(connection: Connection) {
    this._query = connection();
  }

  static connection(connection: string) {
    return new this(getConnection(connection));
  }

  static table(table: string) {
    return this.connection("default").table(table);
  }

  table(table: string) {
    this._query = this._query.table.call(this._query, ...arguments);

    return this;
  }

  /******************************* Where Clauses ******************************/

  where(field: string, operator: Driver.Operator | any, value?: any) {
    this._query = this._query.where.call(this._query, ...arguments);

    return this;
  }

  orWhere(field: string, operator: Driver.Operator | any, value?: any) {
    this._query = this._query.orWhere.call(this._query, ...arguments);

    return this;
  }

  whereIn(field: string, values: any[]) {
    this._query = this._query.whereIn.call(this._query, ...arguments);

    return this;
  }

  whereNotIn(field: string, values: any[]) {
    this._query = this._query.whereNotIn.call(this._query, ...arguments);

    return this;
  }

  whereBetween(field: string, start: any, end: any) {
    this._query = this._query.whereBetween.call(this._query, ...arguments);

    return this;
  }

  whereNotBetween(field: string, start: any, end: any) {
    this._query = this._query.whereNotBetween.call(this._query, ...arguments);

    return this;
  }

  whereNull(field: string) {
    this._query = this._query.whereNull.call(this._query, ...arguments);

    return this;
  }

  whereNotNull(field: string) {
    this._query = this._query.whereNotNull.call(this._query, ...arguments);

    return this;
  }

  /******************** Ordering, Grouping, Limit & Offset ********************/

  orderBy(field: string, order?: Driver.Order) {
    this._query = this._query.orderBy.call(this._query, ...arguments);

    return this;
  }

  skip(offset: number) {
    this._query = this._query.skip.call(this._query, ...arguments);

    return this;
  }

  offset(offset: number) {
    return this.skip(offset);
  }

  limit(limit: number) {
    this._query = this._query.limit.call(this._query, ...arguments);

    return this;
  }

  take(limit: number) {
    return this.limit(limit);
  }

  /*********************************** Read ***********************************/

  exists(callback?: Driver.Callback<boolean>) {
    return this._query.exists.call(this._query, ...arguments);
  }

  count(callback?: Driver.Callback<number>) {
    return this._query.count.call(this._query, ...arguments);
  }

  get(fields?: string[] | Driver.Callback<T[]>, callback?: Driver.Callback<T[]>) {
    return this._query.get.call(this._query, ...arguments);
  }

  first(fields?: string[] | Driver.Callback<T>, callback?: Driver.Callback<T>) {
    return this._query.first.call(this._query, ...arguments);
  }

  value(field: string, callback?: Driver.Callback<any>) {
    return this._query.value.call(this._query, ...arguments);
  }

  pluck(field: string, callback?: Driver.Callback<any>) {
    return this.value(field, callback);
  }

  max(field: string, callback?: Driver.Callback<any>) {
    return this._query.max.call(this, ...arguments);
  }

  min(field: string, callback?: Driver.Callback<any>) {
    return this._query.min.call(this, ...arguments);
  }

  /********************************** Inserts *********************************/

  insert(item: T | T[], callback?: Driver.Callback<number>) {
    return this._query.insert.call(this._query, ...arguments);
  }

  insertGetId(item: T, callback?: Driver.Callback<Driver.Id>) {
    return this._query.insertGetId.call(this._query, ...arguments);
  }

  create(item: T, callback?: Driver.Callback<T>) {
    return this._query.create.call(this._query, ...arguments);
  }

  /********************************** Updates *********************************/

  update(update: T, callback?: Driver.Callback<number>) {
    return this._query.update.call(this._query, ...arguments);
  }

  increment(field: string, count?: number | Driver.Callback<number>, callback?: Driver.Callback<number>) {
    return this._query.increment.call(this._query, ...arguments);
  }

  decrement(field: string, count?: number | Driver.Callback<number>, callback?: Driver.Callback<number>) {
    if (count === undefined) count = 1;
    else if (Function.isInstance(count)) {
      callback = count;
      count = 1;
    }

    return this.increment(field, -count, callback);
  }

  /********************************** Deletes *********************************/

  delete(callback?: Driver.Callback<number>) {
    return this._query.delete.call(this._query, ...arguments);
  }
}

export = DB;
