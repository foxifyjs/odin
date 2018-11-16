import * as Model from "../../index";
import * as utils from "../../utils";
import HasMany from "../Relation/HasMany";

abstract class EmbedMany extends HasMany {
  constructor(
    model: Model,
    relation: typeof Model,
    localKey: string = `${utils.makeTableId(relation.toString())}s`,
    foreignKey: string = "id",
    caller: (...args: any[]) => any
  ) {
    super(model, relation, localKey, foreignKey, caller);
  }
}

export default EmbedMany;
