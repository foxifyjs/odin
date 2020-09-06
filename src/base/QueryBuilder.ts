import * as Odin from "..";
import Base from "../Base";
import { Operator, JoinQuery, FilterQuery, Order, Iterator, Id } from "../DB";
import Filter from "../DB/Filter";
import Relation from "../Relation/Base";
import Query from "./Query";

const generateRelations = (relations: string[][]): Relation.Relation[] => {
  const result: any[] = [];

  relations.forEach((items) => {
    const name = items.shift() as string;
    const found = result.find((item) => item.name === name);

    if (found) {
      if (items.length) found.relations.push(items);
      return;
    }

    result.push({
      name,
      relations: [items].filter((item) => item.length),
    });
  });

  return result.map((item) => ({
    name: item.name,
    relations: generateRelations(item.relations),
  }));
};

class QueryBuilder<T extends Record<string, unknown> = any> extends Base<T> {
  protected static query<T extends Record<string, unknown>>(
    relations?: Query.Rel[],
  ) {
    return new Query<T>(this as any, relations);
  }

  /******************************* With Trashed *******************************/

  public static withTrashed<T extends Record<string, unknown>>(): Query<T>;
  public static withTrashed() {
    return this.query().withTrashed();
  }

  /*********************************** Lean ***********************************/

  public static lean<T extends Record<string, unknown>>(): Query<T>;
  public static lean() {
    return this.query().lean();
  }

  /****************************** Has & WhereHas ******************************/

  public static has<T extends Record<string, unknown> = any>(
    relation: string,
    count?: number,
  ): Query<T>;
  public static has<T extends Record<string, unknown> = any>(
    relation: string,
    operator: Operator,
    count?: number,
  ): Query<T>;
  public static has(
    relation: string,
    operator?: Operator | number,
    count?: number,
  ) {
    return this.query().has(relation, operator as any, count);
  }

  public static whereHas<T extends Record<string, unknown> = any>(
    relation: string,
    filter: (q: Filter) => Filter,
    count?: number,
  ): Query<T>;
  public static whereHas<T extends Record<string, unknown> = any>(
    relation: string,
    filter: (q: Filter) => Filter,
    operator: Operator,
    count?: number,
  ): Query<T>;
  public static whereHas(
    relation: string,
    filter: (q: Filter) => Filter,
    operator?: Operator | number,
    count?: number,
  ) {
    return this.query().whereHas(relation, filter, operator as any, count);
  }

  /****************************** With Relations ******************************/

  public static with<T extends Record<string, unknown>>(
    ...relations: string[]
  ): Query<T>;
  public static with(...relations: string[]) {
    return this.query(
      generateRelations(relations.map((item) => item.split("."))).map(
        (relation) => {
          if (!this._relations.includes(relation.name))
            throw new Error(
              `Relation '${relation.name}' does not exist on '${this.name}' Model`,
            );

          return {
            relation: (this.prototype as any)[relation.name](),
            relations: relation.relations,
          };
        },
      ),
    );
  }

  /*********************************** Joins **********************************/

  public static join<T extends Record<string, unknown>>(
    collection: string | typeof Odin,
    query?: JoinQuery<T>,
    as?: string,
  ): Query<T>;
  public static join(
    collection: string | typeof Odin,
    query?: JoinQuery,
    as?: string,
  ) {
    return this.query().join(collection, query, as);
  }

  /******************************* Where Clauses ******************************/

  public static where<T extends Record<string, unknown>>(
    query: FilterQuery,
  ): Query<T>;
  public static where<T extends Record<string, unknown>>(
    field: string,
    value: any,
  ): Query<T>;
  public static where<T extends Record<string, unknown>>(
    field: string,
    operator: Operator,
    value: any,
  ): Query<T>;
  public static where(field: any, operator?: Operator | any, value?: any) {
    return this.query().where(field, operator, value);
  }

  public static whereLike<T extends Record<string, unknown>>(
    field: string,
    values: any,
  ): Query<T>;
  public static whereLike(field: string, values: any) {
    return this.query().whereLike(field, values);
  }

  public static whereNotLike<T extends Record<string, unknown>>(
    field: string,
    values: any,
  ): Query<T>;
  public static whereNotLike(field: string, values: any) {
    return this.query().whereNotLike(field, values);
  }

  public static whereIn<T extends Record<string, unknown>>(
    field: string,
    values: any[],
  ): Query<T>;
  public static whereIn(field: string, values: any[]) {
    return this.query().whereIn(field, values);
  }

  public static whereNotIn<T extends Record<string, unknown>>(
    field: string,
    values: any[],
  ): Query<T>;
  public static whereNotIn(field: string, values: any[]) {
    return this.query().whereNotIn(field, values);
  }

  public static whereBetween<T extends Record<string, unknown>>(
    field: string,
    start: any,
    end: any,
  ): Query<T>;
  public static whereBetween(field: string, start: any, end: any) {
    return this.query().whereBetween(field, start, end);
  }

