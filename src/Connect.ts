import * as deasync from "deasync";
import * as mongodb from "mongodb";
import { object } from "./utils";

const CONNECTIONS: { [name: string]: () => mongodb.Db } = {};

export namespace connect {
  export interface Connection {
    database: string;
    connection?: mongodb.MongoClient;
    auth?: {
      database?: string;
      user?: string;
      password?: string;
    };
    host?: string;
    port?: string;
  }

  export interface Connections {
    [name: string]: Connection;
  }
}

export const connection = (name: string) => CONNECTIONS[name]();

const connect = (connections: connect.Connections) => {
  object.forEach(connections, (connection: connect.Connection, name) => {
    if (CONNECTIONS[name]) return;

    if (connection.connection) {
      CONNECTIONS[name] = () => (connection.connection as mongodb.MongoClient).db(connection.database);

      return;
    }

    const OPTIONS: mongodb.MongoClientOptions = {
      useNewUrlParser: true,
    };

    let database = connection.database;

    if (connection.auth && connection.auth.user && connection.auth.password) {
      OPTIONS.auth = {
        user: connection.auth.user,
        password: connection.auth.password,
      };

      if (connection.auth.database) database = connection.auth.database;
    }

    const uri = `mongodb://${connection.host || "127.0.0.1"}:${connection.port || "27017"}/${database}`;

    const server = <mongodb.MongoClient>deasync(mongodb.MongoClient.connect)(uri, OPTIONS);

    CONNECTIONS[name] = () => server.db(connection.database);
  });
};

export default connect;
