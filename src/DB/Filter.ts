import * as mongo from "mongodb";
import {
  Obj,
  MongoFilter,
  FilterQuery,
  Operator,
  OPERATOR,
  MONGO_OPERATOR_MAP,
} from "../constants";

export const enum FILTER_OPERATOR {
  AND = "$and",
  OR = "$or",
}

export type Filters<T extends Obj> = {
  [operator in FILTER_OPERATOR]?: Array<mongo.FilterQuery<T> | Filters<T>>;
};

export default class Filter<T extends Obj> implements MongoFilter<T> {
  protected _filters: Filters<T> = {};

  /* ------------------------- WHERE ------------------------- */

  public where(query: FilterQuery<T, Filter<T>>): this;
  public where<K extends keyof T>(field: K, value: T[K]): this;
  public where(field: string, value: unknown): this;
  public where<K extends keyof T>(
    field: K,
    operator: Operator,
    value: T[K],
  ): this;
  public where(field: string, operator: Operator, value: unknown): this;
  public where(
    field: string | FilterQuery<T, Filter<T>>,
    operator?: unknown,
    value?: unknown,
  ): this {
    if (typeof field === "function") {
      const filter = new Filter<T>();

      field(filter);

      return this._filter(FILTER_OPERATOR.AND, filter._filters);
    }

    if (arguments.length === 2) {
      value = operator;
      operator = OPERATOR.EQ;
    }

    return this._where(field, MONGO_OPERATOR_MAP[operator as Operator], value);
  }

  /* ------------------------- OR WHERE ------------------------- */

  public orWhere(query: FilterQuery<T, Filter<T>>): this;
  public orWhere<K extends keyof T>(field: K, value: T[K]): this;
  public orWhere(field: string, value: unknown): this;
  public orWhere<K extends keyof T>(
    field: K,
    operator: Operator,
    value: T[K],
  ): this;
  public orWhere(field: string, operator: Operator, value: unknown): this;
  public orWhere(
    field: string | FilterQuery<T, Filter<T>>,
    operator?: unknown,
    value?: unknown,
  ): this {
    if (typeof field === "function") {
      const filter = new Filter<T>();

      field(filter);

      return this._filter(FILTER_OPERATOR.OR, filter._filters);
    }

    if (arguments.length === 2) {
      value = operator;
      operator = OPERATOR.EQ;
    }

    return this._orWhere(
      field,
      MONGO_OPERATOR_MAP[operator as Operator],
      value,
    );
  }

  /* ------------------------- WHERE NULL ------------------------- */

  whereNull(field: keyof T | string): this;
  whereNull(field: string): this {
    return this._where(field, "$eq", null);
  }

  /* ------------------------- WHERE NOT NULL ------------------------- */

  whereNotNull(field: keyof T | string): this;
  whereNotNull(field: string): this {
    return this._where(field, "$ne", null);
  }

  /* ------------------------- WHERE LIKE ------------------------- */

  whereLike(field: keyof T | string, value: string | RegExp): this;
  whereLike(field: string, value: string | RegExp): this {
    if (!(value instanceof RegExp)) value = new RegExp(value);

    return this._where(field, "$regex", value);
  }

  /* ------------------------- WHERE NOT LIKE ------------------------- */

  whereNotLike(field: keyof T | string, value: string | RegExp): this;
  whereNotLike(field: string, value: string | RegExp): this {
    if (!(value instanceof RegExp)) value = new RegExp(value);

    return this._where(field, "$not", value);
  }

  /* ------------------------- WHERE IN ------------------------- */

  whereIn<K extends keyof T>(field: K, values: T[K][]): this;
  whereIn(field: string, values: unknown[]): this;
  whereIn(field: string, values: unknown[]): this {
    return this._where(field, "$in", values);
  }

  /* ------------------------- WHERE NOT IN ------------------------- */

  whereNotIn<K extends keyof T>(field: K, values: T[K][]): this;
  whereNotIn(field: string, values: unknown[]): this;
  whereNotIn(field: string, values: unknown[]): this {
    return this._where(field, "$nin", values);
  }

  /* ------------------------- WHERE BETWEEN ------------------------- */

  whereBetween<K extends keyof T>(field: K, start: T[K], end: T[K]): this;
  whereBetween(field: string, start: unknown, end: unknown): this;
  whereBetween(field: string, start: unknown, end: unknown): this {
    return this.where(field, OPERATOR.GTE, start).where(
      field,
      OPERATOR.LTE,
      end,
    );
  }

  /* ------------------------- WHERE NOT BETWEEN ------------------------- */

  whereNotBetween<K extends keyof T>(field: K, start: T[K], end: T[K]): this;
  whereNotBetween(field: string, start: unknown, end: unknown): this;
  whereNotBetween(field: string, start: unknown, end: unknown): this {
    return this.where((query) =>
      query.where(field, OPERATOR.LT, start).orWhere(field, OPERATOR.GT, end),
    );
  }

  /* ------------------------- HELPERS ------------------------- */

  protected _filter(operator: FILTER_OPERATOR, filter: unknown): this {
    const filters = { ...this._filters };

    if (operator === FILTER_OPERATOR.AND && filters.$or) {
      filters.$and = [this._filters];
      delete filters.$or;
    } else if (operator === FILTER_OPERATOR.OR && filters.$and) {
      filters.$or = [this._filters];
      delete filters.$and;
    }

    let filtersArray = filters[operator];

    if (filtersArray == null) filtersArray = [];

    filtersArray.push(filter as mongo.FilterQuery<T>);

    filters[operator] = filtersArray;

    this._filters = filters;

    return this;
  }

  protected _where(field: string, operator: string, value: unknown): this {
    return this._filter(FILTER_OPERATOR.AND, {
      [field]: {
        [operator]: value,
      },
    });
  }

  protected _orWhere(field: string, operator: string, value: unknown): this {
    return this._filter(FILTER_OPERATOR.OR, {
      [field]: {
        [operator]: value,
      },
    });
  }
}
