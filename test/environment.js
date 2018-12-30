const NodeEnvironment = require("jest-environment-node");
const MongoClient = require("mongodb");

class MongoEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    await __REPLICA__.waitUntilRunning();

    this.global.__MONGO_CONNECTION__ = await MongoClient.connect(
      await __REPLICA__.getConnectionString(), {
        useNewUrlParser: true
      }
    );

    this.global.__MONGO_DB_NAME__ = await __REPLICA__.getDbName();
  }
}

module.exports = MongoEnvironment;