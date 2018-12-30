import * as Schema from "@foxify/schema";
import Relational from "./base/Relational";
import Collection from "./Collection";
import Connect from "./Connect";
import * as DB from "./DB";
import EventEmitter from "./DB/EventEmitter";
import GraphQL from "./GraphQL";
import Types from "./types";
import { define, getGetterName, getSetterName, initialize, object, prepareToRead, string } from "./utils";

module Odin {
  export type Connection = string;

  export interface Schema {
    [key: string]: any;
  }

  export interface Document {
    id?: DB.Id;

    [key: string]: any;
  }

  export type DB = typeof DB;
  export type GraphQL = typeof GraphQL;
  export type Types = typeof Types;
  export type Connect = typeof Connect;
}

class Odin<T extends object = any> extends Relational<T> {
  protected static get _events() {
    return new EventEmitter(this.connection, this._collection);
  }

  public static Collection = Collection;
  public static Connect = Connect;
  public static DB = DB;
  public static GraphQL = GraphQL;
  public static Types = Types;

  public static isOdin = (arg: any): arg is Odin => arg instanceof Odin;

  public static toString() {
    return this._collection;
  }

  public static validate<T extends object = object>(document: T, updating: boolean = false) {
    const validation = Schema.validate(this._schema, document);

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

    const value: any = validation.value;

    if (updating && this.timestamps) (value)[this.UPDATED_AT] = new Date();

    return value;
  }

  /********************************** Event **********************************/

  public static on<T extends object>(event: EventEmitter.Event, listener: (item: Odin<T>) => void) {
    this._events.on(event, item => listener(initialize(this, prepareToRead(item)) as any));

    return this;
  }

  public static once<T extends object>(event: EventEmitter.Event, listener: (item: Odin<T>) => void) {
    this._events.once(event, item => listener(initialize(this, prepareToRead(item)) as any));

    return this;
  }

  public static removeAllListeners(event?: EventEmitter.Event) {
    this._events.removeAllListeners(event);

    return this;
  }

  public static removeListener<T extends object>(event: EventEmitter.Event, listener: (data: Odin<T>) => void) {
    this._events.removeListener(event, item => listener(initialize(this, prepareToRead(item)) as any));

    return this;
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
