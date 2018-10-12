import { getConnection } from "./connections";
import { Base as Driver } from "./drivers";
import { function as func } from "./utils";

namespace DB { }

class DB<T = any, D extends Driver<T> = any, A = undefined> {
  private _query: D;

  private _getting = false;

  constructor(connection: string) {
    this._query = getConnection(connection);
  }

  public static connection(connection: string) {
    return new this(connection);
  }

  public static table(table: string) {
    let connection = "default";

    const keys = table.split(".");
    if (keys.length === 2) {
      connection = keys[0];
      table = keys[1];
    }

    return this.connection(connection).table(table);
  }

  public table(table: string) {
    this._query = this._query.table.call(this._query, table);

    return this;
  }

  /********************************** Driver **********************************/

  public driver(fn: (query: D) => D) {
    this._query = fn(this._query);

    return this;
  }

  /*********************************** Joins **********************************/

  public join(table: string, query?: Driver.JoinQuery<T>, as?: string): this;
  public join() {
    this._getting = true;

    this._query = this._query.join.apply(this._query, arguments);

    return this;
  }

  /******************************* Where Clauses ******************************/

  public where(field: string, value: any): this;
  public where(field: string, operator: Driver.Operator, value: any): this;
  public where() {
    this._getting = true;

    this._query = this._query.where.apply(this._query, arguments);

    return this;
  }

  public orWhere(field: string, value: any): this;
  public orWhere(field: string, operator: Driver.Operator, value: any): this;
  public orWhere() {
    this._getting = true;

    this._query = this._query.orWhere.apply(this._query, arguments);

    return this;
  }

  public whereLike(field: string, value: any): this;
  public whereLike() {
    this._getting = true;

    this._query = this._query.whereLike.apply(this._query, arguments);

    return this;
  }

  public whereNotLike(field: string, value: any): this;
  public whereNotLike() {
    this._getting = true;

    this._query = this._query.whereNotLike.apply(this._query, arguments);

    return this;
  }

  public whereIn(field: string, values: any[]): this;
  public whereIn() {
    this._getting = true;

    this._query = this._query.whereIn.apply(this._query, arguments);

    return this;
  }

  public whereNotIn(field: string, values: any[]): this;
  public whereNotIn() {
    this._getting = true;

    this._query = this._query.whereNotIn.apply(this._query, arguments);

    return this;
  }

  public whereBetween(field: string, start: any, end: any): this;
  public whereBetween() {
    this._getting = true;

    this._query = this._query.whereBetween.apply(this._query, arguments);

    return this;
  }

  public whereNotBetween(field: string, start: any, end: any): this;
  public whereNotBetween() {
    this._getting = true;

    this._query = this._query.whereNotBetween.apply(this._query, arguments);

    return this;
  }

  public whereNull(field: string): this;
  public whereNull() {
    this._getting = true;

    this._query = this._query.whereNull.apply(this._query, arguments);

    return this;
  }

  public whereNotNull(field: string): this;
  public whereNotNull() {
    this._getting = true;

    this._query = this._query.whereNotNull.apply(this._query, arguments);

    return this;
  }

  /*************** Mapping, Ordering, Grouping, Limit & Offset ****************/

  public map(fn: Driver.Mapper<T>): this;
  public map() {
    this._getting = true;

    this._query = this._query.map.apply(this._query, arguments);

    return this;
  }

  // public groupBy(field: string, query?: Driver.GroupQuery<T>): this;
  // groupBy() {
  //   this._getting = true;

  //   this._query = this._query.groupBy.apply(this._query, arguments);

  //   return this;
  // }

  public orderBy(field: string, order?: Driver.Order): this;
  public orderBy() {
    this._getting = true;

    this._query = this._query.orderBy.apply(this._query, arguments);

    return this;
  }

  public skip(offset: number): this;
  public skip() {
    this._getting = true;

    this._query = this._query.skip.apply(this._query, arguments);

    return this;
  }

  public offset(offset: number): this;
  public offset() {
    return this.skip.apply(this, arguments);
  }

