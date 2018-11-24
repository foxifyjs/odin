import * as Odin from "..";
import Query from "../base/Query";
import * as DB from "../DB";
import Relation from "./MorphBase";

class MorphOne<T extends Odin = Odin> extends Relation<T, "MorphOne"> {
  public load(query: Query<T>) {
    const as = this.as;

    return query.join(
      this.relation,
      q => q
        .where(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`)
        .where(`${this.type}_type`, this.model.constructor.name)
        .limit(1),
      as
    ).pipeline({
      $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true },
    });
  }

  public insert(items: T[]): Promise<undefined>;
  public insert(items: T[], callback: DB.Callback<undefined>): void;
  public async insert(items: T[], callback?: DB.Callback<undefined>) {
    const error = new TypeError(`'${this.constructor.name}' relation can't insert multiple items`);

    if (callback)
      return callback(error, undefined);

    throw error;
  }

  public create(item: T): Promise<T>;
  public create(item: T, callback: DB.Callback<T>): void;
  public async create(item: T, callback?: DB.Callback<T>) {
    const error = new TypeError(`This item already has one ${this.as}`);

    if (callback)
      return this.exists((err, res) => {
        if (err) return callback(err, undefined as any);

        if (res) return callback(error, undefined as any);

        super.create(item, callback);
      });

    if (await this.exists())
      throw error;

    return await super.create(item);
  }

  public save(model: T): Promise<T>;
  public save(model: T, callback: DB.Callback<T>): void;
  public async save(item: T, callback?: DB.Callback<T>) {
    const error = new TypeError(`This item already has one ${this.as}`);
    const id = item.getAttribute("id");

    if (callback)
      return this.first((err, res) => {
        if (err) return callback(err, undefined as any);

        if (res.id !== id) return callback(error, undefined as any);

        super.save(item, callback);
      });

    const first = await this.first();

    if (first && first.id !== id) throw error;

    return await super.save(item);
  }
}

export default MorphOne;
