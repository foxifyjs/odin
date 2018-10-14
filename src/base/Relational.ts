import Base from "../Base";
import * as drivers from "../drivers";
import Relation from "../drivers/Relation/Base";
import * as Model from "../index";
import * as utils from "../utils";

class Relational extends Base {
  public hasMany<T>(
    relation: string | typeof Model,
    localKey?: string,
    foreignKey?: string
  ): Relation<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Model;

    const HasMany: any = drivers[this.constructor.driver].Relation.HasMany;

    return new HasMany(this, relation, localKey, foreignKey, this.hasMany);
  }

  public hasOne<T>(
    relation: string | typeof Model,
    localKey?: string,
    foreignKey?: string
  ): Relation<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Model;

    const HasOne: any = drivers[this.constructor.driver].Relation.HasOne;

    return new HasOne(this, relation, localKey, foreignKey, this.hasOne);
  }

  public morphMany<T>(
    relation: string | typeof Model,
    localKey?: string,
    type?: string
  ): Relation<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Model;

    const MorphMany: any = drivers[this.constructor.driver].Relation.MorphMany;

    return new MorphMany(this, relation, localKey, undefined, type, this.morphMany);
  }

  public morphOne<T>(
    relation: string | typeof Model,
    localKey?: string,
    type?: string
  ): Relation<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Model;

    const MorphOne: any = drivers[this.constructor.driver].Relation.MorphOne;

    return new MorphOne(this, relation, localKey, undefined, type, this.morphOne);
  }
}

export default Relational;
