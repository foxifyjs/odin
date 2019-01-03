const http = require("http");
const os = require("os");
const fs = require("fs");
const {
  execSync
} = require("child_process");
const rimraf = require("rimraf");
const path = require("path");
const portfinder = require("portfinder");
const mongodb = require("mongodb");
const {
  ReplSet,
  Server,
  Sharded
} = require("mongodb-topology-manager");

const mongod_path = path.resolve(__dirname, "mongodb");
const dbpath = path.resolve(__dirname, "db");

const download = () => new Promise(async (resolve, reject) => {
  const dl_version = `mongodb-${os.platform()}-x86_64-latest.tgz`;
  const dl_path = path.resolve(__dirname, dl_version);

  const file = fs.createWriteStream(dl_path);

  http
    .get(`http://fastdl.mongodb.org/${os.platform()}/${dl_version}`, (res) => {
      res.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          execSync(`tar -zxvf ${dl_path} -C ${mongod_path} --strip-components=1`);

          resolve();
        });
      });
    })
    .on("error", reject);
});

const prepare = () => new Promise(async (resolve, reject) => {
  if (!fs.existsSync(mongod_path)) {
    fs.mkdirSync(mongod_path);

    try {
      await download();
    } catch (error) {
      fs.rmdirSync(mongod_path);

      return reject(error);
    }
  }

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

  const server = new Server(path.resolve(mongod_path, "bin", "mongod"), {
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