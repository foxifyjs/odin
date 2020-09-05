import * as assert from "assert";
import * as async from "async";
import * as mongodb from "mongodb";
import * as Odin from "..";
import DB, { Operator, JoinQuery, Callback, Iterator, Id } from "../DB";
import EventEmitter from "../DB/EventEmitter";
import Filter from "../DB/Filter";
import Relation from "../Relation/Base";
import {
  function as func,
  initialize,
  number,
  OPERATORS,
  prepareToStore,
  string,
} from "../utils";

const { isFunction } = func;

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Query {
  export interface Rel {
    relation: Relation;
    relations: Relation.Relation[];
  }
}

class Query<T extends Record<string, unknown> = any> extends DB<T> {
  protected readonly _model: typeof Odin;

  protected readonly _relations: Query.Rel[];

  protected _withTrashed = false;

  protected _lean = false;

  constructor(model: typeof Odin, relations: Query.Rel[] = []) {
    super(model.connection);

    this.collection((model as any)._collection);

    this._model = model;
    this._relations = relations;
  }

  protected _apply_options(withRelations = false) {
    // if (this._model.softDelete && !this._withTrashed)
    //   this.whereNull(this._model.DELETED_AT);

    if (withRelations)
      this._relations.forEach(({ relation, relations }) =>
        relation.load(this as any, relations, this._withTrashed),
      );

    return this;
  }

  /******************************* With Trashed *******************************/

  public withTrashed() {
    if (!this._model.softDelete && this._withTrashed) return this;

    this._withTrashed = true;

    return this.whereNotNull(this._model.DELETED_AT);
  }

  /*********************************** Lean ***********************************/

  public lean() {
    this._lean = true;

    return this;
  }

  /****************************** Has & WhereHas ******************************/

  public has(relation: string, count?: number): this;
  public has(relation: string, operator: Operator, count?: number): this;
  public has(relation: string, operator: Operator | number = ">=", count = 1) {
    return this.whereHas(relation, undefined as any, operator as any, count);
  }

