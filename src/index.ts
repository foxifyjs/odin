import QueryBuilder, { QueryInstance } from "./base/QueryBuilder";
import Relational from "./base/Relational";
import connections, { Driver as TDriver, getConnection } from "./connections";
import * as DB from "./DB";
import { Base as Driver } from "./drivers";
import GraphQL from "./GraphQL";
import GraphQLInstance, { GraphQLConstructor } from "./GraphQL/Model";
import * as Types from "./types";
import TypeAny from "./types/Any";
import * as utils from "./utils";

const MODELS: { [name: string]: Model | undefined } = {};

namespace ModelConstructor {
  export type Connection = string;

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

  export type DB = typeof DB;
  export type GraphQL = typeof GraphQL;
  export type Types = typeof Types;
  export type connections = typeof connections;
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
  softDelete: boolean;

  CREATED_AT: string;
  UPDATED_AT: string;
  DELETED_AT: string;

  readonly driver: TDriver;
  readonly filename: string;
  readonly models: { [name: string]: Model | undefined };

  isModel: (arg: any) => arg is Model;

  register: (...models: Model[]) => void;

  validate<T = object>(document: T, updating?: boolean): T;

  new <T = any>(document?: ModelConstructor.Document): Model<T>;
}

export interface Model<T = any> extends QueryInstance<T>, Relational {
  id?: Driver.Id;
  name: string;
  constructor: typeof Model;
}

export { DB, GraphQL, Types, connections };

@utils.mixins(QueryBuilder, Relational, GraphQLInstance)
export class Model<T = any> implements QueryInstance<T>, Relational, GraphQLInstance {
  public static DB = DB;
  public static GraphQL = GraphQL;
  public static Types = Types;
  public static connections = connections;

  public static connection: ModelConstructor.Connection = "default";

  public static table?: string;

  public static schema: ModelConstructor.Schema = {};

  public static timestamps: boolean = true;

  public static softDelete: boolean = false;

  public static CREATED_AT = "created_at";
  public static UPDATED_AT = "updated_at";
  public static DELETED_AT = "deleted_at";

  private static get _table() {
    return this.table || utils.makeTableName(this.name);
  }

  private static get _schema() {
    // TODO: id
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

  static get models() {
    return MODELS;
  }

  public static isModel = (arg: any): arg is Model => arg instanceof Model;

  public static register = (...models: Model[]) => {
    models.forEach((model) => {
      if (MODELS[model.name]) throw new Error(`Model "${model.name}" already exists`);

      MODELS[model.name] = model;
    });
  }

  public static toString() {
    return this._table;
  }

  public static validate<T = object>(document: T, updating: boolean = false) {
    const validator = (schema: ModelConstructor.Schema, doc: T) => {
      const value: { [key: string]: any } = {};
      let errors: { [key: string]: any } | null = {};

      for (const key in schema) {
        const type = schema[key];
        let item = (doc as { [key: string]: any })[key];

        if (type instanceof TypeAny) {
          // Type
          const validation = type.validate(item, updating);

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
      utils.object.forEach(validation.errors, (errors, key) => {
        if (errors.length === 1 && errors[0] === "Must be provided")
          delete (validation.errors as any)[key];
      });

      if (utils.object.size(validation.errors) === 0) validation.errors = null;
    }

    if (validation.errors) throw validation.errors;

    const value = validation.value;

    if (updating && this.timestamps) value[this.UPDATED_AT] = new Date();

    return value;
  }

  private _isNew: boolean = false;

  public attributes: ModelConstructor.Document = {};

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
      utils.define(this, "set", attr, value => this.attributes[attr] = setter(value));
      setters.push(setterName);
    }

    utils.object.forEach(document, (value, key) => {
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

  /**
   * Gets the given attribute's value
   * @param {string} attribute
   * @returns {*}
   */
  public getAttribute(attribute: string) {
    return attribute.split(".").reduce((prev, curr) => prev[curr], this.attributes);
  }

  /**
   * Sets the given attribute's value
   * @param {string} attribute
   * @param {*} value
   */
  public setAttribute(attribute: string, value: any) {
    utils.object.set(this.attributes, attribute, value);
  }

  public toJSON() {
    return utils.object.mapValues(this.attributes, (value, attr) => {
      const getter = (this as any)[utils.getGetterName(attr as string)];

      return (getter ? getter(value) : value);
    });
  }

  public inspect() {
    return this.toJSON();
  }
}

const ModelConstructor: ModelConstructor = Model as any;

export default ModelConstructor;

/**
 * FIXME: I know this seems ugly but in my defense,
 * `Typescript` doesn't support static method inside interfaces at the moment
 */
module.exports = exports.default;
module.exports.default = exports.default;
