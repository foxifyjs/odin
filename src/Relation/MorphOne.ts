import * as Odin from "..";
import * as DB from "../DB";
import Filter from "../DB/Filter";
import Join from "../DB/Join";
import Relation from "./Base";
import MorphBase from "./MorphBase";

class MorphOne<T extends Odin = Odin> extends MorphBase<T, "MorphOne"> {
  public load(
    query: DB<T> | Join<T>, relations: Relation.Relation[], withTrashed?: boolean, filter?: (q: Filter) => Filter
  ) {
    const constructor = this.model.constructor;
    const relation = this.relation;
    const name = this.as;
    const filters: Array<(q: Filter) => Filter> = [];

    if (relation.softDelete && !withTrashed) filters.push(q => q.whereNull(relation.DELETED_AT));

    filters.push(this.filter);

    if (filter) filters.push(filter);

    return query.join(
      relation.toString(),
      q => relations.reduce(
        (prev, cur) => {
          const subRelation = cur.name;

          if (!(relation as any)._relations.includes(subRelation))
            throw new Error(`Relation '${subRelation}' does not exist on '${relation.name}' Model`);

          const loader: Relation = relation.prototype[subRelation]();

          return loader.load(prev, cur.relations, withTrashed) as any;
        },
        filters.reduce(
          (prev, filter) => filter(prev) as any,
          q.where(this.foreignKey, `${constructor.toString()}.${this.localKey}`)
            .where(`${this.type}_type`, constructor.toString())
            .limit(1)
        )
      ),
      name
    ).aggregate({
      $unwind: { path: `$${name}`, preserveNullAndEmptyArrays: true },
    });
  }

  public loadCount(
    query: DB<T> | Join<T>, relations: string[], withTrashed?: boolean, filter?: (q: Filter) => Filter
  ) {
    const constructor = this.model.constructor;
    const relation = this.relation;
    const subRelation = relations.shift();
    const filters: Array<(q: Filter) => Filter> = [];

    if (relation.softDelete && !withTrashed) filters.push(q => q.whereNull(relation.DELETED_AT));

    filters.push(this.filter);

    if (subRelation) {
      if (!(relation as any)._relations.includes(subRelation))
        throw new Error(`Relation '${subRelation}' does not exist on '${relation.name}' Model`);

      return query
        .join(
          relation.toString(),
          q => relation.prototype[subRelation]()
            .loadCount(
              filters.reduce(
                (prev, filter) => filter(prev) as any,
                q
                  .where(this.foreignKey, `${constructor.toString()}.relation.${this.localKey}`)
                  .where(`${this.type}_type`, constructor.toString())
                  .limit(1)
                  .aggregate({
                    $project: {
                      relation: "$$ROOT",
                    },
                  })
              ) as any,
              relations,
              withTrashed,
              filter
            ),
          "relation"
        );
    }

    if (filter) filters.push(filter);

    return query
      .join(
        relation.toString(),
        q => filters.reduce(
          (prev, filter) => filter(prev) as any,
          q.where(this.foreignKey, `${constructor.toString()}.relation.${this.localKey}`)
            .where(`${this.type}_type`, constructor.toString())
            .limit(1)
        ),
        "relation"
      );
  }

  public insert(items: T[]): Promise<undefined>;
  public insert(items: T[], callback: DB.Callback<undefined>): void;
  public async insert(items: T[], callback?: DB.Callback<undefined>) {
    const error = new TypeError(`'${this.constructor.name}' relation can't insert multiple items`);

    if (callback)
      return callback(error as any, undefined);

    throw error;
  }

  public create(item: T): Promise<T>;
  public create(item: T, callback: DB.Callback<T>): void;
  public async create(item: T, callback?: DB.Callback<T>) {
    const error = new TypeError(`This item already has one ${this.as}`);

    if (callback)
      return this.exists((err, res) => {
        if (err) return callback(err, undefined as any);

        if (res) return callback(error as any, undefined as any);

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

        if (res && !(res.id as DB.Id).equals(id)) return callback(error as any, undefined as any);

        super.save(item, callback);
      });

    const first = await this.first();

    if (first && !(first.id as DB.Id).equals(id)) throw error;

    return await super.save(item);
  }
}

export default MorphOne;