  public whereHas(
    relation: string,
    filter: (q: Filter) => Filter,
    count?: number,
  ): this;
  public whereHas(
    relation: string,
    filter: (q: Filter) => Filter,
    operator: Operator,
    count?: number,
  ): this;
  public whereHas(
    relation: string,
    filter: (q: Filter) => Filter,
    operator: Operator | number = ">=",
    count = 1,
  ) {
    if (number.isNumber(operator)) {
      count = operator;
      operator = ">=";
    }

    const relations = relation.split(".");
    const relationsCount = relations.length;
    const currentRelation = relations.shift() as string;

    if (!(this._model as any)._relations.includes(currentRelation))
      throw new Error(
        `Relation '${currentRelation}' does not exist on '${this._model.name}' Model`,
      );

    this.aggregate({
      $project: {
        data: "$$ROOT",
        relation: "$$ROOT",
      },
    });

    // join relation
    this._model.prototype[currentRelation]().loadCount(
      this,
      relations,
      this._withTrashed,
      filter,
    );

    if (relationsCount > 1) {
      const projector = (length: number): any => {
        const isFirst = length === relationsCount;
        length = length - 1;

        if (length === 0)
          return {
            $concatArrays: ["$$value", { $ifNull: ["$$this.relation", []] }],
          };

        return {
          $reduce: {
            input: isFirst ? "$relation" : "$$this.relation",
            initialValue: [],
            in: projector(length),
          },
        };
      };

      this.aggregate({
        $project: {
          data: 1,
          relation: projector(relationsCount),
        },
      });
    }

    return this.aggregate(
      // {
      //   $project: {
      //     data: 1,
      //     relation: {
      //       $reduce: {
      //         input: "$relation",
      //         initialValue: [],
      //         in: {
      //           $concatArrays: ["$$value", "$$this.relation"],
      //         },
      //       },
      //     },
      //   },
      // }
      {
        // filter data according to count and operator
        $match: {
          $expr: {
            [`$${OPERATORS[operator]}`]: [{ $size: "$relation" }, count],
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$data",
        },
      },
    );
  }

  /*********************************** Joins **********************************/

  public join(
    collection: string | typeof Odin,
    query?: JoinQuery<T>,
    as?: string,
  ) {
    if (!string.isString(collection)) {
      const model = collection;
      collection = model.toString();

      if (!as) as = collection as string;

      this.map((item: any) => {
        const joined = item[as as string];

        if (Array.isArray(joined))
          item[as as string] = joined.map((i: any) => initialize(model, i));
        else item[as as string] = joined && initialize(model, joined);

        return item;
      });
    }

    return super.join(collection as string, query, as);
  }

  /*********************************** Read ***********************************/

  public exists(): Promise<boolean>;
  public exists(callback: Callback<boolean>): void;
  public exists(callback?: Callback<boolean>) {
    this._apply_options(true).lean();

    return super.exists(callback as any) as any;
  }

  public count(): Promise<number>;
  public count(callback: Callback<number>): void;
  public count(callback?: Callback<number>) {
    this._apply_options(true).lean();

    return super.count(callback as any) as any;
  }

  public iterate(): Iterator<T> {
    const iterator = super.iterate();
    const next = iterator.next;

    iterator.next = async () => {
      const item = await next();

      return item && (initialize(this._model, item) as any);
    };

    return iterator;
  }

  public get(): Promise<T[]>;
  public get(callback: Callback<T[]>): void;
  public async get(callback?: Callback<T[]>) {
    const iterator = (item: any, cb: any) =>
      cb(undefined, initialize(this._model, item));

    this._apply_options(true);

    if (callback)
      return super.get((err, res) => {
        if (err || this._lean) return callback(err, res as any);

        async.map(res, iterator, callback as any);
      });

    if (this._lean) return await super.get();

    let items: T[] = [];

    async.map((await super.get()) as any[], iterator, (err, res) => {
      if (err) throw err;

      items = res as any[];
    });

    return items;
  }

  public first(): Promise<T>;
  public first(callback: Callback<T>): void;
  public async first(callback?: Callback<T>) {
    this.limit(1);

    if (callback)
      return this.get((err, res) =>
        (callback as Callback<T>)(err, res && res[0]),
      );

    return (await this.get())[0];
  }

  public value(field: string): Promise<any>;
  public value(field: string, callback: Callback<any>): void;
  public value(field: string, callback?: Callback<any>) {
    this._apply_options(true);

    return super.value(field, callback as any) as any;
  }

  public pluck(field: string): Promise<any>;
  public pluck(field: string, callback: Callback<any>): void;
  public pluck(field: string, callback?: Callback<any>) {
    this._apply_options(true);

    return super.pluck(field, callback as any) as any;
  }

  public max(field: string): Promise<any>;
  public max(field: string, callback: Callback<any>): void;
  public max(field: string, callback?: Callback<any>) {
    this._apply_options(true).lean();

    return super.max(field, callback as any) as any;
  }

  public min(field: string): Promise<any>;
  public min(field: string, callback: Callback<any>): void;
  public min(field: string, callback?: Callback<any>) {
    this._apply_options(true).lean();

    return super.min(field, callback as any) as any;
  }

  public avg(field: string): Promise<any>;
  public avg(field: string, callback: Callback<any>): void;
  public avg(field: string, callback?: Callback<any>) {
    this._apply_options(true).lean();

    return super.avg(field, callback as any) as any;
  }

  /********************************** Inserts *********************************/

  public insert(items: T[]): Promise<number>;
  public insert(items: T[], callback: Callback<number>): void;
  public insert(items: T[], callback?: Callback<number>) {
    const model = this._model;

    assert(
      Array.isArray(items),
      `Expected 'items' to be an array, '${typeof items}' given`,
    );

    const iterator = (item: T, cb: any) => {
      try {
        cb(undefined, model.validate(item));
      } catch (err) {
        cb(err);
      }
    };

    if (callback)
      return (async as any).map(items, iterator, (err: any, res: T[]) => {
        if (err) return callback(err, undefined as any);

        super.insert(res, callback);
      });

    (async as any).map(items, iterator, (err: any, res: T[]) => {
      if (err) throw err;

      items = res;
    });

    return super.insert(items);
  }

  public insertGetId(item: T): Promise<Id>;
  public insertGetId(item: T, callback: Callback<Id>): void;
  public async insertGetId(item: T, callback?: Callback<Id>) {
    try {
      item = this._model.validate<T>(item) as any;
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    return (await super.insertGetId(item, callback as any)) as any;
  }

  /********************************** Updates *********************************/

  protected _update(
    update: { [key: string]: any },
    callback?: Callback<mongodb.UpdateWriteOpResult>,
    soft?: {
      type: "delete" | "restore";
      field: string;
      value?: Date;
    },
  ): Promise<mongodb.UpdateWriteOpResult> {
    if (!soft || soft.type !== "delete") {
      if (!update.$set) update.$set = {};

      const value = new Date();

      if (soft) soft.value = value;

      update.$set[this._model.UPDATED_AT] = value;
    }

    return super._update(update, callback, soft as any);
  }

  public update(update: Partial<T>): Promise<number>;
  public update(update: Partial<T>, callback: Callback<number>): void;
  public update(update: Partial<T>, callback?: Callback<number>) {
    try {
      update = this._model.validate(update, true) as any;
    } catch (err) {
      if (callback) return callback(err, undefined as any);

      throw err;
    }

    this._apply_options();

    return super.update.call(this, update, callback as any) as any;
  }

  public increment(field: string, count?: number): Promise<number>;
  public increment(field: string, callback: Callback<number>): void;
  public increment(
    field: string,
    count: number,
    callback: Callback<number>,
  ): void;
  public increment() {
    this._apply_options();

    // eslint-disable-next-line prefer-rest-params
    return super.increment.apply(this, arguments as any) as any;
  }

  public decrement(field: string, count?: number): Promise<number>;
  public decrement(field: string, callback: Callback<number>): void;
  public decrement(
    field: string,
    count: number,
    callback: Callback<number>,
  ): void;
  public decrement() {
    this._apply_options();

    // eslint-disable-next-line prefer-rest-params
    return super.decrement.apply(this, arguments as any) as any;
  }

  public unset(fields: string[]): Promise<number>;
  public unset(fields: string[], callback: Callback<number>): void;
  public unset(fields: string[], callback?: Callback<number>) {
    return super.unset(fields, callback as any) as any;
  }

  /********************************** Deletes *********************************/

  public delete(force?: boolean): Promise<number>;
  public delete(callback: Callback<number>): void;
  public delete(force: boolean, callback: Callback<number>): void;
  public async delete(
    force: boolean | Callback<number> = false,
    callback?: Callback<number>,
  ) {
    if (isFunction(force)) {
      callback = force;
      force = false;
    }

    // this._apply_options();

    if (!this._model.softDelete || force) {
      if (callback) return super.delete(callback);

      return await super.delete();
    }

    const field = this._model.DELETED_AT;
    const value = new Date();

    const _update = {
      $set: { [field]: value },
    };

    const soft = {
      field,
      value,
      type: "delete" as const,
    };

    if (callback)
      return this._update(
        _update,
        (err, res) => (callback as any)(err, res.modifiedCount),
        soft,
      );

    return (await this._update(_update, undefined, soft)).modifiedCount;
  }

  /********************************* Restoring ********************************/

  public restore(): Promise<number>;
  public restore(callback: Callback<number>): void;
  public async restore(callback?: Callback<number>) {
    const _update = { $unset: { [this._model.DELETED_AT]: "" } };

    const soft = {
      type: "restore" as const,
      field: this._model.UPDATED_AT,
    };

    if (callback)
      return this._update(
        _update,
        (err, res) => {
          if (err) return callback(err, res as any);

          callback(err, res.modifiedCount);
        },
        soft,
      );

    return (await this._update(_update, undefined, soft)).modifiedCount;
  }
}

export default Query;
