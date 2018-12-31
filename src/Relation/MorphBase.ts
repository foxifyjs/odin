import * as Odin from "..";
import Query from "../base/Query";
import Filter from "../DB/Filter";
import { makeMorphType } from "../utils";
import Relation from "./Base";

abstract class MorphBase<T extends Odin = Odin, A = undefined> extends Relation<T, A> {
  constructor(
    model: Odin,
    relation: typeof Odin,
    localKey: string = "id",
    foreignKey: string = `${makeMorphType(relation.toString())}_id`,
    public readonly type: string = makeMorphType(relation.toString()),
    filter: undefined | ((q: Filter) => Filter),
    caller: (...args: any[]) => any
  ) {
    super(model, relation, localKey, foreignKey, filter, caller);
  }

  protected _query(relations?: string[]): Query<T> {
    return super._query(relations)
      .where(`${this.type}_type`, this.model.constructor.toString());
  }
}

export default MorphBase;
