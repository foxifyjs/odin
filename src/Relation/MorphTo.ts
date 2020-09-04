import * as Odin from "..";
import * as DB from "../DB";
import Filter from "../DB/Filter";
import Join from "../DB/Join";
import { makeMorphType } from "../utils";
import Relation from "./Base";
import MorphOne from "./MorphOne";

// TODO: morphTo
class MorphTo<T extends Odin = Odin> extends MorphOne<T> {
  constructor(
    model: Odin,
    relation: typeof Odin,
    localKey: string = `${makeMorphType(model.constructor.toString())}_id`,
    foreignKey: string = "id",
    type: string = makeMorphType(model.constructor.toString()),
    filter: undefined | ((q: Filter) => Filter),
    caller: (...args: any[]) => any
  ) {
    super(model, relation, localKey, foreignKey, type, filter, caller);
  }

  public load(
    query: DB<T> | Join<T>, relations: Relation.Relation[],
    withTrashed?: boolean,
    filter?: (q: Filter) => Filter
  ) {
    const constructor = this.model.constructor;
    const relation = this.relation;
    const name = this.as;
    const filters = [this.filter];

    if (filter) filters.push(filter);

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

  public loadCount(query: DB<T> | Join<T>, relations: string[], withTrashed?: boolean, filter?: (q: Filter) => Filter) {
    const constructor = this.model.constructor;
    const relation = this.relation;
    const subRelation = relations.shift();

    if (subRelation) {
      if (!(relation as any)._relations.includes(subRelation))
        throw new Error(`Relation '${subRelation}' does not exist on '${relation.name}' Model`);

      return query
        .join(
          relation.toString(),
          q => relation.prototype[subRelation]().loadCount(
            this.filter(
              q
                .where(this.foreignKey, `${constructor.toString()}.relation.${this.localKey}`)
                .where(`${this.type}_type`, constructor.name)
                .limit(1)
                .aggregate({
                  $project: {
                    relation: "$$ROOT",
                  },
                })
            ) as any,
            relations,
            filter
          ),
          "relation"
        );
    }

    const filters = [this.filter];

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
}

export default MorphTo;
