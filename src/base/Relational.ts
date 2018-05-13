import * as drivers from "../drivers";
import Relation from "../drivers/Relation/Base";
import Model from "../index";

interface Relational {
    hasMany(relation: Model, localKey?: string, foreignKey?: string): Relation;

    hasOne(relation: Model, localKey?: string, foreignKey?: string): Relation;
}

class Relational {
    hasMany(relation: Model, localKey?: string, foreignKey?: string): Relation {
        const model = this.constructor as Model;

        const HasMany: any = drivers[model.driver].Relation.HasMany;

        return new HasMany(model, relation, localKey, foreignKey);
    }

    hasOne(relation: Model, localKey?: string, foreignKey?: string): Relation {
        const model = this.constructor as Model;

        const HasOne: any = drivers[model.driver].Relation.HasOne;

        return new HasOne(model, relation, localKey, foreignKey);
    }
}

export default Relational;
