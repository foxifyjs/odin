import * as Odin from "..";
import DB, { Id } from "../DB";
import Filter from "../DB/Filter";
import Join from "../DB/Join";
import Relation from "./Base";
import MorphBase from "./MorphBase";

class MorphOne<T extends Odin = Odin> extends MorphBase<T, "MorphOne"> {
  public load(
    query: DB<T> | Join<T>,
    relations: Relation.Relation[],
    withTrashed?: boolean,
    filter?: (q: Filter) => Filter,
  ) {
    const constructor = this.model.constructor;
    const relation = this.relation;
    const name = this.as;
    const filters: Array<(q: Filter) => Filter> = [];

    if (relation.softDelete && !withTrashed)
      filters.push((q) => q.whereNull(relation.DELETED_AT));

    filters.push(this.filter);

    if (filter) filters.push(filter);

    return query
      .join(
        relation.toString(),
        (q) =>
          relations.reduce(
            (prev, cur) => {
              const subRelation = cur.name;

              if (!(relation as any)._relations.includes(subRelation))
                throw new Error(
                  `Relation '${subRelation}' does not exist on '${relation.name}' Model`,
                );

              const loader: Relation = relation.prototype[subRelation]();

              return loader.load(prev, cur.relations, withTrashed) as any;
            },
            filters.reduce(
              (prev, filter) => filter(prev) as any,
              q
                .where(
                  this.foreignKey,
                  `${constructor.toString()}.${this.localKey}`,
                )
                .where(`${this.type}_type`, constructor.toString())
                .limit(1),
            ),
          ),
        name,
      )
      .aggregate({
        $unwind: { path: `$${name}`, preserveNullAndEmptyArrays: true },
      });
  }

  public loadCount(
    query: DB<T> | Join<T>,
    relations: string[],
    withTrashed?: boolean,
    filter?: (q: Filter) => Filter,
  ) {
    const constructor = this.model.constructor;
    const relation = this.relation;
    const subRelation = relations.shift();
    const filters: Array<(q: Filter) => Filter> = [];

    if (relation.softDelete && !withTrashed)
      filters.push((q) => q.whereNull(relation.DELETED_AT));

    filters.push(this.filter);

    if (subRelation) {
      if (!(relation as any)._relations.includes(subRelation))
        throw new Error(
          `Relation '${subRelation}' does not exist on '${relation.name}' Model`,
        );

      return query.join(
        relation.toString(),
        (q) =>
          relation.prototype[subRelation]().loadCount(
            filters.reduce(
              (prev, filter) => filter(prev) as any,
              q
                .where(
                  this.foreignKey,
                  `${constructor.toString()}.relation.${this.localKey}`,
                )
                .where(`${this.type}_type`, constructor.toString())
                .limit(1)
                .aggregate({
                  $project: {
                    relation: "$$ROOT",
                  },
                }),
            ) as any,
            relations,
            withTrashed,
            filter,
          ),
        "relation",
      );
    }

    if (filter) filters.push(filter);

    return query.join(
      relation.toString(),
      (q) =>
        filters.reduce(
          (prev, filter) => filter(prev) as any,
          q
            .where(
              this.foreignKey,
              `${constructor.toString()}.relation.${this.localKey}`,
            )
            .where(`${this.type}_type`, constructor.toString())
            .limit(1),
        ),
      "relation",
    );
  }

  public insert(items: T[]): Promise<undefined>;
  public async insert(items: T[]) {
    const error = new TypeError(
      `'${this.constructor.name}' relation can't insert multiple items`,
    );

    throw error;
  }

  public create(item: T): Promise<T>;
  public async create(item: T) {
    const error = new TypeError(`This item already has one ${this.as}`);

    if (await this.exists()) throw error;

    return await super.create(item);
  }

  public save(model: T): Promise<T>;
  public async save(item: T) {
    const error = new TypeError(`This item already has one ${this.as}`);
    const id = item.getAttribute("id");

    const first = await this.first();

    if (first && !(first.id as Id).equals(id)) throw error;

    return await super.save(item);
  }
}

export default MorphOne;
