import * as async from "async";
import * as Odin from "..";
import Query from "../base/Query";
import * as DB from "../DB";
import Filter from "../DB/Filter";
import Join from "../DB/Join";
import { getCallerFunctionName } from "../utils";

namespace Relation {
  export interface Relation {
    name: string;
    relations: Relation[];
  }

  export interface RelationCount {
    name: string;
    relation?: RelationCount;
  }
}

abstract class Relation<T extends Odin = Odin, A = undefined> {
  public readonly as: string;

  constructor(
    public readonly model: Odin,
    public readonly relation: typeof Odin,
    public readonly localKey: string,
    public readonly foreignKey: string,
    protected readonly filter: (q: Filter<T>) => Filter<T> = q => q,
    caller: (...args: any[]) => any
  ) {
    this.as = getCallerFunctionName(caller);
  }

  protected _query(relations?: string[]): Query<T> {
    let query: typeof Odin | Query<T> = this.relation;

    if (relations) query = query.with(...relations);

    return this.filter((query as Query<T>).where(
      this.foreignKey,
      this.model.getAttribute(this.localKey)
    )) as any;
  }

  public abstract load(
    query: DB<T> | Join<T>, relations: Relation.Relation[], filter?: (q: Filter) => Filter
  ): DB<T> | Join<T>;

  public abstract loadCount(
    query: DB<T> | Join<T>, relations: string[], filter?: (q: Filter) => Filter
  ): DB<T> | Join<T>;

  /****************************** With Relations ******************************/

  public with(...relations: string[]): Query<T>;
  public with() {
    return this._query.call(this, arguments as any);
  }

  /*********************************** Joins **********************************/

  public join(collection: string | typeof Odin, query?: DB.JoinQuery<T>, as?: string): Query<T>;
  public join() {
    const query = this._query();

    return query.join.apply(query, arguments as any);
  }

  /******************************* Where Clauses ******************************/

  public where(field: string, value: any): Query<T>;
  public where(field: string, operator: DB.Operator, value: any): Query<T>;
  public where() {
    const query = this._query();

    return query.where.apply(query, arguments as any);
  }

  public whereIn(field: string, values: any[]): Query<T>;
  public whereIn() {
    const query = this._query();

    return query.whereIn.apply(query, arguments as any);
  }

  public whereNotIn(field: string, values: any[]): Query<T>;
  public whereNotIn() {
    const query = this._query();

    return query.whereNotIn.apply(query, arguments as any);
  }

  public whereBetween(field: string, start: any, end: any): Query<T>;
  public whereBetween() {
    const query = this._query();

    return query.whereBetween.apply(query, arguments as any);
  }

  public whereNotBetween(field: string, start: any, end: any): Query<T>;
  public whereNotBetween() {
    const query = this._query();

    return query.whereNotBetween.apply(query, arguments as any);
  }

  public whereNull(field: string): Query<T>;
  public whereNull() {
    const query = this._query();

    return query.whereNull.apply(query, arguments as any);
  }

  public whereNotNull(field: string): Query<T>;
  public whereNotNull() {
    const query = this._query();

    return query.whereNotNull.apply(query, arguments as any);
  }

  /******************** Ordering, Grouping, Limit & Offset ********************/

  public orderBy(field: string, order?: DB.Order): Query<T>;
  public orderBy() {
    const query = this._query();

    return query.orderBy.apply(query, arguments as any);
  }

  public skip(offset: number): Query<T>;
  public skip() {
    const query = this._query();

    return query.skip.apply(query, arguments as any);
  }

  public offset(offset: number): Query<T>;
  public offset() {
    return this.skip.apply(this, arguments as any);
  }

  public limit(limit: number): Query<T>;
  public limit() {
    const query = this._query();

    return query.limit.apply(query, arguments as any);
  }

  public take(limit: number): Query<T>;
  public take() {
    return this.limit.apply(this, arguments as any);
  }

  /*********************************** Read ***********************************/

  public exists(): Promise<boolean>;
  public exists(callback: DB.Callback<boolean>): void;
  public exists() {
    const query = this._query();

    return query.exists.apply(query, arguments as any) as any;
  }

