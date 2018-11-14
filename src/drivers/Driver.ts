import * as connections from "../connections";

namespace Driver {
  export type Callback<T = any> = (error: Error, result: T) => void;

  export type Operator = "<" | "<=" | "=" | "<>" | ">=" | ">";

  export type Order = "asc" | "desc";

  export type Id = number | string;

  export interface Filter {
    where(query: FilterQuery): this;
    where(field: string, value: any): this;
    where(field: string, operator: Driver.Operator, value: any): this;

    orWhere(query: FilterQuery): this;
    orWhere(field: string, value: any): this;
    orWhere(field: string, operator: Driver.Operator, value: any): this;

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
    join(table: string, query?: Driver.JoinQuery<T>, as?: string): this;
  }

  export type JoinQuery<T = any> = (query: Join<T>) => Join<T>;

  export interface GroupQueryObject<T = any> {
    having: (field: string, operator: Operator | any, value?: any) => GroupQueryObject<T>;
  }

  export type GroupQuery<T = any> = (query: GroupQueryObject<T>) => void;

  export type Mapper<T = any> = (item: T, index: number, items: T[]) => any;
}

abstract class Driver<T = any> {
  protected _query: any;

  public abstract readonly driver: connections.Driver;

  constructor(query: connections.Query) {
    this._query = query;
  }

  public abstract table(table: string): this;

  /*********************************** Joins **********************************/

  public abstract join(table: string, query?: Driver.JoinQuery<T>, as?: string): this;

  /******************************* Where Clauses ******************************/

  public abstract where(query: Driver.FilterQuery): this;
  public abstract where(field: string, value: any): this;
  public abstract where(field: string, operator: Driver.Operator, value: any): this;

  public abstract orWhere(query: Driver.FilterQuery): this;
  public abstract orWhere(field: string, value: any): this;
  public abstract orWhere(field: string, operator: Driver.Operator, value: any): this;

  public abstract whereLike(field: string, value: any): this;

  public abstract whereNotLike(field: string, value: any): this;

  public abstract whereIn(field: string, values: any[]): this;

  public abstract whereNotIn(field: string, values: any[]): this;

  public abstract whereBetween(field: string, start: any, end: any): this;

  public abstract whereNotBetween(field: string, start: any, end: any): this;

  public abstract whereNull(field: string): this;

  public abstract whereNotNull(field: string): this;

  /*************** Mapping, Grouping, Ordering, Limit & Offset ****************/

  public abstract map(fn: Driver.Mapper<T>): this;

  // public abstract groupBy(field: string, query?: Driver.GroupQuery<T>): this;

  public abstract orderBy(field: string, order?: Driver.Order): this;

  public abstract skip(offset: number): this;

  public abstract limit(limit: number): this;

  /*********************************** Read ***********************************/

  public abstract exists(): Promise<boolean>;
  public abstract exists(callback: Driver.Callback<boolean>): void;

  public abstract count(): Promise<number>;
  public abstract count(callback: Driver.Callback<number>): void;

  public abstract get(fields?: string[]): Promise<T[]>;
  public abstract get(fields: string[], callback: Driver.Callback<T[]>): void;
  public abstract get(callback: Driver.Callback<T[]>): void;

  public abstract first(fields?: string[]): Promise<T>;
  public abstract first(fields: string[], callback: Driver.Callback<T>): void;
  public abstract first(callback: Driver.Callback<T>): void;

  public abstract value(field: string): Promise<any>;
  public abstract value(field: string, callback: Driver.Callback<any>): void;

  public abstract max(field: string): Promise<any>;
  public abstract max(field: string, callback: Driver.Callback<any>): void;

  public abstract min(field: string): Promise<any>;
  public abstract min(field: string, callback: Driver.Callback<any>): void;

  public abstract avg(field: string): Promise<any>;
  public abstract avg(field: string, callback: Driver.Callback<any>): void;

  /********************************** Inserts *********************************/

  public abstract insert(item: T | T[]): Promise<number>;
  public abstract insert(item: T | T[], callback: Driver.Callback<number>): void;

  public abstract insertGetId(item: T): Promise<Driver.Id>;
  public abstract insertGetId(item: T, callback: Driver.Callback<Driver.Id>): void;

  /********************************** Updates *********************************/

  public abstract update(update: T): Promise<number>;
  public abstract update(update: T, callback: Driver.Callback<number>): void;

  public abstract increment(field: string, count?: number): Promise<number>;
  public abstract increment(field: string, callback: Driver.Callback<number>): void;
  public abstract increment(field: string, count: number, callback: Driver.Callback<number>): void;

  /********************************** Deletes *********************************/

  public abstract delete(): Promise<number>;
  public abstract delete(callback: Driver.Callback<number>): void;
}

export default Driver;
