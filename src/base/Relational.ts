import Base from "../Base";
import * as drivers from "../drivers";
import Relation from "../drivers/Relation/Base";
import * as Model from "../index";

class Relational<T = any> extends Base<T> {
  public hasMany(relation: typeof Model, localKey?: string, foreignKey?: string): Relation<T>;
  public hasMany(relation: typeof Model, localKey?: string, foreignKey?: string): Relation {
    const model = (this as any) as Model;

    const HasMany: any = drivers[model.constructor.driver].Relation.HasMany;

    return new HasMany(model, relation, localKey, foreignKey, this.hasMany);
  }

  public hasOne(relation: typeof Model, localKey?: string, foreignKey?: string): Relation<T>;
  public hasOne(relation: typeof Model, localKey?: string, foreignKey?: string): Relation {
    const model = (this as any) as Model;

    const HasOne: any = drivers[model.constructor.driver].Relation.HasOne;

    return new HasOne(model, relation, localKey, foreignKey, this.hasOne);
  }

  public morphMany(relation: typeof Model, localKey?: string, type?: string): Relation<T>;
  public morphMany(relation: typeof Model, localKey?: string, type?: string): Relation {
    const model = (this as any) as Model;

    const MorphMany: any = drivers[model.constructor.driver].Relation.MorphMany;

    return new MorphMany(model, relation, localKey, undefined, type, this.morphMany);
  }

  public morphOne(relation: typeof Model, localKey?: string, type?: string): Relation<T>;
  public morphOne(relation: typeof Model, localKey?: string, type?: string): Relation {
    const model = (this as any) as Model;

    const MorphOne: any = drivers[model.constructor.driver].Relation.MorphOne;

    return new MorphOne(model, relation, localKey, undefined, type, this.morphOne);
  }
}

export default Relational;
