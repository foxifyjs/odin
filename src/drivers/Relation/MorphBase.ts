import Query from "../../base/Query";
import ModelConstructor, { Model } from "../../index";
import * as utils from "../../utils";
import Relation from "../Relation/Base";

abstract class MorphBase<T = any> extends Relation<T> {
  private readonly _type: string;

  get type() {
    return this._type;
  }

  constructor(
    model: Model,
    relation: ModelConstructor,
    localKey: string = "id",
    foreignKey: string = `${utils.makeMorphType(relation.toString())}_id`,
    type: string = utils.makeMorphType(relation.toString()),
    caller: (...args: any[]) => any,
  ) {
    super(model, relation, localKey, foreignKey, caller);

    this._type = type;
  }

  protected _query(relations?: string[]): Query {
    return super._query(relations)
      .where(`${this.type}_type`, this.model.constructor.filename);
  }
}

export default MorphBase;
