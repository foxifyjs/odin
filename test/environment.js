const NodeEnvironment = require("jest-environment-node");

class MongoEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    this.global.__MONGO_CONNECTION__ = __CONNECTION__;

    this.global.__MONGO_DB_NAME__ = __DB_NAME__;
  }
}

module.exports = MongoEnvironment;