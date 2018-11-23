import * as Odin from "..";
import Query from "../base/Query";
import { makeTableId } from "../utils";
import HasMany from "./HasMany";

class EmbedMany<T extends Odin = Odin> extends HasMany<T> {
  constructor(
    model: Odin,
    relation: typeof Odin,
    localKey: string = `${makeTableId(relation.toString())}s`,
    foreignKey: string = "id",
    caller: (...args: any[]) => any
  ) {
    super(model, relation, localKey, foreignKey, caller);
  }

  public load(query: Query<T>) {
    return query.join(
      this.relation,
      q => q.whereIn(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`),
      this.as
    );
  }
}

export default EmbedMany;
