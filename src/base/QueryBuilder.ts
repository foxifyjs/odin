import { Base as Driver } from "../drivers";
import Relation from "../drivers/Relation/Base";
import * as Model from "../index";
import * as utils from "../utils";
import Query from "./Query";

interface QueryBuilder<T = any> {
  /******************************* Where Clauses ******************************/

  whereIn(field: string, values: any[]): Query<T>;

  whereNotIn(field: string, values: any[]): Query<T>;

  whereBetween(field: string, start: any, end: any): Query<T>;

  whereNotBetween(field: string, start: any, end: any): Query<T>;

  whereNull(field: string): Query<T>;

  whereNotNull(field: string): Query<T>;

  /******************** Ordering, Grouping, Limit & Offset ********************/

  orderBy(field: string, order?: Driver.Order): Query<T>;

  skip(offset: number): Query<T>;

  offset(offset: number): Query<T>;

  limit(limit: number): Query<T>;

  take(limit: number): Query<T>;

  /*********************************** Read ***********************************/

  exists(): Promise<boolean>;
  exists(callback: Driver.Callback<boolean>): void;

  count(): Promise<number>;
  count(callback: Driver.Callback<number>): void;

  all(): Promise<Array<Model<T>>>;
  all(callback: Driver.Callback<Array<Model<T>>>): void;

  first(): Promise<Model<T>>;
  first(callback: Driver.Callback<Model<T>>): void;

  value(field: string): Promise<any>;
  value(field: string, callback: Driver.Callback<any>): void;

  pluck(field: string): Promise<any>;
  pluck(field: string, callback: Driver.Callback<any>): void;

  max(field: string): Promise<any>;
  max(field: string, callback: Driver.Callback<any>): void;

  min(field: string): Promise<any>;
  min(field: string, callback: Driver.Callback<any>): void;
}

class QueryBuilder<T = any> {
  public static _table: string;
  public static softDelete: boolean;
  public static DELETED_AT: string;

  public attributes!: Model.Document;

  public static query<T>(relations?: Relation[]) {
    return new Query<T>(this as any, this._table, relations);
  }

  /******************************* With Trashed *******************************/

  public static withTrashed<T>(): Query<T>;
  public static withTrashed() {
    return this.query().withTrashed();
  }

  /****************************** With Relations ******************************/

  public static with<T>(...relations: string[]): Query<T>;
  public static with(...relations: string[]) {
    if (relations.length === 0)
      throw new TypeError("Expected at least one 'relation', got none");

    return this.query(relations.map((name) => {
      let query = (this.prototype as any)[name] as any;

      if (!utils.function.isFunction(query))
        throw new Error(`Relation '${name}' does not exist on '${this.name}' Model`);

      query = query.apply(this.prototype);

      if (!(query instanceof Relation))
        throw new Error(`'${name}' is not a relation`);

      return query;
    }));
  }

  /*********************************** Joins **********************************/

  public static join<T>(table: string | typeof Model, query?: Driver.JoinQuery<T>, as?: string):
    Query<T>;
  public static join(table: string | typeof Model, query?: Driver.JoinQuery, as?: string) {
    return this.query().join(table, query, as);
  }

  /******************************* Where Clauses ******************************/

  public static where<T>(field: string, value: any): Query<T>;
  public static where<T>(field: string, operator: Driver.Operator, value: any): Query<T>;
  public static where(field: string, operator: Driver.Operator | any, value?: any) {
    return this.query().where(field, operator, value);
  }

  public static whereLike(field: string, values: any[]) {
    return this.query().whereLike(field, values);
  }

  public static whereNotLike(field: string, values: any[]) {
    return this.query().whereNotLike(field, values);
  }

  public static whereIn(field: string, values: any[]) {
    return this.query().whereIn(field, values);
  }

  public static whereNotIn(field: string, values: any[]) {
    return this.query().whereNotIn(field, values);
  }

  public static whereBetween(field: string, start: any, end: any) {
    return this.query().whereBetween(field, start, end);
  }

  public static whereNotBetween(field: string, start: any, end: any) {
    return this.query().whereNotBetween(field, start, end);
  }

  public static whereNull(field: string) {
    return this.query().whereNull(field);
  }

  public static whereNotNull(field: string) {
    return this.query().whereNotNull(field);
  }

  /******************** Ordering, Grouping, Limit & Offset ********************/

  public static orderBy(field: string, order?: Driver.Order) {
    return this.query().orderBy(field, order);
  }

