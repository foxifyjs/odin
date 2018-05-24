import ModelConstructor, { Model } from "../../index";
import * as utils from "../../utils";
import Relation from "../Relation/Base";

abstract class HasMany extends Relation {
  constructor(
    model: Model,
    relation: ModelConstructor,
    localKey: string = utils.makeTableId(model.constructor.toString()),
    foreignKey: string = "id",
    caller: (...args: any[]) => any,
  ) {
    super(model, relation, localKey, foreignKey, caller);
  }
}

export default HasMany;
