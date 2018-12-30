const MongodbMemoryServer = require("mongodb-memory-server");

// const MONGOD = new MongodbMemoryServer.default({
//   instance: {
//     storageEngine: "wiredTiger",
//   },
//   binary: {
//     version: "4.0.5",
//   },
// });

const REPLICA = new MongodbMemoryServer.MongoMemoryReplSet({
  instanceOpts: [{
    storageEngine: "wiredTiger",
  }],
  replSet: {
    storageEngine: "wiredTiger",
    count: 1,
  },
  binary: {
    version: "4.0.5",
  },
});

module.exports = () => {
  // global.__MONGOD__ = MONGOD;
  global.__REPLICA__ = REPLICA;
};