import Model from "../index";
import { getConnection } from "../connections";
import Relation from "../drivers/Relation/Base";
import * as drivers from "../drivers";

interface Relational {
    hasMany(relation: Model, localKey?: string, foreignKey?: string): Relation;
}

class Relational {
    hasMany(relation: Model, localKey?: string, foreignKey?: string): Relation {
        const driver = getConnection((this.constructor as Model).connection)().driver;

        const HasMany: any = drivers[driver].Relation.HasMany;

        return new HasMany(this.constructor, relation, localKey, foreignKey);
    }
}

export default Relational;
