import Model from "../../index";
import * as utils from "../../utils";
import Relation from "../Relation/Base";

abstract class HasMany extends Relation {
    constructor(
        model: Model,
        relation: Model,
        localKey: string = "id",
        foreignKey: string = utils.makeTableId(model.toString()),
    ) {
        super(model, relation, localKey, foreignKey);
    }
}

export default HasMany;
