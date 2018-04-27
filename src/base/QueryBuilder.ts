import * as async from "async";
import { Base as Driver } from "../drivers";
import { getConnection } from "../connections";
import ModelConstructor, { Model } from "../index";
import * as DB from "../DB";
import Query from "./Query";

interface QueryBuilder<T = any> {
  where(field: string, value: any): Query<T>;
  where(field: string, operator: Driver.Operator, value: any): Query<T>;

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

  find(ids: Driver.Id | Driver.Id[]): Promise<Model<T>>;
  find(ids: Driver.Id | Driver.Id[], callback: Driver.Callback<Model<T>>): void;

  findBy(field: string, values: any | any[]): Promise<Model<T>>;
  findBy(field: string, values: any | any[], callback: Driver.Callback<Model<T>>): void;

  value(field: string): Promise<any>;
  value(field: string, callback: Driver.Callback<any>): void;

  pluck(field: string): Promise<any>;
  pluck(field: string, callback: Driver.Callback<any>): void;

  max(field: string): Promise<any>;
  max(field: string, callback: Driver.Callback<any>): void;

  min(field: string): Promise<any>;
  min(field: string, callback: Driver.Callback<any>): void;

  /********************************** Inserts *********************************/

  insert(items: T[]): Promise<number>;
  insert(items: T[], callback: Driver.Callback<number>): void;

  create(item: T): Promise<Model<T>>;
  create(item: T, callback: Driver.Callback<Model<T>>): void;

  /********************************** Updates *********************************/

  save(): Promise<Model<T>>;
  save(callback: Driver.Callback<Model<T>>): void;

  /********************************** Deletes *********************************/

  destroy(ids: Driver.Id | Driver.Id[]): Promise<number>;
  destroy(ids: Driver.Id | Driver.Id[], callback: Driver.Callback<number>): void;
}

export interface QueryInstance<T = any> {
    save(): Promise<Model<T>>;
    save(callback: Driver.Callback<Model<T>>): void;
}

class QueryBuilder {
  static connection: string;
  static _table: string;

  private _isNew!: boolean;

  attributes!: ModelConstructor.Document;

  static query() {
    return new Query(this as any, getConnection(this.connection)).table(this._table);
  }

  /******************************* Where Clauses ******************************/

  static where(field: string, operator: Driver.Operator | any, value?: any) {
    return this.query().where(field, operator, value);
  }

  static whereLike(field: string, values: any[]) {
    return this.query().whereLike(field, values);
  }

  static whereNotLike(field: string, values: any[]) {
    return this.query().whereNotLike(field, values);
  }

  static whereIn(field: string, values: any[]) {
    return this.query().whereIn(field, values);
  }

  static whereNotIn(field: string, values: any[]) {
    return this.query().whereNotIn(field, values);
  }

  static whereBetween(field: string, start: any, end: any) {
    return this.query().whereBetween(field, start, end);
  }

  static whereNotBetween(field: string, start: any, end: any) {
    return this.query().whereNotBetween(field, start, end);
  }

  static whereNull(field: string) {
    return this.query().whereNull(field);
  }

  static whereNotNull(field: string) {
    return this.query().whereNotNull(field);
  }

  /******************** Ordering, Grouping, Limit & Offset ********************/

  static orderBy(field: string, order?: Driver.Order) {
    return this.query().orderBy(field, order);
  }

  static skip(offset: number) {
    return this.query().skip(offset);
  }

  static offset(offset: number) {
    return this.skip(offset);
  }

  static limit(limit: number) {
    return this.query().limit(limit);
  }

  static take(limit: number) {
    return this.limit(limit);
  }

  /*********************************** Read ***********************************/

  static exists(callback?: Driver.Callback<boolean>) {
    return this.query().exists(callback);
  }

  static count(callback?: Driver.Callback<number>) {
    return this.query().count(callback);
  }

  static all(callback?: Driver.Callback<any>) {
    return this.query().get(callback);
  }

  static find(ids: Driver.Id | Driver.Id[], callback?: Driver.Callback<any>) {
    return this.findBy("id", ids, callback);
  }

  static findBy(field: string, value: any | any[], callback?: Driver.Callback<any>) {
    if (Array.isArray(value)) return this.query().whereIn(field, value).first(callback);

    return this.query().where(field, value).first(callback);
  }

  static value(field: string, callback?: Driver.Callback<any>) {
    return this.query().value(field, callback);
  }

  static pluck(field: string, callback?: Driver.Callback<any>) {
    return this.value(field, callback);
  }

  static max(field: string, callback?: Driver.Callback<any>) {
    return this.query().max(field, callback);
  }

  static min(field: string, callback?: Driver.Callback<any>) {
    return this.query().min(field, callback);
  }

  /********************************** Inserts *********************************/

  static insert(items: any[], callback?: Driver.Callback<number>) {
    return this.query().insert(items, callback);
  }

  static async create(item: any, callback?: Driver.Callback<any>) {
    if (callback)
      return this.query().insertGetId(item, (err, res) => {
        if (err) return callback(err, res);

        this.find(res, callback);
      });

    return await this.find(await this.query().insertGetId(item));
  }

  /********************************** Updates *********************************/

  async save(callback?: Driver.Callback<any>) {
    if (this._isNew)
      return (this.constructor as typeof QueryBuilder).create(this.attributes, callback);

    const query = (this.constructor as typeof QueryBuilder).where("id", this.attributes.id);

    if (callback)
      return query.update(this.attributes, (err, res) => {
          if (err) return callback(err, res);

          (this.constructor as typeof QueryBuilder).find(this.attributes.id as Driver.Id, callback);
        });

    await query.update(this.attributes);

    return await (this.constructor as typeof QueryBuilder).find(this.attributes.id as Driver.Id);
  }

  /********************************** Deletes *********************************/

  static destroy(ids: Driver.Id | Driver.Id[]) {
    if (Array.isArray(ids)) return this.query().whereIn("id", ids).delete();

    return this.query().where("id", ids).delete();
  }
}

export default QueryBuilder;
