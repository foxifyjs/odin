import * as mongodb from "mongodb";
import * as drivers from "./drivers";
import * as utils from "./utils";

const CONNECTIONS_GLOBAL = Symbol("__FOXIFY_ODIN__");

if (!(global as any)[CONNECTIONS_GLOBAL]) (global as any)[CONNECTIONS_GLOBAL] = {};

const setConnection = (name: string, connection: Connection) => (global as any)[CONNECTIONS_GLOBAL][name] = connection;

const connect = (connection: connect.Connection) => {
  switch (connection.driver) {
    case "MongoDB":
      return drivers.MongoDB.Driver.connect(connection);
    default:
      throw new Error("Unknown database driver");
  }
};

export type Driver = "MongoDB";
export type Query = mongodb.Db;

export type Connection = <T = any>() => drivers.Base<T>;

export namespace connect {
  export interface Connection {
    driver: Driver;
    host?: string;
    port?: string;
    database: string;
    user?: string;
    password?: string;
  }

  export interface Connections {
    [name: string]: connect.Connection;
  }
}

export const getConnection = (name: string): Connection => (global as any)[CONNECTIONS_GLOBAL][name];

export default (connections: connect.Connections) => {
  utils.object.map(connections, (connection: connect.Connection, name) => {
    if (!getConnection(name as string)) setConnection(name as string, connect(connection));
  });
};
