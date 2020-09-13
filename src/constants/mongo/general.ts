import { ObjectId } from "mongodb";
import { Operator, Order } from "../general";

export type MongoID = ObjectId;

export const MONGO_ROOT = "$$ROOT";

export const MONGO_NULL = "$__NULL__";

export const MONGO_OPERATOR_MAP: { [key in Operator]: string } = {
  "<": "$lt",
  "<=": "$lte",
  "=": "$eq",
  "!=": "$ne",
  ">=": "$gte",
  ">": "$gt",
};

export const MONGO_ORDER_MAP: { [key in Order]: number } = {
  asc: 1,
  desc: -1,
};
