import * as Model from "..";
import Base from "../Base";
import * as drivers from "../drivers";
import Relation from "../drivers/Relation/Base";
import * as utils from "../utils";

interface Relational<T extends object = {}> extends Base<T> {
  constructor: typeof Model;
}

class Relational extends Base {
  public hasMany<T extends Model = any>(
    relation: string | typeof Model,
    localKey?: string,
    foreignKey?: string
  ): Relation<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Model;

    const HasMany: any = drivers[this.constructor.driver].Relation.HasMany;

    return new HasMany(this, relation, localKey, foreignKey, this.hasMany);
  }

  public hasOne<T extends Model = any>(
    relation: string | typeof Model,
    localKey?: string,
    foreignKey?: string
  ): Relation<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Model;

    const HasOne: any = drivers[this.constructor.driver].Relation.HasOne;

    return new HasOne(this, relation, localKey, foreignKey, this.hasOne);
  }

  public morphMany<T extends Model = any>(
    relation: string | typeof Model,
    localKey?: string,
    type?: string
  ): Relation<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Model;

    const MorphMany: any = drivers[this.constructor.driver].Relation.MorphMany;

    return new MorphMany(this, relation, localKey, undefined, type, this.morphMany);
  }

  public morphOne<T extends Model = any>(
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
