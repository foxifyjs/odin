import * as rootPath from "app-root-path";

export * from "prototyped.js/es6/methods";

export const root = {
  path: rootPath.path,
};

export function mixins(...baseCtors: any[]) {
  return (derivedCtor: any) => {
    baseCtors.forEach((baseCtor) => {
      // static methods
      Object.getOwnPropertyNames(baseCtor).forEach((name) => {
        if (!exports.array.contains(["length", "constructor", "prototype", "name"], name) && !derivedCtor[name])
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

export function define(obj: object, mothod: "get" | "set", name: string, func: (value?: any) => any) {
  Object.defineProperty(
    obj,
    name,
    {
      configurable: true,
      enumerable: true,
      [mothod]: func,
    },
  );
}

export const getGetterName = (key: string) => `get${exports.string.capitalize(exports.string.camelCase(key))}Attribute`;

export const getSetterName = (key: string) => `set${exports.string.capitalize(exports.string.camelCase(key))}Attribute`;

export const makeTableName = (name: string) => {
  const key = exports.string.snakeCase(name).split("_");

  key.push(exports.string.pluralize(key.pop() as string));

  return key.join("_");
};

export const makeTableId = (name: string) => {
  const key = name.split("_");

  key.push(`${exports.string.singularize(key.pop() as string)}_id`);

  return key.join("_");
};

export const setObjectValue = (obj: { [key: string]: any }, path: string, value: any) => {
  const keys = path.split(".");
  const length = keys.length - 1;
  let i = 0;

  for (; i < length; i++) obj = obj[keys[i]];

  obj[keys[i]] = value;
};
