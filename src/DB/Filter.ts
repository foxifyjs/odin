import * as mongodb from "mongodb";
import * as DB from ".";
import { function as func, OPERATORS, prepareKey, string } from "../utils";

namespace Filter {
  export interface Filters<T = any> {
    $and?: Array<mongodb.FilterQuery<T>>;
    $or?: Array<mongodb.FilterQuery<T>>;
    [operator: string]: any;
  }
}

class Filter<T extends object = any> {
  protected _filter: Filter.Filters = {
    $and: [],
  };

  protected get _filters() {
    const FILTERS = {
      ...this._filter,
    };

    if (FILTERS.$and && FILTERS.$and.length === 0) delete FILTERS.$and;
    else if (FILTERS.$or && FILTERS.$or.length === 0) delete FILTERS.$or;

    return FILTERS;
  }

  /********************************** Helpers *********************************/

  protected _push_filter(operator: "and" | "or", value: any) {
    const _filters = { ...this._filter };

    if (operator === "and" && _filters.$or) {
      _filters.$and = [this._filter];
      delete _filters.$or;
    } else if (operator === "or" && _filters.$and) {
      _filters.$or = [this._filter];
      delete _filters.$and;
    }

    _filters[`$${operator}`].push(value);

    this._filter = _filters;

    return this;
  }

  protected _where(field: string, operator: string, value: any) {
    field = prepareKey(field);

    return this._push_filter("and", {
      [field]: {
        [`$${operator}`]: value,
      },
    });
  }

  protected _or_where(field: string, operator: string, value: any) {
    field = prepareKey(field);

    return this._push_filter("or", {
      [field]: {
        [`$${operator}`]: value,
      },
    });
  }

  /******************************* Where Clauses ******************************/

  public where(query: DB.FilterQuery): this;
  public where<K extends keyof T>(field: K, value: T[K]): this;
  public where(field: string, value: any): this;
  public where<K extends keyof T>(field: K, operator: DB.Operator, value: T[K]): this;
  public where(field: string, operator: DB.Operator, value: any): this;
  public where(field: string | DB.FilterQuery, operator?: DB.Operator | any, value?: any) {
    if (func.isFunction(field)) {
      const filter: Filter = field(new Filter()) as any;

      return this._push_filter("and", filter._filters);
    }

    if (value === undefined) {
      value = operator;
      operator = "=";
    }

    return this._where(field, OPERATORS[operator], value);
  }

  public orWhere(query: DB.FilterQuery): this;
  public orWhere<K extends keyof T>(field: K, value: T[K]): this;
  public orWhere(field: string, value: any): this;
  public orWhere<K extends keyof T>(field: K, operator: DB.Operator, value: T[K]): this;
  public orWhere(field: string, operator: DB.Operator, value: any): this;
  public orWhere(field: string | DB.FilterQuery, operator?: DB.Operator | any, value?: any) {
    if (func.isFunction(field)) {
      const filter: Filter = field(new Filter()) as any;

      return this._push_filter("or", filter._filters);
    }

    if (value === undefined) {
      value = operator;
      operator = "=";
    }

    return this._or_where(field, OPERATORS[operator], value);
  }

  public whereLike<K extends keyof T>(field: K, value: string | RegExp): this;
  public whereLike(field: string, value: string | RegExp): this;
  public whereLike(field: string, value: string | RegExp) {
    if (!(value instanceof RegExp)) value = new RegExp(value, "i");

    return this._where(field, "regex", value);
  }

  public whereNotLike<K extends keyof T>(field: K, value: string | RegExp): this;
  public whereNotLike(field: string, value: string | RegExp): this;
  public whereNotLike(field: string, value: string | RegExp) {
    if (!(value instanceof RegExp)) value = new RegExp(value, "i");

    return this._where(field, "not", value);
  }

  public whereIn(field: string, embeddedField: string): this;
  public whereIn<K extends keyof T>(field: K, embeddedField: string): this;
  public whereIn(field: string, values: any[]): this;
  public whereIn<K extends keyof T>(field: K, values: Array<T[K]>): this;
  public whereIn(field: string, values: any) {
    if (string.isString(values)) values = `$${values}`;

    return this._where(field, "in", values);
  }

  public whereNotIn(field: string, embeddedField: string): this;
  public whereNotIn<K extends keyof T>(field: K, embeddedField: string): this;
  public whereNotIn(field: string, values: any[]): this;
  public whereNotIn<K extends keyof T>(field: K, values: Array<T[K]>): this;
  public whereNotIn(field: string, values: any) {
    if (string.isString(values)) values = `$${values}`;

    return this._where(field, "nin", values);
  }

  public whereBetween<K extends keyof T>(field: K, start: T[K], end: T[K]): this;
  public whereBetween(field: string, start: any, end: any): this;
  public whereBetween(field: string, start: any, end: any) {
    return this._where(field, "gte", start)
      ._where(field, "lte", end);
  }

  public whereNotBetween<K extends keyof T>(field: K, start: T[K], end: T[K]): this;
  public whereNotBetween(field: string, start: any, end: any): this;
  public whereNotBetween(field: string, start: any, end: any) {
    return this._where(field, "lt", start)
      ._or_where(field, "gt", end);
  }

  public whereNull<K extends keyof T>(field: T[K]): this;
  public whereNull(field: string): this;
  public whereNull(field: string) {
    return this._where(field, "eq", null);
  }

  public whereNotNull<K extends keyof T>(field: T[K]): this;
  public whereNotNull(field: string): this;
  public whereNotNull(field: string) {
    return this._where(field, "ne", null);
  }
}

export default Filter;
