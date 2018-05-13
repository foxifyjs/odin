import Model from "../../index";
import * as utils from "../../utils";
import Relation from "../Relation/Base";

abstract class HasOne extends Relation {
    constructor(
        model: Model,
        relation: Model,
        localKey: string = utils.makeTableId(relation.toString()),
        foreignKey: string = "id",
    ) {
        super(model, relation, localKey, foreignKey);
    }
}

export default HasOne;
