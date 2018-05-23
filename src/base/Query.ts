import * as async from "async";
import * as DB from "../DB";
import { Base as Driver } from "../drivers";
import Relation from "../drivers/Relation/Base";
import ModelConstructor, { Model } from "../index";
import * as utils from "../utils";

// @ts-ignore:next-line
interface Query<T = any> extends DB<T> {
  join(table: string | ModelConstructor, query?: Driver.JoinQuery<T>, as?: string): this;

  get(): Promise<Array<Model<T>>>;
  get(callback: Driver.Callback<Array<Model<T>>>): void;

  first(): Promise<Model<T>>;
  first(callback: Driver.Callback<Model<T>>): void;

  insert(items: T[]): Promise<number>;
  insert(items: T[], callback: Driver.Callback<number>): void;
}

class Query<T = any> extends DB<T> {
  protected readonly _model: ModelConstructor;

  constructor(model: ModelConstructor, relations: Relation[] = []) {
    super(model.connection);

    this._model = model;

    relations.map((relation) => relation.load(this));
  }

  join(table: string | ModelConstructor, query?: Driver.JoinQuery<T>, as?: string) {
    if (!utils.string.isInstance(table)) {
      const model = table;
      table = model.toString();

      if (!as) as = table;

      this.map((item: any) => {
        item[<string>as] = item[<string>as].map((i: any) => new model(i));

        return item;
      });
    }

    return super.join(table, query, as);
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
      return super.first((err, res) => callback(err, res && new this._model(res) as any));

    const item = await super.first();

    return item && new this._model(item);
  }

  insert(items: T[], callback?: Driver.Callback<number>) {
    const error = !Array.isArray(items) &&
      new Error(`Expected 'items' to be an array, '${typeof items}' given`);

    const iterator = (item: T, cb: any) => {
      try {
        cb(undefined, this._model.validate(item));
      } catch (err) {
        cb(err);
      }
    };

    if (callback) {
      if (error) return callback(error, undefined as any);

      return async.map(
        // @ts-ignore:next-line
        items,
        iterator,
        (err: any, res: T[]) => {
          if (err) return callback(err, undefined as any);

          super.insert(res, callback);
        },
      );
    }

    if (error) throw error;

    async.map(
      // @ts-ignore:next-line
      items,
      iterator,
      (err: any, res: T[]) => {
        if (err) throw err;

        items = res;
      },
    );

    return super.insert(items);
  }

  insertGetId(item: T, callback?: Driver.Callback<Driver.Id>) {
    try {
      item = this._model.validate<T>(item);
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    return super.insertGetId(item, callback);
  }

  update(update: T, callback?: Driver.Callback<number>) {
    try {
      update = this._model.validate<T>(update, true);
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    return super.update(update, callback);
  }
}

export default Query;
