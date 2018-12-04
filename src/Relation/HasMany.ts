import * as Odin from "..";
import * as DB from "../DB";
import Join from "../DB/Join";
import { makeCollectionId } from "../utils";
import Relation from "./Base";

class HasMany<T extends Odin = Odin> extends Relation<T> {
  constructor(
    model: Odin,
    relation: typeof Odin,
    localKey: string = "id",
    foreignKey: string = makeCollectionId(model.constructor.toString()),
    caller: (...args: any[]) => any
  ) {
    super(model, relation, localKey, foreignKey, caller);
  }

  public load(query: DB<T> | Join<T>, relations: Relation.Relation[]) {
    const relation = this.relation;

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
        q.where(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`)
      ),
      this.as
    );
  }

  public loadCount(query: DB<T> | Join<T>) {
    return query
      .join(
        this.relation.toString(),
        q => q
          .where(this.foreignKey, `${this.model.constructor.toString()}.data.${this.localKey}`),
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

export default HasMany;
