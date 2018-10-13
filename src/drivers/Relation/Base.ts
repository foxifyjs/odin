import * as async from "async";
import Query from "../../base/Query";
import * as Model from "../../index";
import * as utils from "../../utils";
import Driver from "../Driver";

abstract class Relation<T = any, A = undefined> {
  public readonly as: string;

  constructor(
    public readonly model: Model,
    public readonly relation: typeof Model,
    public readonly localKey: string,
    public readonly foreignKey: string,
    caller: (...args: any[]) => any
  ) {
    this.as = utils.getCallerFunctionName(caller);
  }

  protected _query(relations?: string[]): Query {
    let query: typeof Model | Query = this.relation;

    if (relations) query = query.with(...relations);

    return query.where(
      this.foreignKey,
      this.model.getAttribute(this.localKey)
    );
  }

  public abstract load(query: Query<T>): any;

  /****************************** With Relations ******************************/

  public with(...relations: string[]): Query<T>;
  public with() {
    return this._query.call(this, arguments);
  }

  /*********************************** Joins **********************************/

  public join(table: string | typeof Model, query?: Driver.JoinQuery<T>, as?: string): Query<T>;
  public join() {
    const query = this._query();

    return query.join.apply(query, arguments);
  }

  /******************************* Where Clauses ******************************/

  public where(field: string, value: any): Query<T>;
  public where(field: string, operator: Driver.Operator, value: any): Query<T>;
  public where() {
    const query = this._query();

    return query.where.apply(query, arguments);
  }

  public whereIn(field: string, values: any[]): Query<T>;
  public whereIn() {
    const query = this._query();

    return query.whereIn.apply(query, arguments);
  }

  public whereNotIn(field: string, values: any[]): Query<T>;
  public whereNotIn() {
    const query = this._query();

    return query.whereNotIn.apply(query, arguments);
  }

  public whereBetween(field: string, start: any, end: any): Query<T>;
  public whereBetween() {
    const query = this._query();

    return query.whereBetween.apply(query, arguments);
  }

  public whereNotBetween(field: string, start: any, end: any): Query<T>;
  public whereNotBetween() {
    const query = this._query();

    return query.whereNotBetween.apply(query, arguments);
  }

  public whereNull(field: string): Query<T>;
  public whereNull() {
    const query = this._query();

    return query.whereNull.apply(query, arguments);
  }

  public whereNotNull(field: string): Query<T>;
  public whereNotNull() {
    const query = this._query();

    return query.whereNotNull.apply(query, arguments);
  }

  /******************** Ordering, Grouping, Limit & Offset ********************/

  public orderBy(field: string, order?: Driver.Order): Query<T>;
  public orderBy() {
    const query = this._query();

    return query.orderBy.apply(query, arguments);
  }

  public skip(offset: number): Query<T>;
  public skip() {
    const query = this._query();

    return query.skip.apply(query, arguments);
  }

  public offset(offset: number): Query<T>;
  public offset() {
    return this.skip.apply(this, arguments);
  }

  public limit(limit: number): Query<T>;
  public limit() {
    const query = this._query();

    return query.limit.apply(query, arguments);
  }

  public take(limit: number): Query<T>;
  public take() {
    return this.limit.apply(this, arguments);
  }

  /*********************************** Read ***********************************/

  public exists(): Promise<boolean>;
  public exists(callback: Driver.Callback<boolean>): void;
  public exists() {
    const query = this._query();

    return query.exists.apply(query, arguments);
  }

  public count(): Promise<number>;
  public count(callback: Driver.Callback<number>): void;
  public count() {
    const query = this._query();

    return query.count.apply(query, arguments);
  }

  public get(): Promise<Array<Model<T>>>;
  public get(callback: Driver.Callback<Array<Model<T>>>): void;
  public get() {
    const query = this._query();

    return query.get.apply(query, arguments);
  }

  public first(): Promise<Model<T>>;
  public first(callback: Driver.Callback<Model<T>>): void;
  public first() {
    const query = this._query();

    return query.first.apply(query, arguments);
  }

  public value(field: string): Promise<any>;
  public value(field: string, callback: Driver.Callback<any>): void;
  public value() {
    const query = this._query();

    return query.value.apply(query, arguments);
  }

  public pluck(field: string): Promise<any>;
  public pluck(field: string, callback: Driver.Callback<any>): void;
  public pluck() {
    return this.value.apply(this, arguments);
  }

  public max(field: string): Promise<any>;
  public max(field: string, callback: Driver.Callback<any>): void;
  public max() {
    const query = this._query();

    return query.max.apply(query, arguments);
  }

  public min(field: string): Promise<any>;
  public min(field: string, callback: Driver.Callback<any>): void;
  public min() {
    const query = this._query();

    return query.min.apply(query, arguments);
  }

  /********************************** Inserts *********************************/

  public insert(items: T[]): Promise<A extends undefined ? number : any>;
  public insert(items: T[], callback: Driver.Callback<A extends undefined ? number : any>): void;
  public async insert(items: T[], callback?: Driver.Callback<A extends undefined ? number : any>) {
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

  public create(item: T): Promise<Model<T>>;
  public create(item: T, callback: Driver.Callback<Model<T>>): void;
  public async create(item: T, callback?: Driver.Callback<Model<T>>) {
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

  public save(model: Model<T>): Promise<Model<T>>;
  public save(model: Model<T>, callback: Driver.Callback<Model<T>>): void;
  public save(model: Model<T>, callback?: Driver.Callback<Model<T>>) {
    model.setAttribute(
      this.foreignKey,
      this.model.getAttribute(this.localKey)
    );

    return model.save(callback as any) as Promise<Model<T>> | void;
  }

  /********************************** Updates *********************************/

  public update(update: T): Promise<number>;
  public update(update: T, callback: Driver.Callback<number>): void;
  public update() {
    const query = this._query();

    return query.update.apply(query, arguments);
  }

  public increment(field: string, count?: number): Promise<number>;
  public increment(field: string, callback: Driver.Callback<number>): void;
  public increment(field: string, count: number, callback: Driver.Callback<number>): void;
  public increment() {
    const query = this._query();

    return query.increment.apply(query, arguments);
  }

  public decrement(field: string, count?: number): Promise<number>;
  public decrement(field: string, callback: Driver.Callback<number>): void;
  public decrement(field: string, count: number, callback: Driver.Callback<number>): void;
  public decrement() {
    const query = this._query();

    return query.decrement.apply(query, arguments);
  }

  /********************************** Deletes *********************************/

  public delete(): Promise<number>;
  public delete(callback: Driver.Callback<number>): void;
  public delete() {
    const query = this._query();

    return query.delete.apply(query, arguments);
  }
}

export default Relation;