  public static whereNotBetween<T extends Record<string, unknown>>(
    field: string,
    start: any,
    end: any,
  ): Query<T>;
  public static whereNotBetween(field: string, start: any, end: any) {
    return this.query().whereNotBetween(field, start, end);
  }

  public static whereNull<T extends Record<string, unknown>>(
    field: string,
  ): Query<T>;
  public static whereNull(field: string) {
    return this.query().whereNull(field);
  }

  public static whereNotNull<T extends Record<string, unknown>>(
    field: string,
  ): Query<T>;
  public static whereNotNull(field: string) {
    return this.query().whereNotNull(field);
  }

  /********* Mapping, Ordering, Grouping, Limit, Offset & Pagination *********/

  public static orderBy<T extends Record<string, unknown>>(
    field: string,
    order?: Order,
  ): Query<T>;
  public static orderBy(field: string, order?: Order) {
    return this.query().orderBy(field, order);
  }

  public static skip<T extends Record<string, unknown>>(
    offset: number,
  ): Query<T>;
  public static skip(offset: number) {
    return this.query().skip(offset);
  }

  public static offset<T extends Record<string, unknown>>(
    offset: number,
  ): Query<T>;
  public static offset(offset: number) {
    return this.skip(offset);
  }

  public static limit<T extends Record<string, unknown>>(
    limit: number,
  ): Query<T>;
  public static limit(limit: number) {
    return this.query().limit(limit);
  }

  public static take<T extends Record<string, unknown>>(
    limit: number,
  ): Query<T>;
  public static take(limit: number) {
    return this.limit(limit);
  }

  public static paginate<T extends Record<string, unknown>>(
    page?: number,
    limit?: number,
  ): Query<T>;
  public static paginate(page?: number, limit?: number) {
    return this.query().paginate(page, limit);
  }

  /*********************************** Read ***********************************/

  public static exists(): Promise<boolean> {
    return this.query().exists();
  }

  public static count(): Promise<number> {
    return this.query().count();
  }

  public static iterate<T extends Record<string, unknown>>(): Iterator<T>;
  public static iterate() {
    return this.query().iterate();
  }

  public static get<T extends Record<string, unknown>>(): Promise<T[]>;
  public static get() {
    return this.query().get();
  }

  public static first<T extends Record<string, unknown>>(): Promise<
    ThisType<T>
  >;
  public static first() {
    return this.query().first();
  }

  public static find<T extends Record<string, unknown>>(
    ids: Id | Id[],
  ): Promise<Odin<T>>;
  public static find(ids: Id | Id[]) {
    return this.findBy("id", ids);
  }

  public static findBy<T extends Record<string, unknown>>(
    field: string,
    values: any | any[],
  ): Promise<Odin<T>>;
  public static findBy(field: string, value: any | any[]) {
    if (Array.isArray(value)) return this.query().whereIn(field, value).first();

    return this.query().where(field, value).first();
  }

  public static value<T>(field: string): Promise<any>;
  public static value(field: string) {
    return this.query().value(field);
  }

  public static pluck<T>(field: string): Promise<any>;
  public static pluck(field: string) {
    return this.value(field);
  }

  public static max<T>(field: string): Promise<any>;
  public static max(field: string) {
    return this.query().max(field);
  }

  public static min<T>(field: string): Promise<any>;
  public static min(field: string) {
    return this.query().min(field);
  }

  /********************************** Inserts *********************************/

  public static insert<T>(items: T[]): Promise<number>;
  public static insert(items: any[]) {
    return this.query().insert(items);
  }

  public static create<T extends Record<string, unknown>>(
    item: T,
  ): Promise<Odin<T>>;
  public static async create(item: any) {
    return await this.find(await this.query().insertGetId(item));
  }

  /********************************** Updates *********************************/

  public save(): Promise<this>;
  public async save() {
    const queryBuilder = this.constructor;

    if (this._isNew) return queryBuilder.create((this as any).attributes);

    const query = queryBuilder.where("id", (this as any).attributes.id);

    await query.update((this as any).attributes);

    return (await queryBuilder.find((this as any).attributes.id as Id)) as any;
  }

  /********************************** Deletes *********************************/

  public static delete(): Promise<number> {
    return this.query().delete();
  }

  public static destroy(ids: Id | Id[], force?: boolean): Promise<number> {
    let query = this.query();

    if (Array.isArray(ids)) query = query.whereIn("id", ids);
    else query = query.where("id", ids);

    return query.delete(force);
  }

  public async delete(force?: boolean): Promise<number> {
    if (this._isNew) return 0;

    return this.constructor.destroy(this._original.id as Id, force);
  }

  /********************************* Restoring ********************************/

  public async restore(): Promise<number> {
    if (this._isNew) return 0;

    const queryBuilder = this.constructor.where("id", this._original.id);

    return await queryBuilder.restore();
  }
}

export default QueryBuilder;
