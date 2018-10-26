import QueryBuilder from "./base/QueryBuilder";
import Relational from "./base/Relational";
import connections from "./connections";
import * as DB from "./DB";
import { Base as Driver } from "./drivers";
import GraphQL from "./GraphQL";
import GraphQLInstance from "./GraphQL/Model";
import Model from "./Model";
import * as Types from "./types";
import * as utils from "./utils";

module Odin {
  export type Connection = string;

  export interface ConnectionObject {
    driver?: string;
    host?: string;
    port?: string;
    database: string;
    user?: string;
    password?: string;
  }

  export interface Schema {
    [key: string]: any;
  }

  export interface Document {
    id?: Driver.Id;

    [key: string]: any;
  }

  export type Event = "created";

  export type DB = typeof DB;
  export type GraphQL = typeof GraphQL;
  export type Types = typeof Types;
  export type connections = typeof connections;
}

interface Odin<T = any> extends Model<T> {
  [K: string]: any;
}

const Odin = utils.use(
  utils.use(
    utils.use(
      Model,
      QueryBuilder
    ),
    Relational
  ),
  GraphQLInstance
);

export = Odin;
