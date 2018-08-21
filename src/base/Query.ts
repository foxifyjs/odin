import * as async from "async";
import * as DB from "../DB";
import { Base as Driver } from "../drivers";
import Relation from "../drivers/Relation/Base";
import ModelConstructor, { Model } from "../index";
import * as utils from "../utils";

// @ts-ignore:next-line
interface Query<T = any> extends DB<T> {
  /******************************* With Trashed *******************************/

  withTrashed(): this;

  /*********************************** Joins **********************************/

  join(table: string | ModelConstructor, query?: Driver.JoinQuery<T>, as?: string): this;

  /*********************************** Read ***********************************/

  get(): Promise<Array<Model<T>>>;
  get(callback: Driver.Callback<Array<Model<T>>>): void;

  first(): Promise<Model<T>>;
  first(callback: Driver.Callback<Model<T>>): void;

  /********************************** Inserts *********************************/

  insert(items: T[]): Promise<number>;
  insert(items: T[], callback: Driver.Callback<number>): void;

  /********************************* Restoring ********************************/

  restore(): Promise<number>;
  restore(callback: Driver.Callback<number>): void;
}

class Query<T = any> extends DB<T> {
  protected readonly _model: ModelConstructor;
  protected _withTrashed = false;

  constructor(model: ModelConstructor, table: string, relations: Relation[] = []) {
    super(model.connection);

    this.table(table);

    this._model = model;

    relations.forEach((relation) => relation.load(this));
  }

  private _apply_trashed_options() {
    if (!this._withTrashed) this.whereNull(this._model.DELETED_AT);

    return this;
  }

  /******************************* With Trashed *******************************/

  withTrashed() {
    this._withTrashed = true;

    return this;
  }

  /*********************************** Joins **********************************/

  join(table: string | ModelConstructor, query?: Driver.JoinQuery<T>, as?: string) {
    if (!utils.string.isString(table)) {
      const model = table;
      table = model.toString();

      if (!as) as = table;

      this.map((item: any) => {
        item[as as string] = item[as as string].map((i: any) => new model(i));

        return item;
      });
    }

    return super.join(table, query, as);
  }

  /*********************************** Read ***********************************/

  exists(callback?: Driver.Callback<boolean>) {
    this._apply_trashed_options();

    return super.exists(callback);
  }

  count(callback?: Driver.Callback<number>) {
    this._apply_trashed_options();

    return super.count(callback);
  }

  // @ts-ignore:next-line
  async get(callback?: Driver.Callback<Array<Model<T>>>) {
    const iterator = (item: any, cb: any) => cb(undefined, new this._model(item));

    this._apply_trashed_options();

    if (callback)
      return super.get((err, res) => {
        if (err) return callback(err, res as any);

        async.map(
          res,
          iterator,
          callback as any
        );
      });

    let items: Array<Model<T>> = [];

    async.map(
      await super.get() as any[],
      iterator,
      (err, res) => {
        if (err) throw err;

        items = res as any[];
      }
    );

    return items;
  }

  // @ts-ignore:next-line
  async first(callback?: Driver.Callback<Model<T>>) {
    const model = this._model;

    this._apply_trashed_options();

    if (callback)
      return super.first((err, res) => callback(err, res && new model(res)));

    const item = await super.first();

    return item && new model(item);
  }

  value(field: string, callback?: Driver.Callback<any>) {
    this._apply_trashed_options();

    return super.value(field, callback);
  }

  pluck(field: string, callback?: Driver.Callback<any>) {
    this._apply_trashed_options();

    return super.pluck(field, callback);
  }

  max(field: string, callback?: Driver.Callback<any>) {
    this._apply_trashed_options();

    return super.max(field, callback);
  }

  min(field: string, callback?: Driver.Callback<any>) {
    this._apply_trashed_options();

    return super.min(field, callback);
  }

  avg(field: string, callback?: Driver.Callback<any>) {
    this._apply_trashed_options();

    return super.avg(field, callback);
  }

  /********************************** Inserts *********************************/

  insert(items: T[], callback?: Driver.Callback<number>) {
    const model = this._model;
    const error = !Array.isArray(items) &&
      new Error(`Expected 'items' to be an array, '${typeof items}' given`);

    const iterator = (item: T, cb: any) => {
      try {
        cb(undefined, model.validate(item));
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
        }
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
      }
    );

    return super.insert(items);
  }

  insertGetId(item: T, callback?: Driver.Callback<Driver.Id>) {
    const model = this._model;

    try {
      item = model.validate<T>(item);
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    return super.insertGetId(item, callback);
  }

  /********************************** Updates *********************************/

  update(update: T, callback?: Driver.Callback<number>) {
    try {
      update = this._model.validate<T>(update, true);
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    this._apply_trashed_options();

    return super.update(update, callback);
  }

  // FIXME: updated_at
  increment(field: string, count?: number | Driver.Callback<number>, callback?: Driver.Callback<number>) {
    this._apply_trashed_options();

    return super.increment(field, count, callback);
  }

  // FIXME: updated_at
  decrement(field: string, count?: number | Driver.Callback<number>, callback?: Driver.Callback<number>) {
    this._apply_trashed_options();

    return super.decrement(field, count, callback);
  }

  /********************************** Deletes *********************************/

  delete(callback?: Driver.Callback<number>) {
    this._apply_trashed_options();

    if (this._model.softDelete)
      return super.update({ [this._model.DELETED_AT]: new Date() } as any, callback);

    return super.delete(callback);
  }

  /********************************* Restoring ********************************/

  restore(callback?: Driver.Callback<number>) {
    return super.update({ [this._model.DELETED_AT]: null } as any, callback);
  }
}

export default Query;
