import * as Odin from "..";
import Query from "../base/Query";
import Relation from "./MorphBase";

class MorphMany<T extends Odin = Odin> extends Relation<T> {
  public load(query: Query<T>) {
    const as = this.as;

    return query.join(
      this.relation,
      q => q.where(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`)
        .where(`${this.type}_type`, this.model.constructor.name),
      as
    );
  }
}

export default MorphMany;
