import * as DB from ".";
import { array, makeCollectionId, object, OPERATORS, prepareKey, string } from "../utils";
import Filter from "./Filter";

class Join<T = any> extends Filter {
  protected _pipeline: object[] = [];

  protected _let: { [key: string]: any } = {};

  public get pipe() {
    this._resetFilters();

    return {
      $lookup: {
        as: this._as,
        from: this._collection,
        let: this._let,
        pipeline: this._pipeline,
      },
    };
  }

  constructor(
    protected _ancestor: string,
    protected _collection: string,
    protected _as: string = _collection
  ) {
    super();
  }

  /********************************** Helpers *********************************/

  protected _resetFilters() {
    const FILTER = this._filters;

    if (object.size(FILTER) > 0) this.pipeline({ $match: FILTER });

    this._filter = {
      $and: [],
    };

    return this;
  }

  protected _shouldPushExpr(value: any) {
    if (!string.isString(value)) return false;

    return new RegExp(`^${this._ancestor}\..+`).test(value);
  }

  protected _where(field: string, operator: string, value: any) {
    if (this._shouldPushExpr(value)) {
      const keys = array.tail(value.split("."));

      keys.push(prepareKey(keys.pop() as string));

      const key = keys.join(".");
      const pivotKey = `pivot_${key}`;

      this._let[pivotKey] = `$${key}`;

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

      const key = keys.join(".");
      const pivotKey = `pivot_${key}`;

      this._let[pivotKey] = `$${key}`;

      return this._push_filter("or", {
        $expr: {
          [`$${operator}`]: [`$${prepareKey(field)}`, `$$${pivotKey}`],
        },
      });
    }

    return super._or_where(field, operator, value);
  }

  /********************************** Extra **********************************/

  public pipeline(...objects: object[]) {
    this._pipeline.push(...objects);

    return this;
  }

  /*********************************** Joins **********************************/

  public join(
    collection: string,
    query: DB.JoinQuery<T> = q => q.where(makeCollectionId(collection), `${collection}.id`),
    as: string = collection
  ) {
    const join: Join = query(new Join(this._collection, collection, as)) as any;

    this._resetFilters();

    this.pipeline(join.pipe);

    return this;
  }

  /*************** Mapping, Ordering, Grouping, Limit & Offset ***************/

  public orderBy(field: string, order?: DB.Order) {
    return this._resetFilters()
      .pipeline({ $sort: { [field]: order === "desc" ? -1 : 1 } });
  }

  public skip(offset: number) {
    return this._resetFilters()
      .pipeline({ $skip: offset });
  }

  public offset(offset: number) {
    return this.skip(offset);
  }

  public limit(limit: number) {
    return this._resetFilters()
      .pipeline({ $limit: limit });
  }

  public take(limit: number) {
    return this.limit(limit);
  }

  /******************************* Where Clauses ******************************/

  public whereIn(field: string, embeddedField: string): this;
  public whereIn(field: string, values: any[]): this;
  public whereIn(field: string, values: any) {
    return super.whereIn(field, values);
  }

  public whereNotIn(field: string, embeddedField: string): this;
  public whereNotIn(field: string, values: any[]): this;
  public whereNotIn(field: string, values: any) {
    return super.whereNotIn(field, values);
  }
}

export default Join;
