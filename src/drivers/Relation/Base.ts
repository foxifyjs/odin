import Model from "../../index";
import * as utils from "../../utils";

interface Relation { }

abstract class Relation {
    protected _owner: Model;
    protected _model: Model;
    protected _localKey: string;
    protected _foreignKey: string;

    constructor(
        owner: Model,
        model: Model,
        localKey: string = utils.makeTableId(model.toString()),
        foreignKey: string = "id",
    ) {
        this._owner = owner;
        this._model = model;
        this._localKey = localKey;
        this._foreignKey = foreignKey;
    }

    abstract load(query: any, as: string): any;
}

export default Relation;
