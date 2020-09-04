const mongodb = require("mongodb");
const Server = require("mongodb-memory-server");

const DB_NAME = "odin_test";

const MONGOD = new Server.default({
  autoStart: false,
  binary: {
    version: "4.4.0",
  },
  instance: {
    dbName: DB_NAME,
    storageEngine: "wiredTiger",
  },
});

module.exports = async () => {
  await MONGOD.start();

  global.__CONNECTION__ = await mongodb.connect(
    await MONGOD.getConnectionString(), {
      useNewUrlParser: true
    }
  );

  global.__DB_NAME__ = DB_NAME;
  global.__MONGOD__ = MONGOD;
}