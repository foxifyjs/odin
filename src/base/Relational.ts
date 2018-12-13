import * as Odin from "..";
import Filter from "../DB/Filter";
import GraphQL from "../GraphQL/Model";
import { EmbedMany, HasMany, HasOne, MorphMany, MorphOne } from "../Relation";
import { function as func, string } from "../utils";

class Relational<T extends object = any> extends GraphQL<T> {
  public embedMany<P extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string | ((q: Filter) => Filter),
    foreignKey?: string | ((q: Filter) => Filter),
    filter?: (q: Filter) => Filter
  ): EmbedMany<P> {
    if (string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    if (func.isFunction(foreignKey)) {
      filter = foreignKey;
      foreignKey = undefined;
    } else if (func.isFunction(localKey)) {
      filter = localKey;
      localKey = undefined;
      foreignKey = undefined;
    }

    return new EmbedMany(this as any, relation, localKey as string, foreignKey, filter, this.embedMany);
  }

  public hasMany<P extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string | ((q: Filter) => Filter),
    foreignKey?: string | ((q: Filter) => Filter),
    filter?: (q: Filter) => Filter
  ): HasMany<P> {
    if (string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    if (func.isFunction(foreignKey)) {
      filter = foreignKey;
      foreignKey = undefined;
    } else if (func.isFunction(localKey)) {
      filter = localKey;
      localKey = undefined;
      foreignKey = undefined;
    }

    return new HasMany(this as any, relation, localKey as string, foreignKey, filter, this.hasMany);
  }

  public hasOne<P extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string | ((q: Filter) => Filter),
    foreignKey?: string | ((q: Filter) => Filter),
    filter?: (q: Filter) => Filter
  ): HasOne<P> {
    if (string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    if (func.isFunction(foreignKey)) {
      filter = foreignKey;
      foreignKey = undefined;
    } else if (func.isFunction(localKey)) {
      filter = localKey;
      localKey = undefined;
      foreignKey = undefined;
    }

    return new HasOne(this as any, relation, localKey as string, foreignKey, filter, this.hasOne);
  }

  public morphMany<P extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string | ((q: Filter) => Filter),
    type?: string | ((q: Filter) => Filter),
    filter?: (q: Filter) => Filter
  ): MorphMany<P> {
    if (string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    if (func.isFunction(type)) {
      filter = type;
      type = undefined;
    } else if (func.isFunction(localKey)) {
      filter = localKey;
      localKey = undefined;
      type = undefined;
    }

    return new MorphMany(this as any, relation, localKey as string, undefined, type, filter, this.morphMany);
  }

  public morphOne<P extends Odin = any>(
    relation: string | typeof Odin,
    localKey?: string | ((q: Filter) => Filter),
    type?: string | ((q: Filter) => Filter),
    filter?: (q: Filter) => Filter
  ): MorphOne<P> {
    if (string.isString(relation))
      relation = this.constructor.models[relation] as typeof Odin;

    if (func.isFunction(type)) {
      filter = type;
      type = undefined;
    } else if (func.isFunction(localKey)) {
      filter = localKey;
      localKey = undefined;
      type = undefined;
    }

    return new MorphOne(this as any, relation, localKey as string, undefined, type, filter, this.morphOne);
  }
}

export default Relational;
