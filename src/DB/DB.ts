import * as mongo from "mongodb";
import Join from "./Join";
import {
  MONGO_NULL,
  Obj,
  MongoDB,
  MongoID,
  MongoPipelineStageMatch,
  MongoPipelineStageProject,
} from "../constants";
import { connection as getConnection } from "../Connect";

export default class DB<T extends Obj> extends Join<T> implements MongoDB<T> {
  public static table<T extends Obj>(table: string): DB<T> {
    return new this<T>(table);
  }

  protected _mongo: mongo.Collection;

  public constructor(table: string) {
    super(table);

    this._mongo = getConnection().collection(table);
  }

  /* ------------------------- INSERT ------------------------- */

  public insert(item: T): Promise<number>;
  public insert(items: T[]): Promise<number>;
  public async insert(items: T | T[]): Promise<number> {
    if (Array.isArray(items)) {
      if (items.length === 0) return 0;
      else if (items.length > 1) {
        const inserted = await this._mongo.insertMany(items);

        return inserted.insertedCount;
      } else items = items[0];
    }

    const inserted = await this._mongo.insertOne(items);

    return inserted.insertedCount;
  }

  /* ------------------------- INSERT GET ID ------------------------- */

  public async insertGetId(item: T): Promise<MongoID> {
    const inserted = await this._mongo.insertOne(item);

    return inserted.insertedId;
  }

  /* ------------------------- GET ------------------------- */

  public get(): Promise<T[]>;
  public get(...select: Array<keyof T | string>): Promise<Partial<T>[]>;
  public async get(...select: string[]): Promise<Partial<T>[]> {
    if (select.length > 0) {
      this.pipe({
        $project: select.reduce(
          (project, field) => {
            project[field] = true;

            return project;
          },
          { _id: false } as MongoPipelineStageProject["$project"],
        ),
      });
    }

    return await this._mongo.aggregate(this.pipeline).toArray();
  }

  /* ------------------------- COUNT ------------------------- */

  public async count(): Promise<number> {
    const result = await this.pipe({ $count: "count" }).first();

    return (result?.count as number) ?? 0;
  }

  /* ------------------------- EXISTS ------------------------- */

  public async exists(): Promise<boolean> {
    const count = await this.count();

    return count > 0;
  }

  /* ------------------------- PLUCK ------------------------- */

  public pluck<K extends keyof T>(field: K): Promise<T[K][]>;
  public pluck(field: string): Promise<unknown[]>;
  public async pluck(field: string): Promise<unknown[]> {
    const keys = field.split(".");

    const result = await this.pipe({
      $project: {
        _id: false,
        [keys[0]]: { $ifNull: [`$${keys[0]}`, MONGO_NULL] },
      },
    }).get();

    return result.map((item) =>
      keys.reduce(
        (prev: Obj, key) => (prev == null ? prev : (prev[key] as Obj) ?? null),
        item,
      ),
    );
  }

  public value<K extends keyof T>(field: K): Promise<T[K][]>;
  public value(field: string): Promise<unknown[]>;
  public value(field: string): Promise<unknown[]> {
    return this.pluck(field);
  }

  /* ------------------------- FIRST ------------------------- */

  public first(): Promise<T>;
  public first(...select: Array<keyof T | string>): Promise<Partial<T>>;
  public async first(...select: string[]): Promise<Partial<T>> {
    const result = await this.limit(1).get(...select);

    return result[0] ?? null;
  }

  /* ------------------------- MAXIMUM ------------------------- */

  public max<K extends keyof T>(field: K): Promise<T[K]>;
  public max(field: string): Promise<unknown>;
  public async max(field: string): Promise<unknown> {
    const result = await this.pipe({
      $group: {
        _id: null,
        max: { $max: `$${field}` },
      },
    }).first();

    return result?.max ?? null;
  }

  /* ------------------------- MINIMUM ------------------------- */

  public min<K extends keyof T>(field: K): Promise<T[K]>;
  public min(field: string): Promise<unknown>;
  public async min(field: string): Promise<unknown> {
    const result = await this.pipe({
      $group: {
        _id: null,
        min: { $min: `$${field}` },
      },
    }).first();

    return result?.min ?? null;
  }

  /* ------------------------- AVERAGE ------------------------- */

  public avg<K extends keyof T>(field: K): Promise<T[K]>;
  public avg(field: string): Promise<unknown>;
  public async avg(field: string): Promise<unknown> {
    const result = await this.pipe({
      $group: {
        _id: null,
        avg: { $avg: `$${field}` },
      },
    }).first();

    return result?.avg ?? null;
  }

  /* ------------------------- ASYNC ITERATOR ------------------------- */

  public async *[Symbol.asyncIterator](): AsyncIterator<T> {
    const cursor = await this._mongo.aggregate(this.pipeline);

    let next: T;

    do {
      next = await cursor.next();

      yield next;
    } while (next != null);
  }

  /* ------------------------- UPDATE ------------------------- */

  public async update(update: Partial<T>): Promise<number> {
    const updated = await this._mongo.updateMany(this._pipelineFilters, {
      $set: update,
    });

    return updated.modifiedCount;
  }

  /* ------------------------- INCREMENT ------------------------- */

  public async increment(field: keyof T | string, count = 1): Promise<number> {
    const updated = await this._mongo.updateMany(this._pipelineFilters, {
      $inc: {
        [field]: count,
      },
    });

    return updated.modifiedCount;
  }

  /* ------------------------- DECREMENT ------------------------- */

  public decrement(field: keyof T | string, count = 1): Promise<number> {
    return this.increment(field, -count);
  }

  /* ------------------------- UNSET ------------------------- */

  public unset(fields: string[]): Promise<number>;
  public unset<K extends keyof T>(fields: K[]): Promise<number>;
  public async unset($unset: string[]): Promise<number> {
    const updated = await this._mongo.updateMany(this._pipelineFilters, {
      $unset,
    });

    return updated.modifiedCount;
  }

  /* ------------------------- DELETE ------------------------- */

  public async delete(): Promise<number> {
    const deleted = await this._mongo.deleteMany(this._pipelineFilters);

    return deleted.deletedCount ?? 0;
  }

  /* ------------------------- INDEXES ------------------------- */

  public indexes(): Promise<unknown> {
    return this._mongo.indexes();
  }

  /* ------------------------- INDEX ------------------------- */

  public index(field: string, options?: mongo.IndexOptions): Promise<unknown>;
  public index(spec: Obj, options?: mongo.IndexOptions): Promise<unknown>;
  public index(
    spec: string | Obj,
    options?: mongo.IndexOptions,
  ): Promise<unknown> {
    return this._mongo.createIndex(spec, options);
  }

  /* ------------------------- REINDEX ------------------------- */

  public reIndex(): Promise<unknown> {
    return this._mongo.reIndex();
  }

  /* ------------------------- DROP INDEX ------------------------- */

  public dropIndex(
    index: string,
    options?: mongo.CommonOptions & { maxTimeMS?: number },
  ): Promise<unknown> {
    return this._mongo.dropIndex(index, options);
  }

  /* ------------------------- HELPERS ------------------------- */

  protected get _pipelineFilters(): MongoPipelineStageMatch<T>["$match"] {
    const filters = this.pipeline.filter(
      (pipe) => (pipe as MongoPipelineStageMatch<T>).$match != null,
    );

    if (filters.length === 0) return {};

    return {
      $and: filters.map((pipe) => (pipe as MongoPipelineStageMatch<T>).$match),
    };
  }
}
