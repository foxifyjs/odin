import Relational from "./base/Relational";
import Connect from "./Connect";
import * as DB from "./DB";
import events from "./events";
import GraphQL from "./GraphQL";
import Relation from "./Relation/Base";
import HasOne from "./Relation/HasOne";
import MorphOne from "./Relation/MorphOne";
import * as Types from "./types";
import TypeAny from "./types/Any";
import TypeArray from "./types/Array";
import TypeDate from "./types/Date";
import TypeObjectId from "./types/ObjectId";
import { array, define, getGetterName, getSetterName, makeTableName, object, string } from "./utils";

const EVENTS: Odin.Event[] = ["create"];

module Odin {
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
    id?: DB.Id;

    [key: string]: any;
  }

  export type Event = "create";

  export type DB = typeof DB;
  export type GraphQL = typeof GraphQL;
  export type Types = typeof Types;
  export type Connect = typeof Connect;
}

class Odin<T extends object = {}> extends Relational<T> {
  public static Connect = Connect;
  public static DB = DB;
  public static GraphQL = GraphQL;
  public static Types = Types;

  public static connection: Odin.Connection = "default";

  public static table?: string;

  public static schema: Odin.Schema = {};

  public static timestamps: boolean = true;

  public static softDelete: boolean = false;

  public static CREATED_AT = "created_at";
  public static UPDATED_AT = "updated_at";
  public static DELETED_AT = "deleted_at";

  public static hidden: string[] = [];

  private static get _table() {
    return this.table || makeTableName(this.name);
  }

  private static get _schema() {
    const schema: Odin.Schema = {
      id: this.Types.id,
      ...this.schema,
    };

    if (this.timestamps) {
      schema[this.CREATED_AT] = this.Types.date.default(() => new Date());
      schema[this.UPDATED_AT] = this.Types.date;
    }

    if (this.softDelete)
      schema[this.DELETED_AT] = this.Types.date;

    return schema;
  }

  public static on<T extends object>(event: Odin.Event, listener: (item: Odin<T>) => void) {
    if (!array.contains(EVENTS, event)) throw new TypeError(`Unexpected event "${event}"`);

    events.on(`${this.name}:${event}`, listener);

    return this;
  }

  public static toString() {
    return this._table;
  }

  public static toJsonSchema() {
    const hidden = this.hidden;

    const jsonSchemaGenerator = (schema: Odin.Schema, ancestors: string[] = []) => {
      const properties: { [key: string]: any } = {};
      const required: string[] = [];

      for (const key in schema) {
        const hide = ancestors.concat([key]).join(".");

        if (array.contains(hidden, hide)) continue;

        const type = schema[key];

        if (type instanceof TypeAny) {
          // Type

          let schemaType: string = (type as any)._type.toLowerCase();

          if (
            type instanceof TypeObjectId
            || type instanceof TypeDate
          ) schemaType = "string";

          properties[key] = {
            type: schemaType,
          };

          if (type instanceof TypeArray) {
            let ofSchemaType: string = (type.ofType as any)._type.toLowerCase();

            if (
              type.ofType instanceof TypeObjectId
              || type.ofType instanceof TypeDate
            ) ofSchemaType = "string";

            properties[key].items = {
              type: ofSchemaType,
            };
          }

          if ((type as any)._required) required.push(key);

          continue;
        }

        // Object

        const generated = jsonSchemaGenerator(type, ancestors.concat([key]));

        if (object.size(generated.properties) === 0) {
          properties[key] = {
            type: "object",
          };

          continue;
        }

        properties[key] = generated;

        if (generated.required.length) required.push(key);
      }

      return {
        properties,
        required,
        type: "object",
      };
    };

    const jsonSchema = jsonSchemaGenerator(this.schema);

    if (this.timestamps) {
      jsonSchema.properties[this.CREATED_AT] = {
        type: "string",
      };

      jsonSchema.properties[this.UPDATED_AT] = {
        type: "string",
      };

      jsonSchema.required.push(this.CREATED_AT);
    }

    if (this.softDelete) jsonSchema.properties[this.DELETED_AT] = {
      type: "string",
    };

    for (const key of Object.getOwnPropertyNames(this.prototype)) {
      if (key === "constructor") continue;

      const proto = this.prototype[key]();
      if (proto instanceof Relation) {
        if (proto instanceof HasOne || proto instanceof MorphOne) {
          jsonSchema.properties[key] = {
            type: "object",
          };

          continue;
        }

        jsonSchema.properties[key] = {
          type: "array",
          items: {
            type: "object",
          },
        };
      }
    }

    return jsonSchema;
  }

  public static validate<T = object>(document: T, updating: boolean = false) {
    const validator = (schema: Odin.Schema, doc: T) => {
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

          if (object.size(validation.value) > 0) value[key] = validation.value;
        }
      }

      if (object.size(errors) === 0) errors = null;

      return {
        errors,
        value,
      };
    };

    const validation = validator(this._schema, document);

    if (validation.errors && updating) {
      object.forEach(validation.errors, (errors, key) => {
        if (errors.length === 1 && errors[0] === "Must be provided")
          delete (validation.errors as any)[key];
      });

      if (object.size(validation.errors) === 0) validation.errors = null;
    }

    if (validation.errors) {
      const error = new Error("Unprocessable Entity") as any;

      error.errors = validation.errors;
      error.code = 422;

      throw error;
    }

    const value = validation.value;

    if (updating && this.timestamps) value[this.UPDATED_AT] = new Date();

    return value;
  }

  public attributes: Odin.Document & Partial<T> = {};

  constructor(document: Odin.Document & Partial<T> = {}) {
    super();

    const schema = this.constructor._schema;
    const getters: string[] = [];
    const setters: string[] = [];

    for (const attr in schema) {
      const getterName = getGetterName(attr);
      const getter = (this as any)[getterName] || ((origin: any) => origin);
      define(this, "get", attr, () => getter(this.attributes[attr]));
      getters.push(getterName);

      const setterName = getSetterName(attr);
      const setter = (this as any)[setterName] || ((origin: any) => origin);
      define(this, "set", attr, value => this.attributes[attr] = setter(value));
      setters.push(setterName);
    }

    object.forEach(document, (value, key) => {
      if (setters.indexOf(key as string) === -1) this.attributes[key] = value;
      else (this as any)[key] = value;
    });

    // virtual attributes
    Object.getOwnPropertyNames(this.constructor.prototype).forEach((key) => {
      if (getters.indexOf(key) !== -1) return;

      const regex = /^get([A-Z].*)Attribute$/.exec(key);

      if (!regex) return;

      define(this, "get", string.snakeCase(regex[1]), (this as any)[key]);
    });
  }

  /**
   * Gets the given attribute's value
   * @param {string} attribute
   * @returns {*}
   */
  public getAttribute(attribute: string) {
    return object.get(this.attributes, attribute);
  }

  /**
   * Sets the given attribute's value
   * @param {string} attribute
   * @param {*} value
   */
  public setAttribute(attribute: string, value: any) {
    object.set(this.attributes, attribute, value);
  }

  public toJSON() {
    const hidden = this.constructor.hidden;

    return object.mapValues(this.attributes, (value, attr) => {
      if (array.contains(hidden, attr)) return undefined;

      const getter = (this as any)[getGetterName(attr)];

      return (getter ? getter(value) : value);
    });
  }

  public inspect() {
    return this.toJSON();
  }
}

export = Odin;
