import Relational from "./base/Relational";
import Collection from "./Collection";
import Connect from "./Connect";
import * as DB from "./DB";
import events from "./events";
import GraphQL from "./GraphQL";
import * as Types from "./types";
import TypeAny from "./types/Any";
import { define, getGetterName, getSetterName, object, string } from "./utils";

const EVENTS: Odin.Event[] = ["create"];

module Odin {
  export type Connection = string;

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

class Odin<T extends object = any> extends Relational<T> {
  public static Collection = Collection;
  public static Connect = Connect;
  public static DB = DB;
  public static GraphQL = GraphQL;
  public static Types = Types;

  public static isOdin = (arg: any): arg is Odin => arg instanceof Odin;

  public static on<T extends object>(event: Odin.Event, listener: (item: Odin<T>) => void) {
    if (!EVENTS.includes(event)) throw new TypeError(`Unexpected event "${event}"`);

    events.on(`${this.name}:${event}`, listener);

    return this;
  }

  public static toString() {
    return this._collection;
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

  constructor(document: Odin.Document & Partial<T> = {}) {
    super();

    const schema = this.constructor._schema;
    const getters: string[] = [];
    const setters: string[] = [];

    for (const attr in schema) {
      const getterName = getGetterName(attr);
      const getter = this[getterName] || ((origin: any) => origin);
      define(this, "get", attr, () => getter(this.attributes[attr]));
      getters.push(getterName);

      const setterName = getSetterName(attr);
      const setter = this[setterName] || ((origin: any) => origin);
      define(this, "set", attr, value => this.attributes[attr] = setter(value));
      setters.push(setterName);
    }

    const relations = this.constructor._relations;

    object.forEach(document, (value, key) => {
      if (relations.includes(key)) {
        const relation = this[key]().relation;

        if (Array.isArray(value)) {
          this.relations[key] = value.map(item => new relation(item));

          return;
        }

        this.relations[key] = new relation(value);

        return;
      }

      this.attributes[key] = value;
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
  public getAttribute<K extends keyof T>(attribute: K): T[K];
  public getAttribute(attribute: string): any;
  public getAttribute(attribute: string) {
    return object.get(this.attributes, attribute);
  }

  /**
   * Sets the given attribute's value
   * @param {string} attribute
   * @param {*} value
   */
  public setAttribute<K extends keyof T>(attribute: K, value: T[K]): void;
  public setAttribute(attribute: string, value: any): void;
  public setAttribute(attribute: string, value: any) {
    object.set(this.attributes, attribute, value);
  }

  public toJSON(): object {
    const hidden = this.constructor.hidden;

    if (hidden.includes("*")) return {};

    const attributes = object.mapValues(this.attributes, (value, attr) => {
      if (hidden.includes(attr)) return undefined;

      const getter = this[getGetterName(attr)];

      return (getter ? getter(value) : value);
    });

    const relations = object.mapValues(this.relations, (value, attr) => {
      if (hidden.includes(attr)) return undefined;

      if (Array.isArray(value)) return value.map(v => v.toJSON());

      return value && value.toJSON();
    });

    return { ...attributes, ...relations };
  }

  public inspect() {
    return this.toJSON();
  }
}

export = Odin;
