import * as Model from "../../index";
import * as utils from "../../utils";
import Relation from "../Relation/Base";

abstract class HasMany extends Relation {
  constructor(
    model: Model,
    relation: typeof Model,
    localKey: string = "id",
    foreignKey: string = utils.makeTableId(model.constructor.toString()),
    caller: (...args: any[]) => any
  ) {
    super(model, relation, localKey, foreignKey, caller);
  }
}

export default HasMany;
