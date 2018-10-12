import * as mongodb from "mongodb";
import * as drivers from "./drivers";
import * as utils from "./utils";

const CONNECTIONS: { [name: string]: Connection } = {};

const setConnection = (name: string, connection: Connection) => CONNECTIONS[name] = connection;

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

export type Connection = <T = any, D extends drivers.Base<T> = drivers.Base<T>>() => D;

export namespace connect {
  export interface Connection {
    driver: Driver;
    database: string;
    connection?: mongodb.MongoClient;
    user?: string;
    password?: string;
    host?: string;
    port?: string;
  }

  export interface Connections {
    [name: string]: Connection;
  }
}

export const getConnection = <T = any, D extends drivers.Base<T> = drivers.Base<T>>(
  name: string
): D => CONNECTIONS[name]();

export default (connections: connect.Connections) => {
  utils.object.forEach(connections, (connection: connect.Connection, name) => {
    if (!CONNECTIONS[name])
      setConnection(name as string, connect(connection) as any);
  });
};
