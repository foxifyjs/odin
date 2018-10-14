import * as async from "async";
import * as DB from "../DB";
import { Base as Driver } from "../drivers";
import Relation from "../drivers/Relation/Base";
import * as Model from "../index";
import * as utils from "../utils";

class Query<T = any, D extends Driver<T> = any> extends DB<T, D, "query"> {
  protected readonly _model: typeof Model;
  protected _withTrashed = false;

  constructor(model: typeof Model, table: string, relations: Relation[] = []) {
    super(model.connection);

    this.table(table);

    this._model = model;

    relations.forEach(relation => relation.load(this));
  }

  private _apply_trashed_options() {
    if (this._model.softDelete && !this._withTrashed)
      this.whereNull(this._model.DELETED_AT);

    return this;
  }

  /******************************* With Trashed *******************************/

  public withTrashed() {
    this._withTrashed = true;

    return this;
  }

  /*********************************** Joins **********************************/

  public join(table: string | typeof Model, query?: Driver.JoinQuery<T>, as?: string) {
    if (!utils.string.isString(table)) {
      const model = table;
      table = model.toString();

      if (!as) as = table as string;

      this.map((item: any) => {
        item[as as string] = item[as as string].map((i: any) => new model(i));

        return item;
      });
    }

    return super.join(table as string, query, as);
  }

  /*********************************** Read ***********************************/

  public exists(): Promise<boolean>;
  public exists(callback: Driver.Callback<boolean>): void;
  public exists() {
    this._apply_trashed_options();

    return super.exists.apply(this, arguments);
  }

  public count(): Promise<number>;
  public count(callback: Driver.Callback<number>): void;
  public count() {
    this._apply_trashed_options();

    return super.count.apply(this, arguments);
  }

  public get(): Promise<Array<Model<T>>>;
  public get(callback: Driver.Callback<Array<Model<T>>>): void;
  public async get(callback?: Driver.Callback<Array<Model<T>>>) {
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

  public first(): Promise<Model<T>>;
  public first(callback: Driver.Callback<Model<T>>): void;
  public async first(callback?: Driver.Callback<Model<T>>) {
    const model = this._model;

    this._apply_trashed_options();

    if (callback)
      return super.first((err, res) => callback(err, res && new model(res)));

    const item = await super.first();

    return item && new model(item);
  }

  public value(field: string): Promise<any>;
  public value(field: string, callback: Driver.Callback<any>): void;
  public value() {
    this._apply_trashed_options();

    return super.value.apply(this, arguments);
  }

  public pluck(field: string): Promise<any>;
  public pluck(field: string, callback: Driver.Callback<any>): void;
  public pluck() {
    this._apply_trashed_options();

    return super.pluck.apply(this, arguments);
  }

  public max(field: string): Promise<any>;
  public max(field: string, callback: Driver.Callback<any>): void;
  public max() {
    this._apply_trashed_options();

    return super.max.apply(this, arguments);
  }

  public min(field: string): Promise<any>;
  public min(field: string, callback: Driver.Callback<any>): void;
  public min() {
    this._apply_trashed_options();

    return super.min.apply(this, arguments);
  }

  public avg(field: string): Promise<any>;
  public avg(field: string, callback: Driver.Callback<any>): void;
  public avg() {
    this._apply_trashed_options();

    return super.avg.apply(this, arguments);
  }

  /********************************** Inserts *********************************/

  public insert(items: T[]): Promise<number>;
  public insert(items: T[], callback: Driver.Callback<number>): void;
  public insert(items: T[], callback?: Driver.Callback<number>) {
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

      return (async as any).map(
        items,
        iterator,
        (err: any, res: T[]) => {
          if (err) return callback(err, undefined as any);

          super.insert(res, callback);
        }
      );
    }

    if (error) throw error;

    (async as any).map(
      items,
      iterator,
      (err: any, res: T[]) => {
        if (err) throw err;

        items = res;
      }
    );

    return super.insert(items);
  }

  public insertGetId(item: T): Promise<Driver.Id>;
  public insertGetId(item: T, callback: Driver.Callback<Driver.Id>): void;
  public insertGetId(item: T, callback?: Driver.Callback<Driver.Id>) {
    const model = this._model;

    try {
      item = model.validate<T>(item) as any;
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    return super.insertGetId.call(this, item, callback);
  }

  /********************************** Updates *********************************/

  public update(update: T): Promise<number>;
  public update(update: T, callback: Driver.Callback<number>): void;
  public update(update: T, callback?: Driver.Callback<number>) {
    try {
      update = this._model.validate<T>(update, true) as any;
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    this._apply_trashed_options();

    return super.update.call(this, update, callback);
  }

  // FIXME: updated_at
  public increment(field: string, count?: number): Promise<number>;
  public increment(field: string, callback: Driver.Callback<number>): void;
  public increment(field: string, count: number, callback: Driver.Callback<number>): void;
  public increment() {
    this._apply_trashed_options();

    return super.increment.apply(this, arguments);
  }

  // FIXME: updated_at
  public decrement(field: string, count?: number): Promise<number>;
  public decrement(field: string, callback: Driver.Callback<number>): void;
  public decrement(field: string, count: number, callback: Driver.Callback<number>): void;
  public decrement() {
    this._apply_trashed_options();

    return super.decrement.apply(this, arguments);
  }

  /********************************** Deletes *********************************/

  public delete(): Promise<number>;
  public delete(callback: Driver.Callback<number>): void;
  public delete(callback?: Driver.Callback<number>) {
    this._apply_trashed_options();

    if (this._model.softDelete)
      return super.update.call(this, { [this._model.DELETED_AT]: new Date() } as any, callback);

    return super.delete.call(this, callback);
  }

  /********************************* Restoring ********************************/

  public restore(): Promise<number>;
  public restore(callback: Driver.Callback<number>): void;
  public restore(callback?: Driver.Callback<number>) {
    return super.update.call(this, { [this._model.DELETED_AT]: null } as any, callback);
  }
}

export default Query;
