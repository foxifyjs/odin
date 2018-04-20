import * as async from "async";
import { Base as Driver } from "../drivers";
import { getConnection } from "../connections";
import * as DB from "../DB";
import Query from "./Query";

interface QueryBuilder<T = any> {
  find(id: Driver.Id): Promise<T>;
  find(id: Driver.Id, callback: Driver.Callback<T>): void;

  all(): Promise<T[]>;
  all(callback: Driver.Callback<T[]>): void;
}

class QueryBuilder {
  static connection: string;
  static _table: string;

  static query(): DB {
    return new Query(this as any, getConnection(this.connection)).table(this._table);
  }

  static find(id: Driver.Id, callback?: Driver.Callback<any>) {
    return this.query().where("id", id).first(callback);
  }

  static async all(callback?: Driver.Callback<any>) {
    return this.query().get(callback);
  }
}

export default QueryBuilder;