  public static skip(offset: number) {
    return this.query().skip(offset);
  }

  public static offset(offset: number) {
    return this.skip(offset);
  }

  public static limit(limit: number) {
    return this.query().limit(limit);
  }

  public static take(limit: number) {
    return this.limit(limit);
  }

  /*********************************** Read ***********************************/

  public static exists(callback?: Driver.Callback<boolean>) {
    return this.query().exists(callback as any);
  }

  public static count(callback?: Driver.Callback<number>) {
    return this.query().count(callback as any);
  }

  public static all(callback?: Driver.Callback<any>) {
    return this.query().get(callback as any);
  }

  public static first(callback?: Driver.Callback<any>) {
    return this.query().first(callback as any);
  }

  public static find<T>(ids: Driver.Id | Driver.Id[]): Promise<Model<T>>;
  public static find<T>(ids: Driver.Id | Driver.Id[], callback: Driver.Callback<Model<T>>): void;
  public static find(ids: Driver.Id | Driver.Id[], callback?: Driver.Callback<any>) {
    return this.findBy("id", ids, callback as any) as any;
  }

  public static findBy<T>(field: string, values: any | any[]): Promise<Model<T>>;
  public static findBy<T>(field: string, values: any | any[], callback: Driver.Callback<Model<T>>):
   void;
  public static findBy(field: string, value: any | any[], callback?: Driver.Callback<any>) {
    if (Array.isArray(value)) return this.query().whereIn(field, value).first(callback as any);

    return this.query().where(field, value).first(callback as any) as any;
  }

  public static value(field: string, callback?: Driver.Callback<any>) {
    return this.query().value(field, callback as any);
  }

  public static pluck(field: string, callback?: Driver.Callback<any>) {
    return this.value(field, callback);
  }

  public static max(field: string, callback?: Driver.Callback<any>) {
    return this.query().max(field, callback as any);
  }

  public static min(field: string, callback?: Driver.Callback<any>) {
    return this.query().min(field, callback as any);
  }

  /********************************** Inserts *********************************/

  public static insert<T>(items: T[]): Promise<number>;
  public static insert<T>(items: T[], callback: Driver.Callback<number>): void;
  public static insert(items: any[], callback?: Driver.Callback<number>) {
    return this.query().insert(items, callback as any) as any;
  }

  public static create<T>(item: T): Promise<Model<T>>;
  public static create<T>(item: T, callback: Driver.Callback<Model<T>>): void;
  public static async create(item: any, callback?: Driver.Callback<any>) {
    if (callback)
      return this.query().insertGetId(item, (err, res) => {
        if (err) return callback(err, res);

        this.find(res, callback);
      });

    return await this.find(await this.query().insertGetId(item));
  }

  /********************************** Updates *********************************/

  public save(): Promise<T>;
  public save(callback: Driver.Callback<T>): void;
  public async save(callback?: Driver.Callback<T>) {
    const queryBuilder = this.constructor as typeof QueryBuilder;

    if ((this as any)._isNew)
      return queryBuilder.create(this.attributes, callback as any);

    const query = queryBuilder.where("id", this.attributes.id);

    if (callback)
      return query.update(this.attributes, (err, res) => {
        if (err) return callback(err, res as any);

        queryBuilder.find(this.attributes.id as Driver.Id, callback as any);
      });

    await query.update(this.attributes);

    return await queryBuilder.find(this.attributes.id as Driver.Id) as any;
  }

  /********************************** Deletes *********************************/

  public static destroy(ids: Driver.Id | Driver.Id[]): Promise<number>;
  public static destroy(ids: Driver.Id | Driver.Id[], callback: Driver.Callback<number>): void;
  public static destroy(ids: Driver.Id | Driver.Id[], callback?: Driver.Callback<number>) {
    let query = this.query();

    if (Array.isArray(ids)) query = query.whereIn("id", ids);
    else query = query.where("id", ids);

    return query.delete(callback as any) as any;
  }

  /********************************* Restoring ********************************/

  public restore(): Promise<boolean>;
  public restore(callback: Driver.Callback<boolean>): void;
  public async restore(callback?: Driver.Callback<boolean>) {
    const id = this.attributes.id;

    if ((this as any)._isNew || !id) return false;

    const queryBuilder = (this.constructor as typeof QueryBuilder).where("id", id);

    if (callback) return queryBuilder.restore((err, res) => {
      if (err) return callback(err, res as any);

      callback(err, !!res);
    });

    return !!(await queryBuilder.restore());
  }
}

export default QueryBuilder;
