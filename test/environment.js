const NodeEnvironment = require("jest-environment-node");
const MongoClient = require("mongodb");

class MongoEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    await global.__REPLICA__.waitUntilRunning();

    this.global.__MONGO_CONNECTION__ = await MongoClient.connect(await global.__REPLICA__.getConnectionString(), {
      useNewUrlParser: true
    });

    this.global.__MONGO_DB_NAME__ = global.__MONGO_DB_NAME__;
  }
}

module.exports = MongoEnvironment;