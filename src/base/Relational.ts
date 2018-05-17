import * as drivers from "../drivers";
import Relation from "../drivers/Relation/Base";
import ModelConstructor, { Model } from "../index";
import * as utils from "../utils";

interface Relational {
    hasMany(relation: ModelConstructor, localKey?: string, foreignKey?: string): Relation;

    hasOne(relation: ModelConstructor, localKey?: string, foreignKey?: string): Relation;
}

class Relational {
    hasMany(relation: ModelConstructor, localKey?: string, foreignKey?: string): Relation {
        const model = (this as any) as Model;

        const HasMany: any = drivers[model.constructor.driver].Relation.HasMany;

        return new HasMany(model, relation, localKey, foreignKey, this.hasMany);
    }

    hasOne(relation: ModelConstructor, localKey?: string, foreignKey?: string): Relation {
        const model = (this as any) as Model;

        const HasOne: any = drivers[model.constructor.driver].Relation.HasOne;

        return new HasOne(model, relation, localKey, foreignKey, this.hasOne);
    }
}

export default Relational;