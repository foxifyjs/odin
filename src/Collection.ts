import * as async from "async";
import * as mongodb from "mongodb";
import { connection as getConnection } from "./Connect";

namespace Collection {
  export interface Spec {
    [field: string]: 1 | -1;
  }

  export interface Index {
    spec: Spec;
    options: mongodb.IndexOptions;
  }
}

class Collection {
  protected _connection = "default";

  protected _indexes: Collection.Index[] = [];

  constructor(public collection: string, public options: mongodb.CollectionCreateOptions = {}) { }

  public connection(connection: string) {
    this._connection = connection;

    return this;
  }

  public index(spec: Collection.Spec, options: mongodb.IndexOptions = {}) {
    this._indexes.push({
      spec,
      options,
    });

    return this;
  }

  public exec(callback?: (err?: mongodb.MongoError) => void) {
    const DB = getConnection(this._connection);

    if (callback) return DB.createCollection(this.collection, this.options, (err, COLLECTION) => {
      if (err) return callback(err);

      async.forEach(
        this._indexes,
        ({ spec, options }, cb) => COLLECTION.createIndex(spec, options, cb),
        err => callback(err as any)
      );
    });

    return new Promise((resolve, reject) => {
      DB.createCollection(this.collection, this.options, (err, COLLECTION) => {
        if (err) return reject(err);

        async.forEach(
          this._indexes,
          ({ spec, options }, cb) => COLLECTION.createIndex(spec, options, cb),
          (err) => {
            if (err) return reject(err);

            resolve();
          }
        );
      });
    });
  }
}

export default Collection;
