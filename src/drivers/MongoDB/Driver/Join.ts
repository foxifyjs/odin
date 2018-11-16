import { array, makeTableId, object, string } from "../../../utils";
import Driver from "../../Driver";
import { OPERATORS, prepareKey } from "../utils";
import Filter from "./Filter";

class Join<T = any> extends Filter {
  protected _pipeline: object[] = [];

  protected _let: { [key: string]: any } = {};

  protected _filters: Filter.Filters = {
    $and: [],
  };

  public get pipeline() {
    this._resetFilters();

    return {
      $lookup: {
        as: this._as,
        from: this._table,
        let: this._let,
        pipeline: this._pipeline,
      },
    };
  }

  constructor(
    protected _ancestor: string,
    protected _table: string,
    protected _as: string = _table
  ) {
    super();
  }

  /********************************** Helpers *********************************/

  protected _resetFilters() {
    const FILTER = this.filters;

    if (object.size(FILTER) > 0) {
      this._pipeline.push({ $match: FILTER });

      this._filters = {
        $and: [],
      };
    }

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

  /*********************************** Joins **********************************/

  public join(
    table: string,
    query: Driver.JoinQuery<T> = q => q.where(makeTableId(table), `${table}.id`),
    as: string = table
  ) {
    const join: Join = query(new Join(this._table, table, as)) as any;

    this._resetFilters();

    this._pipeline.push(join.pipeline);

    return this;
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
