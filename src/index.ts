import "prototyped.js";
import * as DB from "./DB";
import * as Types from "./types";
import * as utils from "./utils";
import QueryBuilder from "./base/QueryBuilder";
import connections, { connect, getConnection } from "./connections";

module ModelConstructor {
  export type Connection = string;
  // export type Connection = string | ConnectionObject;

  export interface ConnectionObject {
    driver?: string;
    host?: string;
    port?: string;
    database: string;
    user?: string;
    password?: string;
  }

  export interface Schema {
    [key: string]: any;
  }

  export interface Document {
    id?: string | number;

    [key: string]: any;
  }
}

interface ModelConstructor<T = any> extends QueryBuilder {
  readonly prototype: Model;
  constructor: typeof Model;

  Types: typeof Types;
  connections: typeof connections;

  connection?: ModelConstructor.Connection;
  table?: string;
  timestamps?: boolean;

  new <T>(document?: ModelConstructor.Document): Model<T>;
}

// export interface Model<T = any> {
//   constructor: typeof Model;
// }

@utils.mixins(QueryBuilder)
export class Model<T = any> {
  static DB = DB;
  static Types = Types;
  static connections = connections;

  static connection: ModelConstructor.Connection = "default";

  static table?: string;

  static timestamps: boolean = true;

  static schema: ModelConstructor.Schema = {};

  private static get _table() {
    return this.table || utils.makeTableName(this.name);
  }

  private static get _schema() {
    const schema = {
      id: this.Types.ObjectId,
      ...this.schema,
    };

    if (!this.timestamps) return schema;

    return {
      ...schema,
      created_at: this.Types.Date.default(() => new Date()),
      updated_at: this.Types.Date,
    };
  }

  attributes: ModelConstructor.Document;

  constructor(document: ModelConstructor.Document = {}) {
    this.attributes = document;
  }
}

const ModelConstructor: ModelConstructor = Model as any;

export default ModelConstructor;

/**
 * FIXME I know this seems ugly but in my defense,
 * `Typescript` doesn't support static method inside interfaces at the moment
 */
module.exports = exports.default;
module.exports.default = exports.default;
