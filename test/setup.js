const mongodb = require("mongodb");
const Server = require("mongodb-memory-server");

// const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const DB_NAME = "odin_test";

const MONGOD = new Server.default({
  autoStart: false,
  binary: {
    version: "4.0.5",
  },
  instance: {
    dbName: DB_NAME,
    storageEngine: "wiredTiger",
  },
});

// const REPLICA = new Server.MongoMemoryReplSet({
//   autoStart: false,
//   binary: {
//     version: "4.0.5",
//   },
//   instanceOpts: [
//     {
//       storageEngine: "wiredTiger",
//     },
//   ],
//   replSet: {
//     name: "rs",
//     dbName: DB_NAME,
//     storageEngine: "wiredTiger",
//   },
// });

module.exports = async () => {
  global.__DB_NAME__ = DB_NAME;

  await MONGOD.start();

  global.__CONNECTION__ = await mongodb.connect(
    await MONGOD.getConnectionString(), {
      useNewUrlParser: true
    }
  );

  global.__MONGOD__ = MONGOD;

  // await REPLICA.start();

  // await REPLICA.waitUntilRunning();

  // await sleep(2000);

  // global.__REPLICA_CONN__ = await mongodb.connect(
  //   await REPLICA.getConnectionString(), {
  //     useNewUrlParser: true,
  //     readConcern: {
  //       level: "majority",
  //     },
  //     // connectWithNoPrimary: true,
  //     replicaSet: "rs"
  //   }
  // );

  // global.__REPLICA__ = REPLICA;
}