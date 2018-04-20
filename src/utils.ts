export function mixins(...baseCtors: any[]) {
  return (derivedCtor: any) => {
    baseCtors.forEach((baseCtor) => {
      // static methods
      Object.getOwnPropertyNames(baseCtor).forEach((name) => {
        if (!["length", "constructor", "prototype", "name"].contains(name) && !derivedCtor[name])
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

export const getGetterName = (key: string) => `get${key.camelCase().capitalize()}Attribute`;

export const getSetterName = (key: string) => `set${key.camelCase().capitalize()}Attribute`;

export const makeTableName = (name: string) => `${name.snakeCase()}s`;
