import { JoinQuery, Order } from ".";
import {
  array,
  makeCollectionId,
  object,
  OPERATORS,
  prepareKey,
  string,
} from "../utils";
import Filter from "./Filter";

class Join<T extends Record<string, unknown> = any> extends Filter<T> {
  protected _pipeline: Record<string, unknown>[] = [];

  protected _let: { [key: string]: any } = {};

  public get pipeline() {
    this._resetFilters();

    return {
      $lookup: {
        let: this._let,
        from: this._collection,
        pipeline: this._pipeline,
        as: this._as,
      },
    };
  }

  constructor(
    protected _ancestor: string,
    protected _collection: string,
    protected _as: string = _collection,
  ) {
    super();
  }

  /********************************** Helpers *********************************/

  protected _resetFilters() {
    const FILTER = this._filters;

    if (object.size(FILTER) > 0) this._pipeline.push({ $match: FILTER });
    // if (object.size(FILTER) > 0) this.aggregate({ $match: FILTER });

    this._filter = {
      $and: [],
    };

    return this;
  }

  protected _shouldPushExpr(value: any) {
    if (!string.isString(value)) return false;

    return new RegExp(`^\\$?${this._ancestor}\\..+`).test(value);
  }

  protected _where(field: string, operator: string, value: any) {
    if (this._shouldPushExpr(value)) {
      const keys = array.tail(value.replace(/^\$/, "").split("."));

      keys.push(prepareKey(keys.pop() as string));

      const pivotKey = `pivot_${keys.join("_ODIN_")}`;

      this._let[pivotKey] = `$${keys.join(".")}`;

      return this._push_filter("and", {
        $expr: {
          [`$${operator}`]: [`$${prepareKey(field)}`, `$$${pivotKey}`],
        },
      });
    }

    return super._where(field, operator, value);
  }

  protected _or_where(field: string, operator: string, value: any) {
    if (this._shouldPushExpr(value)) {
      const keys = array.tail(value.split("."));

      keys.push(prepareKey(keys.pop() as string));

      const pivotKey = `pivot_${keys.join("_ODIN_")}`;

      this._let[pivotKey] = `$${keys.join(".")}`;

      return this._push_filter("or", {
        $expr: {
          [`$${operator}`]: [`$${prepareKey(field)}`, `$$${pivotKey}`],
        },
      });
    }

    return super._or_where(field, operator, value);
  }

  /********************************** Extra **********************************/

  public aggregate(
    ...objects: Record<string, unknown>[] | Record<string, unknown>[][]
  ) {
    this._resetFilters();

    this._pipeline.push(...array.deepFlatten(objects));

    return this;
  }

  /*********************************** Joins **********************************/

  public join(
    collection: string,
    query: JoinQuery<T> = (q) =>
      q.where(makeCollectionId(collection), `${collection}.id`),
    as: string = collection,
  ) {
    const join: Join = query(new Join(this._collection, collection, as)) as any;

    this.aggregate(join.pipeline);

    return this;
  }

  /********* Mapping, Ordering, Grouping, Limit, Offset & Pagination *********/

  public orderBy<K extends keyof T>(field: K, order?: Order): this;
  public orderBy(field: string, order?: Order): this;
  public orderBy(fields: { [field: string]: "asc" | "desc" }): this;
  public orderBy(
    fields: string | { [field: string]: "asc" | "desc" },
    order?: Order,
  ) {
    const $sort: { [field: string]: 1 | -1 } = {};

    if (string.isString(fields)) $sort[fields] = order === "desc" ? -1 : 1;
    else
      object.forEach(
        fields,
        (value, field) => ($sort[field] = value === "desc" ? -1 : 1),
      );

    return this.aggregate({ $sort });
  }

  public skip(offset: number) {
    return this.aggregate({ $skip: offset });
  }

  public offset(offset: number) {
    return this.skip(offset);
  }

  public limit(limit: number) {
    return this.aggregate({ $limit: limit });
  }

  public take(limit: number) {
    return this.limit(limit);
  }

  public paginate(page = 0, limit = 10) {
    return this.skip(page * limit).limit(limit);
  }

  /******************************* Where Clauses ******************************/

  public whereIn(field: string, embeddedField: string): this;
  public whereIn<K extends keyof T>(field: K, embeddedField: string): this;
  public whereIn(field: string, values: any[]): this;
  public whereIn<K extends keyof T>(field: K, values: Array<T[K]>): this;
  public whereIn(field: string, values: any) {
    return super.whereIn(field, values);
  }

  public whereNotIn(field: string, embeddedField: string): this;
  public whereNotIn<K extends keyof T>(field: K, embeddedField: string): this;
  public whereNotIn(field: string, values: any[]): this;
  public whereNotIn<K extends keyof T>(field: K, values: Array<T[K]>): this;
  public whereNotIn(field: string, values: any) {
    return super.whereNotIn(field, values);
  }
}

export default Join;
