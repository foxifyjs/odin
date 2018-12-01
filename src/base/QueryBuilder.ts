import * as Odin from "..";
import Base from "../Base";
import * as DB from "../DB";
import Relation from "../Relation/Base";
import Query from "./Query";

const generateRelations = (relations: string[][]): Relation.Relation[] => {
  const result: any[] = [];

  relations.forEach((items) => {
    const name = items.shift() as string;
    const found = result.find(item => item.name === name);

    if (found) {
      if (items.length) found.relations.push(items);
      return;
    }

    result.push({
      name,
      relations: [items].filter(item => item.length),
    });
  });

  return result.map(item => ({
    name: item.name,
    relations: generateRelations(item.relations),
  }));
};

class QueryBuilder<T extends object = {}> extends Base<T> {
  protected static query<T extends object>(relations?: Query.Rel[]) {
    return new Query<T>(this as any, relations);
  }

  /******************************* With Trashed *******************************/

  public static withTrashed<T extends object>(): Query<T>;
  public static withTrashed() {
    return this.query().withTrashed();
  }

  /*********************************** Lean ***********************************/

  public static lean<T extends object>(): Query<T>;
  public static lean() {
    return this.query().lean();
  }

  /****************************** With Relations ******************************/

  public static with<T extends object>(...relations: string[]): Query<T>;
  public static with(...relations: string[]) {
    return this.query(
      generateRelations(relations.map(item => item.split(".")))
        .map((relation) => {
          if (!this._relations.includes(relation.name))
            throw new Error(`Relation '${relation.name}' does not exist on '${this.name}' Model`);

          return {
            relation: (this.prototype as any)[relation.name](),
            relations: relation.relations,
          };
        })
    );
  }

  /*********************************** Joins **********************************/

  public static join<T extends object>(
    collection: string | typeof Odin, query?: DB.JoinQuery<T>, as?: string): Query<T>;
  public static join(collection: string | typeof Odin, query?: DB.JoinQuery, as?: string) {
    return this.query().join(collection, query, as);
  }

  /******************************* Where Clauses ******************************/

  public static where<T extends object>(query: DB.FilterQuery): Query<T>;
  public static where<T extends object>(field: string, value: any): Query<T>;
  public static where<T extends object>(
    field: string, operator: DB.Operator, value: any): Query<T>;
  public static where(field: any, operator?: DB.Operator | any, value?: any) {
    return this.query().where(field, operator, value);
  }

  public static whereLike<T extends object>(field: string, values: any): Query<T>;
  public static whereLike(field: string, values: any) {
    return this.query().whereLike(field, values);
  }

  public static whereNotLike<T extends object>(field: string, values: any): Query<T>;
  public static whereNotLike(field: string, values: any) {
    return this.query().whereNotLike(field, values);
  }

  public static whereIn<T extends object>(field: string, values: any[]): Query<T>;
  public static whereIn(field: string, values: any[]) {
    return this.query().whereIn(field, values);
  }

  public static whereNotIn<T extends object>(field: string, values: any[]): Query<T>;
  public static whereNotIn(field: string, values: any[]) {
    return this.query().whereNotIn(field, values);
  }

  public static whereBetween<T extends object>(field: string, start: any, end: any): Query<T>;
  public static whereBetween(field: string, start: any, end: any) {
    return this.query().whereBetween(field, start, end);
  }

  public static whereNotBetween<T extends object>(field: string, start: any, end: any): Query<T>;
  public static whereNotBetween(field: string, start: any, end: any) {
    return this.query().whereNotBetween(field, start, end);
  }

  public static whereNull<T extends object>(field: string): Query<T>;
  public static whereNull(field: string) {
    return this.query().whereNull(field);
  }

  public static whereNotNull<T extends object>(field: string): Query<T>;
  public static whereNotNull(field: string) {
    return this.query().whereNotNull(field);
  }

  /******************** Ordering, Grouping, Limit & Offset ********************/

  public static orderBy<T extends object>(field: string, order?: DB.Order): Query<T>;
  public static orderBy(field: string, order?: DB.Order) {
    return this.query().orderBy(field, order);
  }

  public static skip<T extends object>(offset: number): Query<T>;
  public static skip(offset: number) {
    return this.query().skip(offset);
  }

  public static offset<T extends object>(offset: number): Query<T>;
  public static offset(offset: number) {
    return this.skip(offset);
  }

  public static limit<T extends object>(limit: number): Query<T>;
  public static limit(limit: number) {
    return this.query().limit(limit);
  }

  public static take<T extends object>(limit: number): Query<T>;
  public static take(limit: number) {
    return this.limit(limit);
  }

  /*********************************** Read ***********************************/

  public static exists<T>(): Promise<boolean>;
  public static exists<T>(callback: DB.Callback<boolean>): void;
  public static exists(callback?: DB.Callback<boolean>) {
    return this.query().exists(callback as any) as any;
  }

  public static count(): Promise<number>;
  public static count(callback: DB.Callback<number>): void;
  public static count(callback?: DB.Callback<number>) {
    return this.query().count(callback as any) as any;
  }

