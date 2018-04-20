import * as async from "async";
import * as DB from "../DB";
import { Connection } from "../connections";
import { Base as Driver } from "../drivers";
import ModelConstructor, { Model } from "../index";

// @ts-ignore:next-line
interface Query<T = any> extends DB<T> {
  get(): Promise<Array<Model<T>>>;
  get(callback: Driver.Callback<Array<Model<T>>>): void;

  first(): Promise<Model<T>>;
  first(callback: Driver.Callback<Model<T>>): void;

  insert(items: T[]): Promise<number>;
  insert(items: T[], callback: Driver.Callback<number>): void;

  create(item: T): Promise<Model<T>>;
  create(item: T, callback: Driver.Callback<Model<T>>): void;
}

class Query<T = any> extends DB<T> {
  protected _model: ModelConstructor;

  constructor(model: ModelConstructor, connection: Connection) {
    super(connection);

    this._model = model;
  }

  // @ts-ignore:next-line
  async get(callback?: Driver.Callback<Array<Model<T>>>) {
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

    let items: Array<Model<T>> = [];

    async.map(
      await super.get() as any[],
      iterator,
      (err, res) => {
        if (err) throw err;

        items = res as any[];
      },
    );

    return items;
  }

  // @ts-ignore:next-line
  async first(callback?: Driver.Callback<Model<T>>) {
    if (callback)
      return super.first((err, res) => callback(err, new this._model(res) as any));

    return new this._model(await super.first());
  }

  insert(items: T[], callback?: Driver.Callback<number>) {
    if (!Array.isArray(items))
      throw new Error(`Expected 'items' to be an array, '${typeof items}' given`);

    return super.insert(items, callback);
  }

  // @ts-ignore:next-line
  async create(item: T, callback?: Driver.Callback<Model<T>>) {
    if (callback)
      return super.create(item, (err, res) => callback(err, new this._model(res) as any));

    return new this._model(await super.create(item));
  }
}

export default Query;
