import * as Odin from "..";
import * as DB from "../DB";
import Join from "../DB/Join";
import Relation from "./Base";
import MorphBase from "./MorphBase";

class MorphMany<T extends Odin = Odin> extends MorphBase<T> {
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
      ),
      // q => q.where(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`)
      //   .where(`${this.type}_type`, this.model.constructor.name),
      name
    );
  }

  public loadCount(query: DB<T> | Join<T>) {
    const constructor = this.model.constructor;

    return query
      .join(
        this.relation.toString(),
        q => q
          .where(this.foreignKey, `${constructor.toString()}.data.${this.localKey}`)
          .where(`${this.type}_type`, constructor.name),
        "relation"
      )
      .pipeline({
        $project: {
          data: 1,
          count: { $size: "$relation" },
        },
      });
  }
}

export default MorphMany;
