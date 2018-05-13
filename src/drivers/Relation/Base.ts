import * as DB from "../../DB";
import { getConnection } from "../../connections";
import Model from "../../index";
import * as utils from "../../utils";
import Driver from "../Driver";

interface Relation { }

abstract class Relation {
    private _model: Model;
    private _relation: Model;
    private _localKey: string;
    private _foreignKey: string;

    constructor(
        model: Model,
        relation: Model,
        localKey: string,
        foreignKey: string,
    ) {
        this._model = model;
        this._relation = relation;
        this._localKey = localKey;
        this._foreignKey = foreignKey;
    }

    protected get _query(): Driver {
        return getConnection(this.relation.connection);
    }

    get model() {
        return this._model;
    }

    get relation() {
        return this._relation;
    }

    get localKey() {
        return this._localKey;
    }

    get foreignKey() {
        return this._foreignKey;
    }

    abstract load(query: DB, as: string): any;
}

export default Relation;
