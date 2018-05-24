const MongodbMemoryServer = require("mongodb-memory-server");

const MONGO_DB_NAME = "jest";
const MONGOD = new MongodbMemoryServer.default({
  instance: {
    dbName: MONGO_DB_NAME,
  },
  binary: {
    version: "3.6.4",
  },
});

module.exports = () => {
  global.__MONGOD__ = MONGOD;
  global.__MONGO_DB_NAME__ = MONGO_DB_NAME;
};