  public count(): Promise<number>;
  public count(callback: DB.Callback<number>): void;
  public count() {
    const query = this._query();

    return query.count.apply(query, arguments as any) as any;
  }

  public get(): Promise<T[]>;
  public get(callback: DB.Callback<T[]>): void;
  public get() {
    const query = this._query();

    return query.get.apply(query, arguments as any) as any;
  }

  public first(): Promise<T>;
  public first(callback: DB.Callback<T>): void;
  public first() {
    const query = this._query();

    return query.first.apply(query, arguments as any) as any;
  }

  public value(field: string): Promise<any>;
  public value(field: string, callback: DB.Callback<any>): void;
  public value() {
    const query = this._query();

    return query.value.apply(query, arguments as any) as any;
  }

  public pluck(field: string): Promise<any>;
  public pluck(field: string, callback: DB.Callback<any>): void;
  public pluck() {
    return this.value.apply(this, arguments as any) as any;
  }

  public max(field: string): Promise<any>;
  public max(field: string, callback: DB.Callback<any>): void;
  public max() {
    const query = this._query();

    return query.max.apply(query, arguments as any) as any;
  }

  public min(field: string): Promise<any>;
  public min(field: string, callback: DB.Callback<any>): void;
  public min() {
    const query = this._query();

    return query.min.apply(query, arguments as any) as any;
  }

  /********************************** Inserts *********************************/

  public insert(items: T[]): Promise<A extends undefined ? number : any>;
  public insert(items: T[], callback: DB.Callback<A extends undefined ? number : any>): void;
  public async insert(items: T[], callback?: DB.Callback<A extends undefined ? number : any>) {
    const foreignKey = this.foreignKey;
    const localAttribute = this.model.getAttribute(this.localKey);

    if (callback)
      return async.map(
        items,
        (item, cb1: (...args: any[]) => any) => ({
          ...(item as any),
          [foreignKey]: localAttribute,
        }),
        (err, newItems) => {
          if (err) callback(err, undefined as any);

          this._query().insert(newItems as T[], callback as any);
        }
      );

    async.map(
      items,
      (item, cb1: (...args: any[]) => any) => ({
        ...(item as any),
        [foreignKey]: localAttribute,
      }),
      (err, newItems) => {
        if (err) throw err;

        items = newItems as T[];
      }
    );

    return await this._query().insert(items);
  }

  public create(item: T): Promise<T>;
  public create(item: T, callback: DB.Callback<T>): void;
  public async create(item: T, callback?: DB.Callback<T>) {
    item = {
      ...(item as any),
      [this.foreignKey]: this.model.getAttribute(this.localKey),
    };

    if (callback)
      return this._query().insertGetId(item, (err, res) => {
        if (err) return callback(err, res as any);

        this.where("id", res).first(callback);
      });

    return await this.where("id", await this._query().insertGetId(item)).first();
  }

  public save(model: T): Promise<T>;
  public save(model: T, callback: DB.Callback<T>): void;
  public save(model: T, callback?: DB.Callback<T>) {
    model.setAttribute(
      this.foreignKey,
      this.model.getAttribute(this.localKey)
    );

    return model.save(callback as any) as Promise<T> | void;
  }

  /********************************** Updates *********************************/

  public update(update: T): Promise<number>;
  public update(update: T, callback: DB.Callback<number>): void;
  public update() {
    const query = this._query();

    return query.update.apply(query, arguments as any) as any;
  }

  public increment(field: string, count?: number): Promise<number>;
  public increment(field: string, callback: DB.Callback<number>): void;
  public increment(field: string, count: number, callback: DB.Callback<number>): void;
  public increment() {
    const query = this._query();

    return query.increment.apply(query, arguments as any) as any;
  }

  public decrement(field: string, count?: number): Promise<number>;
  public decrement(field: string, callback: DB.Callback<number>): void;
  public decrement(field: string, count: number, callback: DB.Callback<number>): void;
  public decrement() {
    const query = this._query();

    return query.decrement.apply(query, arguments as any) as any;
  }

  /********************************** Deletes *********************************/

  public delete(): Promise<number>;
  public delete(callback: DB.Callback<number>): void;
  public delete() {
    const query = this._query();

    return query.delete.apply(query, arguments as any) as any;
  }
}

export default Relation;
