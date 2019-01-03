import * as callerId from "caller-id";
import { ObjectId } from "mongodb";
import { date, object, string } from "prototyped.js/es6/methods";
import * as Odin from ".";

export * from "prototyped.js/es6/methods";

export const initialize = (Model: typeof Odin, document: Odin.Document) => {
  const model = new Model(document);

  (model as any)._original = document;

  return model;
};

/**
 * Adds the getter/setter to the given object
 * @param {object} obj
 * @param {("get" | "set")} method
 * @param {string} name
 * @param {(value?: any) => any} func
 */
export function define(
  obj: object,
  method: "get" | "set",
  name: string,
  func: (value?: any) => any
) {
  Object.defineProperty(
    obj,
    name,
    {
      configurable: true,
      enumerable: true,
      [method]: func,
    }
  );
}

/**
 * Generates getter name for the given key
 * @param {string} key
 * @returns {string}
 * @example
 * getGetterName("first_name"); // getFirstNameAttribute
 */
export const getGetterName = (key: string) =>
  `get${string.capitalize(string.camelCase(key))}Attribute`;

/**
 * Generates setter name for the given key
 * @param {string} key
 * @returns {string}
 * @example
 * getSetterName("first_name"); // setFirstNameAttribute
 */
export const getSetterName = (key: string) =>
  `set${string.capitalize(string.camelCase(key))}Attribute`;

/**
 * Generates collection name for the given name
 * @param {string} name
 * @returns {string}
 * @example
 * makeCollectionName("user_account"); // user_accounts
 */
export const makeCollectionName = (name: string) => {
  const key = string.snakeCase(name).split("_");

  key.push(string.pluralize(key.pop() as string));

  return key.join("_");
};

/**
 * Generates the singular form of the given collection name
 * @param {string} name
 * @returns {string}
 * @example
 * makeCollectionType("user_accounts"); // user_account
 */
export const makeCollectionType = (name: string) => {
  const key = name.split("_");

  key.push(string.pluralize(key.pop() as string, 1));

  return key.join("_");
};

/**
 * Generates the id related to the given collection name
 * @param {string} name
 * @returns {string}
 * @example
 * makeCollectionId("users"); // user_id
 */
export const makeCollectionId = (name: string) => `${makeCollectionType(name)}_id`;

/**
 * Generates the polymorphic collection name
 * @param {string} name
 * @returns {string}
 * @example
 * makeMorphType("accounts"); // accountable
 */
export const makeMorphType = (name: string) => `${makeCollectionType(name)}able`;

/**
 * Gets the name of the caller method of the given function
 * @param {Function} func
 * @returns {string}
 */
export const getCallerFunctionName = (func: (...args: any[]) => any) =>
  callerId.getData(func).methodName;

export const OPERATORS: { [operator: string]: string } = {
  "<": "lt",
  "<=": "lte",
  "=": "eq",
  "<>": "ne",
  ">=": "gte",
  ">": "gt",
};

export const isID = (id: string) => /(Id$|_id$|^id$|_ids$|Ids$)/.test(id);

export const prepareKey = (id: string) => id === "id" ? "_id" : id;

export const prepareValue = (field: string, value: any) => {
  if (!isID(field)) return value;

  if (Array.isArray(value)) return value.map(v => new ObjectId(v));

  if (!ObjectId.isValid(value)) return value;

  return new ObjectId(value);
};

export const prepareToRead = (document: any): any => {
  if (
    !document ||
    !(object.isObject(document) || typeof document === "object") ||
    date.isDate(document)
  ) return document;

  if (Array.isArray(document)) return document.map(prepareToRead);

  return object.mapValues(
    object.mapKeys(document, (value, key) => key === "_id" ? "id" : key),
    (value, key) => {
      if (!value) return value;

      if (!isID(key)) return prepareToRead(value);

      if (Array.isArray(value)) return value.map(v => v.toString());

      return value.toString();
    });
};

export const prepareToStore = (document: any): any => {
  if (
    !document ||
    !(object.isObject(document) || typeof document === "object") ||
    date.isDate(document)
  ) return document;

  if (Array.isArray(document)) return document.map(prepareToStore);

  return object.mapValues(
    object.mapKeys(document, (value, key) => key === "id" ? "_id" : key),
    (value, key) => {
      if (!isID(key)) return prepareToStore(value);

      if (ObjectId.isValid(value)) return new ObjectId(value);

      return prepareToStore(value);
    });
};
