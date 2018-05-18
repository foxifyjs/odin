import ModelConstructor, { Model } from "../../index";
import * as utils from "../../utils";
import Driver from "../Driver";
import Relation from "../Relation/MorphBase";

// @ts-ignore:next-line
interface MorphOne<T = any> extends Relation<T> { }

abstract class MorphOne<T = any> extends Relation<T> {
    // @ts-ignore:next-line
    insert(items: T[], callback?: Driver.Callback<number>) {
        const error = new TypeError(`'${this.constructor.name}' relation can't insert multiple items`);

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

export default MorphOne;
