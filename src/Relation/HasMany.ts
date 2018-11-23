import * as Odin from "..";
import Query from "../base/Query";
import { makeTableId } from "../utils";
import Relation from "./Base";

class HasMany<T extends Odin = Odin> extends Relation<T> {
  constructor(
    model: Odin,
    relation: typeof Odin,
    localKey: string = "id",
    foreignKey: string = makeTableId(model.constructor.toString()),
    caller: (...args: any[]) => any
  ) {
    super(model, relation, localKey, foreignKey, caller);
  }

  public load(query: Query<T>) {
    return query.join(
      this.relation,
      q => q.where(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`),
      this.as
    );
  }
}

export default HasMany;
