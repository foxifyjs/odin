import * as Odin from "..";
import Query from "../base/Query";
import { makeMorphType } from "../utils";
import Relation from "./Base";

abstract class MorphBase<T extends Odin = Odin, A = undefined> extends Relation<T, A> {
  constructor(
    model: Odin,
    relation: typeof Odin,
    localKey: string = "id",
    foreignKey: string = `${makeMorphType(relation.toString())}_id`,
    public readonly type: string = makeMorphType(relation.toString()),
    caller: (...args: any[]) => any
  ) {
    super(model, relation, localKey, foreignKey, caller);
  }

  protected _query(relations?: string[]): Query<T> {
    return super._query(relations)
      .where(`${this.type}_type`, this.model.constructor.name);
  }
}

export default MorphBase;
