const NodeEnvironment = require("jest-environment-node");
const MongoClient = require("mongodb");

class MongoEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    this.global.__MONGO_CONNECTION__ = await MongoClient.connect(await global.__MONGOD__.getConnectionString(), {
      useNewUrlParser: true
    });
    this.global.__MONGO_DB_NAME__ = global.__MONGO_DB_NAME__;
  }
}

module.exports = MongoEnvironment;