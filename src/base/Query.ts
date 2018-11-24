import * as async from "async";
import * as mongodb from "mongodb";
import * as Odin from "..";
import * as DB from "../DB";
import events from "../events";
import Relation from "../Relation/Base";
import { string } from "../utils";

class Query<T extends object = {}> extends DB<T> {
  protected readonly _model: typeof Odin;
  protected _withTrashed = false;

  constructor(model: typeof Odin, table: string, relations: Relation[] = []) {
    super(model.connection);

    this.collection(table);

    this._model = model;

    relations.forEach(relation => relation.load(this as any));
  }

  protected _emit(event: string, ops: any[]) {
    ops.forEach(item => events.emit(event, new this._model(this._prepareToRead(item))));
  }

  protected _apply_trashed_options() {
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

  public join(table: string | typeof Odin, query?: DB.JoinQuery<T>, as?: string) {
    if (!string.isString(table)) {
      const model = table;
      table = model.toString();

      if (!as) as = table as string;

      this.map((item: any) => {
        const joined = item[as as string];

        if (Array.isArray(joined)) item[as as string] = joined.map((i: any) => new model(i));
        else item[as as string] = new model(joined);

        return item;
      });
    }

    return super.join(table as string, query, as);
  }

  /*********************************** Read ***********************************/

  public exists(): Promise<boolean>;
  public exists(callback: DB.Callback<boolean>): void;
  public exists() {
    this._apply_trashed_options();

    return super.exists.apply(this, arguments);
  }

  public count(): Promise<number>;
  public count(callback: DB.Callback<number>): void;
  public count() {
    this._apply_trashed_options();

    return super.count.apply(this, arguments);
  }

  public get(): Promise<T[]>;
  public get(callback: DB.Callback<T[]>): void;
  public async get(callback?: DB.Callback<T[]>) {
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

    let items: T[] = [];

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

  public first(): Promise<T>;
  public first(callback: DB.Callback<T>): void;
  public async first(callback?: DB.Callback<T>) {
    this.limit(1);

    if (callback) return this.get((err, res) =>
      (callback as DB.Callback<T>)(err, res && res[0]));

    return (await this.get())[0];
  }

  public value(field: string): Promise<any>;
  public value(field: string, callback: DB.Callback<any>): void;
  public value() {
    this._apply_trashed_options();

    return super.value.apply(this, arguments);
  }

  public pluck(field: string): Promise<any>;
  public pluck(field: string, callback: DB.Callback<any>): void;
  public pluck() {
    this._apply_trashed_options();

    return super.pluck.apply(this, arguments);
  }

  public max(field: string): Promise<any>;
  public max(field: string, callback: DB.Callback<any>): void;
  public max() {
    this._apply_trashed_options();

    return super.max.apply(this, arguments);
  }

  public min(field: string): Promise<any>;
  public min(field: string, callback: DB.Callback<any>): void;
  public min() {
    this._apply_trashed_options();

    return super.min.apply(this, arguments);
  }

  public avg(field: string): Promise<any>;
  public avg(field: string, callback: DB.Callback<any>): void;
  public avg() {
    this._apply_trashed_options();

    return super.avg.apply(this, arguments);
  }

  /********************************** Inserts *********************************/

  protected async _insertMany(item: T[], callback?: DB.Callback<mongodb.InsertWriteOpResult>) {
    const event = `${this._model.name}:create`;

    if (events.listenerCount(event) === 0)
      return super._insertMany(item, callback as any) as any;

    if (callback)
      return super._insertMany(item, (err, res) => {
        if (err) callback(err, res as any);

        this._emit(event, res.ops);

        callback(err, res);
      });

    const result = await super._insertMany(item);

    this._emit(event, result.ops);

    return result;
  }

  protected async _insertOne(item: T, callback?: DB.Callback<mongodb.InsertOneWriteOpResult>) {
    const event = `${this._model.name}:create`;

    if (events.listenerCount(event) === 0)
      return super._insertOne(item, callback as any) as any;

    if (callback)
      return super._insertOne(item, (err, res) => {
        if (err) callback(err, res as any);

        this._emit(event, res.ops);

        callback(err, res);
      });

    const result = await super._insertOne(item);

    this._emit(event, result.ops);

    return result;
  }

  public insert(items: T[]): Promise<number>;
  public insert(items: T[], callback: DB.Callback<number>): void;
  public insert(items: T[], callback?: DB.Callback<number>) {
    const model = this._model;
    const error = !Array.isArray(items) &&
      new TypeError(`Expected 'items' to be an array, '${typeof items}' given`);

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

  public insertGetId(item: T): Promise<DB.Id>;
  public insertGetId(item: T, callback: DB.Callback<DB.Id>): void;
  public async insertGetId(item: T, callback?: DB.Callback<DB.Id>) {
    try {
      item = this._model.validate<T>(item) as any;
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    return await super.insertGetId(item, callback as any) as any;
  }

  /********************************** Updates *********************************/

  protected _update(
    update: { [key: string]: any },
    callback?: DB.Callback<mongodb.UpdateWriteOpResult>
  ): Promise<mongodb.UpdateWriteOpResult> {
    if (!update.$unset) {
      if (!update.$set) update.$set = {};

      update.$set[this._model.UPDATED_AT] = new Date();
    }

    return super._update(update, callback);
  }

  public update(update: T): Promise<number>;
  public update(update: T, callback: DB.Callback<number>): void;
  public update(update: T, callback?: DB.Callback<number>) {
    try {
      update = this._model.validate<T>(update, true) as any;
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    this._apply_trashed_options();

    return super.update.call(this, update, callback);
  }

  public increment(field: string, count?: number): Promise<number>;
  public increment(field: string, callback: DB.Callback<number>): void;
  public increment(field: string, count: number, callback: DB.Callback<number>): void;
  public increment() {
    this._apply_trashed_options();

    return super.increment.apply(this, arguments);
  }

  public decrement(field: string, count?: number): Promise<number>;
  public decrement(field: string, callback: DB.Callback<number>): void;
  public decrement(field: string, count: number, callback: DB.Callback<number>): void;
  public decrement() {
    this._apply_trashed_options();

    return super.decrement.apply(this, arguments);
  }

  /********************************** Deletes *********************************/

  public delete(): Promise<number>;
  public delete(callback: DB.Callback<number>): void;
  public delete(callback?: DB.Callback<number>) {
    this._apply_trashed_options();

    if (this._model.softDelete)
      return super.update.call(this, { [this._model.DELETED_AT]: new Date() }, callback);

    return super.delete.call(this, callback);
  }

  /********************************* Restoring ********************************/

  public restore(): Promise<number>;
  public restore(callback: DB.Callback<number>): void;
  public async restore(callback?: DB.Callback<number>) {
    if (callback)
      return this._update({ $unset: { [this._model.DELETED_AT]: "" } }, (err, res) => {
        if (err) return callback(err, res as any);

        callback(err, res.modifiedCount);
      });

    return (await this._update({ $unset: { [this._model.DELETED_AT]: "" } }, callback)).modifiedCount;
  }
}

export default Query;
