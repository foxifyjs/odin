import * as drivers from "../drivers";
import Relation from "../drivers/Relation/Base";
import ModelConstructor, { Model } from "../index";

interface Relational {
  hasMany(relation: ModelConstructor, localKey?: string, foreignKey?: string): Relation;

  hasOne(relation: ModelConstructor, localKey?: string, foreignKey?: string): Relation;

  morphMany(relation: ModelConstructor, localKey?: string, type?: string): Relation;

  morphOne(relation: ModelConstructor, localKey?: string, type?: string): Relation;
}

class Relational {
  public hasMany(relation: ModelConstructor, localKey?: string, foreignKey?: string): Relation {
    const model = (this as any) as Model;

    const HasMany: any = drivers[model.constructor.driver].Relation.HasMany;

    return new HasMany(model, relation, localKey, foreignKey, this.hasMany);
  }

  public hasOne(relation: ModelConstructor, localKey?: string, foreignKey?: string): Relation {
    const model = (this as any) as Model;

    const HasOne: any = drivers[model.constructor.driver].Relation.HasOne;

    return new HasOne(model, relation, localKey, foreignKey, this.hasOne);
  }

  public morphMany(relation: ModelConstructor, localKey?: string, type?: string): Relation {
    const model = (this as any) as Model;

    const MorphMany: any = drivers[model.constructor.driver].Relation.MorphMany;

    return new MorphMany(model, relation, localKey, undefined, type, this.morphMany);
  }

  public morphOne(relation: ModelConstructor, localKey?: string, type?: string): Relation {
    const model = (this as any) as Model;

    const MorphOne: any = drivers[model.constructor.driver].Relation.MorphOne;

    return new MorphOne(model, relation, localKey, undefined, type, this.morphOne);
  }
}

export default Relational;