  public static get<T extends object>(): Promise<T[]>;
  public static get<T extends object>(callback: DB.Callback<T[]>): void;
  public static get(callback?: DB.Callback<any>) {
    return this.query().get(callback as any) as any;
  }

  public static first<T extends object>(): Promise<ThisType<T>>;
  public static first<T extends object>(callback: DB.Callback<ThisType<T>>): void;
  public static first(callback?: DB.Callback<any>) {
    return this.query().first(callback as any) as any;
  }

  public static find<T extends object>(ids: DB.Id | DB.Id[]): Promise<Odin<T>>;
  public static find<T extends object>(
    ids: DB.Id | DB.Id[],
    callback: DB.Callback<Odin<T>>
  ): void;
  public static find(ids: DB.Id | DB.Id[], callback?: DB.Callback<any>) {
    return this.findBy("id", ids, callback as any) as any;
  }

  public static findBy<T extends object>(field: string, values: any | any[]): Promise<Odin<T>>;
  public static findBy<T extends object>(
    field: string, values: any | any[],
    callback: DB.Callback<Odin<T>>
  ): void;
  public static findBy(field: string, value: any | any[], callback?: DB.Callback<any>) {
    if (Array.isArray(value)) return this.query().whereIn(field, value).first(callback as any);

    return this.query().where(field, value).first(callback as any) as any;
  }

  public static value<T>(field: string): Promise<any>;
  public static value<T>(field: string, callback: DB.Callback<any>): void;
  public static value(field: string, callback?: DB.Callback<any>) {
    return this.query().value(field, callback as any) as any;
  }

  public static pluck<T>(field: string): Promise<any>;
  public static pluck<T>(field: string, callback: DB.Callback<any>): void;
  public static pluck(field: string, callback?: DB.Callback<any>) {
    return this.value(field, callback as any) as any;
  }

  public static max<T>(field: string): Promise<any>;
  public static max<T>(field: string, callback: DB.Callback<any>): void;
  public static max(field: string, callback?: DB.Callback<any>) {
    return this.query().max(field, callback as any) as any;
  }

  public static min<T>(field: string): Promise<any>;
  public static min<T>(field: string, callback: DB.Callback<any>): void;
  public static min(field: string, callback?: DB.Callback<any>) {
    return this.query().min(field, callback as any) as any;
  }

  /********************************** Inserts *********************************/

  public static insert<T>(items: T[]): Promise<number>;
  public static insert<T>(items: T[], callback: DB.Callback<number>): void;
  public static insert(items: any[], callback?: DB.Callback<number>) {
    return this.query().insert(items, callback as any) as any;
  }

  public static create<T extends object>(item: T): Promise<Odin<T>>;
  public static create<T extends object>(item: T, callback: DB.Callback<Odin<T>>): void;
  public static async create(item: any, callback?: DB.Callback<any>) {
    if (callback)
      return this.query().insertGetId(item, (err, res) => {
        if (err) return callback(err, res);

        this.find(res, callback);
      });

    return await this.find(await this.query().insertGetId(item));
  }

  /********************************** Updates *********************************/

  public save(): Promise<this>;
  public save(callback: DB.Callback<this>): void;
  public async save(callback?: DB.Callback<this>) {
    const queryBuilder = this.constructor;

    if (this._isNew)
      return queryBuilder.create((this as any).attributes, callback as any);

    const query = queryBuilder.where("id", (this as any).attributes.id);

    if (callback)
      return query.update((this as any).attributes, (err, res) => {
        if (err) return callback(err, res as any);

        queryBuilder.find((this as any).attributes.id as DB.Id, callback as any);
      });

    await query.update((this as any).attributes);

    return await queryBuilder.find((this as any).attributes.id as DB.Id) as any;
  }

  /********************************** Deletes *********************************/

  public static delete(): Promise<number>;
  public static delete(callback: DB.Callback<number>): void;
  public static delete(callback?: DB.Callback<number>) {
    return this.query().delete(callback as any) as any;
  }

  public static destroy(ids: DB.Id | DB.Id[]): Promise<number>;
  public static destroy(ids: DB.Id | DB.Id[], callback: DB.Callback<number>): void;
  public static destroy(ids: DB.Id | DB.Id[], callback?: DB.Callback<number>) {
    let query = this.query();

    if (Array.isArray(ids)) query = query.whereIn("id", ids);
    else query = query.where("id", ids);

    return query.delete(callback as any) as any;
  }

  /********************************* Restoring ********************************/

  public restore(): Promise<boolean>;
  public restore(callback: DB.Callback<boolean>): void;
  public async restore(callback?: DB.Callback<boolean>) {
    const id = (this as any).attributes.id;

    if (this._isNew || !id) return false;

    const queryBuilder = this.constructor.where("id", id);

    if (callback) return queryBuilder.restore((err, res) => {
      if (err) return callback(err, res as any);

      callback(err, !!res);
    });

    return !!(await queryBuilder.restore());
  }
}

export default QueryBuilder;
