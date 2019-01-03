const fs = require("fs");
const rimraf = require("rimraf");
const path = require("path");
const portfinder = require("portfinder");
const mongodb = require("mongodb");
const {
  ReplSet,
  Server,
  Sharded
} = require("mongodb-topology-manager");

const dbpath = path.resolve(__dirname, "db");

const prepare = () => new Promise((resolve, reject) => {
  if (fs.existsSync(dbpath)) {
    rimraf(dbpath, (err) => {
      if (err) return reject(err);

      resolve();
    });
  } else {
    fs.mkdirSync(dbpath);
    resolve();
  }
});

const DB_NAME = "odin_test";

module.exports = async () => {
  await prepare();

  const server = new Server("mongod", {
    dbpath,
    port: await portfinder.getPortPromise(),
    storageEngine: "wiredTiger",
  });

  await server.discover();

  await server.purge();

  await server.start();

  global.__CONNECTION__ = await mongodb.connect(
    `mongodb://localhost:${server.port}/${DB_NAME}`, {
      useNewUrlParser: true
    }
  );

  global.__DB_NAME__ = DB_NAME;
}