  public limit(limit: number): this;
  public limit() {
    this._getting = true;

    this._query = this._query.limit.apply(this._query, arguments);

    return this;
  }

  public take(limit: number): this;
  public take() {
    return this.limit.apply(this, arguments);
  }

  /*********************************** Read ***********************************/

  public exists(): Promise<boolean>;
  public exists(callback: Driver.Callback<boolean>): void;
  public exists() {
    return this._query.exists.apply(this._query, arguments);
  }

  public count(): Promise<number>;
  public count(callback: Driver.Callback<number>): void;
  public count() {
    return this._query.count.apply(this._query, arguments);
  }

  public get(fields?: string[]): Promise<Array<A extends undefined ? T : any>>;
  public get(
    fields: string[], callback: Driver.Callback<Array<A extends undefined ? T : any>>): void;
  public get(callback: Driver.Callback<Array<A extends undefined ? T : any>>): void;
  public get() {
    return this._query.get.apply(this._query, arguments);
  }

  public first(fields?: string[]): Promise<A extends undefined ? T : any>;
  public first(fields: string[], callback: Driver.Callback<A extends undefined ? T : any>): void;
  public first(callback: Driver.Callback<A extends undefined ? T : any>): void;
  public first() {
    return this._query.first.apply(this._query, arguments);
  }

  public value(field: string): Promise<any>;
  public value(field: string, callback: Driver.Callback<any>): void;
  public value() {
    return this._query.value.apply(this._query, arguments);
  }

  public pluck(field: string): Promise<any>;
  public pluck(field: string, callback: Driver.Callback<any>): void;
  public pluck() {
    return this.value.apply(this, arguments);
  }

  public max(field: string): Promise<any>;
  public max(field: string, callback: Driver.Callback<any>): void;
  public max() {
    return this._query.max.apply(this._query, arguments);
  }

  public min(field: string): Promise<any>;
  public min(field: string, callback: Driver.Callback<any>): void;
  public min() {
    return this._query.min.apply(this._query, arguments);
  }

  public avg(field: string): Promise<any>;
  public avg(field: string, callback: Driver.Callback<any>): void;
  public avg() {
    return this._query.avg.apply(this._query, arguments);
  }

  /********************************** Inserts *********************************/

  public insert(item: T | T[]): Promise<number>;
  public insert(item: T | T[], callback: Driver.Callback<number>): void;
  public insert() {
    if (this._getting) throw new Error("Unexpected call to 'insert' after querying");

    return this._query.insert.apply(this._query, arguments);
  }

  public insertGetId(item: T): Promise<Driver.Id>;
  public insertGetId(item: T, callback: Driver.Callback<Driver.Id>): void;
  public insertGetId() {
    if (this._getting) throw new Error("Unexpected call to 'insertGetId' after querying");

    return this._query.insertGetId.apply(this._query, arguments);
  }

  /********************************** Updates *********************************/

  public update(update: T): Promise<number>;
  public update(update: T, callback: Driver.Callback<number>): void;
  public update() {
    return this._query.update.apply(this._query, arguments);
  }

  public increment(field: string, count?: number): Promise<number>;
  public increment(field: string, callback: Driver.Callback<number>): void;
  public increment(field: string, count: number, callback: Driver.Callback<number>): void;
  public increment() {
    return this._query.increment.apply(this._query, arguments);
  }

  public decrement(field: string, count?: number): Promise<number>;
  public decrement(field: string, callback: Driver.Callback<number>): void;
  public decrement(field: string, count: number, callback: Driver.Callback<number>): void;
  public decrement(
    field: string,
    count?: number | Driver.Callback<number>,
    callback?: Driver.Callback<number>
  ) {
    if (count === undefined) count = 1;
    else if (func.isFunction(count)) {
      callback = count;
      count = 1;
    }

    return this.increment.call(this, field, -count, callback);
  }

  /********************************** Deletes *********************************/

  public delete(): Promise<number>;
  public delete(callback: Driver.Callback<number>): void;
  public delete() {
    return this._query.delete.apply(this._query, arguments);
  }
}

export = DB;
