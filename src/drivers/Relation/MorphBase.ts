import Query from "../../base/Query";
import ModelConstructor, { Model } from "../../index";
import * as utils from "../../utils";
import Relation from "../Relation/Base";

abstract class MorphBase<T = any, A = undefined> extends Relation<T, A> {
  constructor(
    model: Model,
    relation: ModelConstructor,
    localKey: string = "id",
    foreignKey: string = `${utils.makeMorphType(relation.toString())}_id`,
    public readonly type: string = utils.makeMorphType(relation.toString()),
    caller: (...args: any[]) => any
  ) {
    super(model, relation, localKey, foreignKey, caller);
  }

  protected _query(relations?: string[]): Query {
    return super._query(relations)
      .where(`${this.type}_type`, this.model.constructor.filename);
  }
}

export default MorphBase;
