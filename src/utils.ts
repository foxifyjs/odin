import * as callerId from "caller-id";
import { ObjectId } from "mongodb";

export * from "prototyped.js/es6/methods";

/**
 * Adds the given mixins to the class
 * @param {...*[]} baseCtors
 * @returns {Function}
 */
export function mixins(...baseCtors: any[]) {
  return (derivedCtor: any) => {
    baseCtors.forEach((baseCtor) => {
      // static methods
      Object.getOwnPropertyNames(baseCtor).forEach((name) => {
        if (!exports.array.contains(["length", "constructor", "prototype", "name"], name)
          && !derivedCtor[name])
          derivedCtor[name] = baseCtor[name];
      });

      // instance methods
      Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
        if (name !== "constructor" && !derivedCtor.prototype[name])
          derivedCtor.prototype[name] = baseCtor.prototype[name];
      });
    });

    return derivedCtor;
  };
}

export interface ClassInterface {
  new(...args: any[]): any;
}

/**
 * Adds the given mixin to the class
 * @param {*} baseCtor
 * @returns {Function}
 */
export function use<
  T extends ClassInterface = any,
  P extends ClassInterface = any
  >(derivedCtor: T, baseCtor: P): ClassInterface & T & P {
  // static methods
  Object.getOwnPropertyNames(baseCtor).forEach((name) => {
    if (!exports.array.contains(["length", "constructor", "prototype", "name"], name)
      && !(derivedCtor as any)[name])
      (derivedCtor as any)[name] = (baseCtor as any)[name];
  });

  // instance methods
  Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
    if (name !== "constructor" && !derivedCtor.prototype[name])
      derivedCtor.prototype[name] = baseCtor.prototype[name];
  });

  return derivedCtor as any;
}

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
  `get${exports.string.capitalize(exports.string.camelCase(key))}Attribute`;

/**
 * Generates setter name for the given key
 * @param {string} key
 * @returns {string}
 * @example
 * getSetterName("first_name"); // setFirstNameAttribute
 */
export const getSetterName = (key: string) =>
  `set${exports.string.capitalize(exports.string.camelCase(key))}Attribute`;

/**
 * Generates table name for the given name
 * @param {string} name
 * @returns {string}
 * @example
 * makeTableName("user_account"); // user_accounts
 */
export const makeTableName = (name: string) => {
  const key = exports.string.snakeCase(name).split("_");

  key.push(exports.string.pluralize(key.pop() as string));

  return key.join("_");
};

/**
 * Generates the singular form of the given table name
 * @param {string} name
 * @returns {string}
 * @example
 * makeTableType("user_accounts"); // user_account
 */
export const makeTableType = (name: string) => {
  const key = name.split("_");

  key.push(exports.string.pluralize(key.pop() as string, 1));

  return key.join("_");
};

/**
 * Generates the id related to the given table name
 * @param {string} name
 * @returns {string}
 * @example
 * makeTableId("users"); // user_id
 */
export const makeTableId = (name: string) => `${makeTableType(name)}_id`;

/**
 * Generates the polymorphic table name
 * @param {string} name
 * @returns {string}
 * @example
 * makeMorphType("accounts"); // accountable
 */
export const makeMorphType = (name: string) => `${makeTableType(name)}able`;

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

export const isID = (id: string) => /(Id$|_id$|^id$)/.test(id);

export const prepareKey = (id: string) => id === "id" ? "_id" : id;

export const prepareValue = (field: string, value: any) => {
  if (!isID(field)) return value;

  if (Array.isArray(value)) return value.map(v => new ObjectId(v));

  if (!ObjectId.isValid(value)) return value;

  return new ObjectId(value);
};
