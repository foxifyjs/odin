export * from "prototyped.js/es6/methods";

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

export const makeTableName = (name: string) => `${exports.string.snakeCase(name)}s`;
