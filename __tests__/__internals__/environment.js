const NodeEnvironment = require("jest-environment-node");

class MongoEnvironment extends NodeEnvironment {
  async setup() {
    this.global.__MONGO_CONNECTION__ = __CONNECTION__;

    this.global.__MONGO_DB_NAME__ = __DB_NAME__;

    return await super.setup();
  }
}

module.exports = MongoEnvironment;