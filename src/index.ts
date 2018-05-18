import * as DB from "./DB";
import QueryBuilder, { QueryInstance } from "./base/QueryBuilder";
import Relational from "./base/Relational";
import connections, { connect, getConnection, Driver as TDriver } from "./connections";
import { Base as Driver } from "./drivers";
import Relation from "./drivers/Relation/Base";
import * as Types from "./types";
import TypeAny from "./types/Any";
import GraphQLInstance, { GraphQLConstructor } from "./GraphQL/Model";
import GraphQL from "./GraphQL";
import * as utils from "./utils";

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
    id?: Driver.Id;

    [key: string]: any;
  }
}

interface ModelConstructor<T = any> extends QueryBuilder, GraphQLConstructor {
  readonly prototype: Model;

  constructor: typeof Model;

  DB: typeof DB;
  GraphQL: typeof GraphQL;
  Types: typeof Types;
  connections: typeof connections;

  connection: ModelConstructor.Connection;
  table?: string;
  timestamps?: boolean;

  readonly driver: TDriver;
  readonly filename: string;

  validate<T = object>(document: T, updating?: boolean): T;

  new <T>(document?: ModelConstructor.Document): Model<T>;
}

export interface Model<T = any> extends QueryInstance<T>, Relational {
  constructor: typeof Model;
}

@utils.mixins(QueryBuilder, Relational, GraphQLInstance)
export class Model<T = any> implements QueryInstance<T>, Relational, GraphQLInstance {
  static DB = DB;
  static GraphQL = GraphQL;
  static Types = Types;
  static connections = connections;

  static connection: ModelConstructor.Connection = "default";

  static table?: string;

  static schema: ModelConstructor.Schema = {};

  static timestamps: boolean = true;

  static softDelete: boolean = false;

  static CREATED_AT = "created_at";
  static UPDATED_AT = "updated_at";
  static DELETED_AT = "deleted_at";

  private static get _table() {
    return this.table || utils.makeTableName(this.name);
  }

  private static get _schema() {
    // TODO id
    const schema: ModelConstructor.Schema = {
      id: this.Types.ObjectId,
      ...this.schema,
    };

    if (this.timestamps) {
      schema[this.CREATED_AT] = this.Types.Date.default(() => new Date());
      schema[this.UPDATED_AT] = this.Types.Date;
    }

    if (this.softDelete)
      schema[this.DELETED_AT] = this.Types.Date;

    return schema;
  }

  static get filename() {
    return __filename.replace(new RegExp(`(^${utils.root.path}|\.[tj]s$)`, "g"), "");
  }

  static get driver() {
    return getConnection(this.connection).driver;
  }

  static toString() {
    return this._table;
  }

  static validate<T = object>(document: T, updating: boolean = false) {
    const validator = (schema: ModelConstructor.Schema, doc: T) => {
      const value: { [key: string]: any } = {};
      let errors: { [key: string]: any } | null = {};

      for (const key in schema) {
        const type = schema[key];
        let item = (doc as { [key: string]: any })[key];

        if (type instanceof TypeAny) {
          // Type
          const validation = type.validate(item);

          if (validation.value) value[key] = validation.value;

          if (validation.errors) errors[key] = validation.errors;
        } else {
          // Object
          if (!item) item = {};

          const validation = validator(type, item);

          if (validation.errors)
            for (const errorKey in validation.errors)
              errors[`${key}.${errorKey}`] = validation.errors[errorKey];

          if (utils.object.size(validation.value) > 0) value[key] = validation.value;
        }
      }

      if (utils.object.size(errors) === 0) errors = null;

      return {
        errors,
        value,
      };
    };

    const validation = validator(this._schema, document);

    if (validation.errors && updating) {
      utils.object.map(validation.errors, (errors, key) => {
        if (errors.length === 1 && errors.first() === "Must be provided")
          delete (validation.errors as any)[key];
      });

      if (utils.object.size(validation.errors) === 0) validation.errors = null;
    }

    if (validation.errors) throw validation.errors;

    return validation.value;
  }

  private _isNew: boolean = false;

  attributes: ModelConstructor.Document = {};

  constructor(document: ModelConstructor.Document = {}) {
    if (!document.id) this._isNew = true;

    this._setAttributes(document);
  }

  private _setAttributes(document: ModelConstructor.Document) {
    const schema = this.constructor._schema;
    const getters: string[] = [];
    const setters: string[] = [];

    for (const attr in schema) {
      const getterName = utils.getGetterName(attr);
      const getter = (this as any)[getterName] || ((origin: any) => origin);
      utils.define(this, "get", attr, () => getter(this.attributes[attr]));
      getters.push(getterName);

      const setterName = utils.getSetterName(attr);
      const setter = (this as any)[setterName] || ((origin: any) => origin);
      utils.define(this, "set", attr, (value) => this.attributes[attr] = setter(value));
      setters.push(setterName);
    }

    utils.object.map(document, (value, key) => {
      if (setters.indexOf(key as string) === -1) this.attributes[key] = value;
      else (this as any)[key] = value;
    });

    // virtual attributes
    Object.getOwnPropertyNames(this.constructor.prototype).forEach((key) => {
      if (getters.indexOf(key) !== -1) return;

      const regex = /^get([A-Z].*)Attribute$/.exec(key);

      if (!regex) return;

      utils.define(this, "get", utils.string.snakeCase(regex[1]), (this as any)[key]);
    });
  }

  getAttribute(attribute: string) {
    return attribute.split(".").reduce((prev, curr) => prev[curr], this.attributes);
  }

  setAttribute(attribute: string, value: any) {
    utils.setObjectValue(this.attributes, attribute, value);
  }

  toJson() {
    return utils.object.map(this.attributes, (value, attr) => {
      const getter = (this as any)[utils.getGetterName(attr as string)];

      return (getter ? getter(value) : value);
    });
  }

  inspect() {
    return this.toJson();
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
