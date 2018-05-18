import ModelConstructor, { Model } from "../../index";
import * as utils from "../../utils";
import Driver from "../Driver";
import Relation from "../Relation/Base";

// @ts-ignore:next-line
interface HasOne<T = any> extends Relation<T> { }

abstract class HasOne<T = any> extends Relation<T> {
    constructor(
        model: Model,
        relation: ModelConstructor,
        localKey: string = utils.makeTableId(relation.toString()),
        foreignKey: string = "id",
        caller: (...args: any[]) => any,
    ) {
        super(model, relation, localKey, foreignKey, caller);
    }

    // @ts-ignore:next-line
    insert(items: T[], callback?: Driver.Callback<number>) {
        const error = new TypeError("'hasOne' relation can't insert multiple items");

        if (callback)
            return callback(error, undefined as any);

        throw error;
    }

    async create(item: T, callback?: Driver.Callback<Model<T>>) {
        const error = new TypeError(`This item already has one ${this.as}`);

        if (callback)
            return this.exists((err, res) => {
                if (err) return callback(err, undefined as any);

                if (res) return callback(error, undefined as any);

                super.create(item, callback);
            });

        if (await this.exists())
            throw error;

        return await super.create(item);
    }

    async save(item: Model<T>, callback?: Driver.Callback<Model<T>>) {
        const error = new TypeError(`This item already has one ${this.as}`);
        const id = item.getAttribute("id");

        if (callback)
            return this.first((err, res) => {
                if (err) return callback(err, undefined as any);

                if (res.id !== id) return callback(error, undefined as any);

                super.save(item, callback);
            });

        const first = await this.first();

        if (first && first.id !== id) throw error;

        return await super.save(item);
    }
}

export default HasOne;
