export type Obj = { [key: string]: unknown };

export type Item<T extends Obj> = T;

export type Constructor<T extends Obj = Obj> = { new (...args: unknown[]): T };

export const enum OPERATOR {
  LT = "<",
  LTE = "<=",
  EQ = "=",
  NEQ = "!=",
  GTE = ">=",
  GT = ">",
}

export type Operator = OPERATOR | "<" | "<=" | "=" | "!=" | ">=" | ">";

export const enum ORDER {
  ASC = "asc",
  DESC = "desc",
}

export type Order = ORDER | "asc" | "desc";
