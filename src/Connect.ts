import deasync from "deasync";
import * as mongodb from "mongodb";

let CONNECTION: () => mongodb.Db;

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

export const connection = (): mongodb.Db => CONNECTION();

export default function connect(connection: Connection): void {
  if (CONNECTION != null) return;

  const client = connection.connection;

  if (client != null) {
    CONNECTION = () => client.db(connection.database);

    return;
  }

  const OPTIONS: mongodb.MongoClientOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  let database = connection.database;

  if (connection.auth && connection.auth.user && connection.auth.password) {
    OPTIONS.auth = {
      user: connection.auth.user,
      password: connection.auth.password,
    };

    if (connection.auth.database) database = connection.auth.database;
  }

  const uri = `mongodb://${connection.host || "127.0.0.1"}:${
    connection.port || "27017"
  }/${database}`;

  const server = <mongodb.MongoClient>(
    deasync(mongodb.MongoClient.connect)(uri, OPTIONS)
  );

  CONNECTION = () => server.db(connection.database);
}
