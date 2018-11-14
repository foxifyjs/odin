import { ObjectId } from "mongodb";

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
