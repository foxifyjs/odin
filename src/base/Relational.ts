import * as Odin from "..";
import Base from "../Base";
import { EmbedMany, HasMany, HasOne, MorphMany, MorphOne } from "../Relation";
import * as utils from "../utils";

interface Relational<T extends object = {}> extends Base<T> {
  constructor: typeof Odin;
}

class Relational extends Base {
  public embedMany<T extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string,
    foreignKey?: string
  ): EmbedMany<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    return new EmbedMany(this as any, relation, localKey, foreignKey, this.embedMany);
  }

  public hasMany<T extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string,
    foreignKey?: string
  ): HasMany<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    return new HasMany(this as any, relation, localKey, foreignKey, this.hasMany);
  }

  public hasOne<T extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string,
    foreignKey?: string
  ): HasOne<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    return new HasOne(this as any, relation, localKey, foreignKey, this.hasOne);
  }

  public morphMany<T extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string,
    type?: string
  ): MorphMany<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    return new MorphMany(this as any, relation, localKey, undefined, type, this.morphMany);
  }

  public morphOne<T extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string,
    type?: string
  ): MorphOne<T> {
    if (utils.string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    return new MorphOne(this as any, relation, localKey, undefined, type, this.morphOne);
  }
}

export default Relational;
