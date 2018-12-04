import * as Odin from "..";
import * as DB from "../DB";
import Join from "../DB/Join";
import Relation from "./Base";
import MorphBase from "./MorphBase";

class MorphOne<T extends Odin = Odin> extends MorphBase<T, "MorphOne"> {
  public load(query: DB<T> | Join<T>, relations: Relation.Relation[]) {
    const constructor = this.model.constructor;
    const relation = this.relation;
    const name = this.as;

    return query.join(
      relation.toString(),
      q => relations.reduce(
        (prev, cur) => {
          const subRelation = cur.name;

          if (!(relation as any)._relations.includes(subRelation))
            throw new Error(`Relation '${subRelation}' does not exist on '${relation.name}' Model`);

          const loader = relation.prototype[subRelation]();

          return loader.load(prev, cur.relations);
        },
        q.where(this.foreignKey, `${constructor.toString()}.${this.localKey}`)
          .where(`${this.type}_type`, constructor.name)
          .limit(1)
      ),
      // q => q.where(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`)
      //   .where(`${this.type}_type`, this.model.constructor.name)
      //   .limit(1),
      name
    ).pipeline({
      $unwind: { path: `$${name}`, preserveNullAndEmptyArrays: true },
    });
  }

  public loadCount(query: DB<T> | Join<T>) {
    const constructor = this.model.constructor;

    return query
      .join(
        this.relation.toString(),
        q => q
          .where(this.foreignKey, `${constructor.toString()}.data.${this.localKey}`)
          .where(`${this.type}_type`, constructor.name)
          .limit(1),
        "relation"
      )
      .pipeline({
        $project: {
          data: 1,
          count: { $size: "$relation" },
        },
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
