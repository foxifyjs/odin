import * as Odin from "..";
import * as DB from "../DB";
import Filter from "../DB/Filter";
import Join from "../DB/Join";
import Relation from "./Base";
import MorphBase from "./MorphBase";

class MorphMany<T extends Odin = Odin> extends MorphBase<T> {
  public load(query: DB<T> | Join<T>, relations: Relation.Relation[], filter?: (q: Filter) => Filter) {
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
            .where(`${this.type}_type`, constructor.name)
        )
      ),
      name
    );
  }

  public loadCount(query: DB<T> | Join<T>, filter?: (q: Filter) => Filter) {
    const constructor = this.model.constructor;

    const filters = [this.filter];

    if (filter) filters.push(filter);

    return query
      .join(
        this.relation.toString(),
        q => filters.reduce(
          (prev, filter) => filter(prev) as any,
          q.where(this.foreignKey, `${constructor.toString()}.data.${this.localKey}`)
            .where(`${this.type}_type`, constructor.name)
        ),
        "relation"
      )
      .aggregate({
        $project: {
          data: 1,
          count: { $size: "$relation" },
        },
      });
  }
}

export default MorphMany;
