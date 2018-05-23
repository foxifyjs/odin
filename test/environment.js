const NodeEnvironment = require("jest-environment-node");
const MongoClient = require("mongodb");

class MongoEnvironment extends NodeEnvironment {
  async setup() {
    this.global.__MONGO_CONNECTION__ = await MongoClient.connect(await global.__MONGOD__.getConnectionString());
    this.global.__MONGO_DB_NAME__ = global.__MONGO_DB_NAME__;

    await super.setup();
  }
}

module.exports = MongoEnvironment;
