import * as async from "async";
import { Connection } from "../connections";
import { Base as Driver } from "../drivers";
import ModelConstructor, { Model } from "../index";
import * as DB from "../DB";

interface Query<T = Model> extends DB<T> {
  get(): Promise<T[]>;
  get(callback: Driver.Callback<T[]>): void;

  first(): Promise<T>;
  first(callback: Driver.Callback<T>): void;
}

class Query<T = Model> extends DB<T> {
  protected _model: ModelConstructor;

  constructor(model: ModelConstructor, connection: Connection) {
    super(connection);

    this._model = model;
  }

  async get(callback?: Driver.Callback<T[]>) {
    const iterator = (item: any, callback: any) => callback(undefined, new this._model(item));

    if (callback)
      return super.get((err, res) => {
        if (err) return callback(err, res as any);

        async.map(
          res,
          iterator,
          callback as any,
        );
      });

    let items: T[] = [];

    async.map(
      await super.get() as any[],
      iterator,
      (err, res) => {
        if (err) throw err;

        items = res as T[];
      },
    );

    return items;
  }

  async first(callback?: Driver.Callback<T>) {
    if (callback)
      return super.first((err, res) => callback(err, new this._model(res) as any));

    return new this._model(await super.get());
  }
}

export default Query;
