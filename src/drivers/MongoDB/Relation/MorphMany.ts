import Query from "../../../base/Query";
import { MorphMany as Base } from "../../Relation";

class MorphMany<T = any> extends Base {
  public load(query: Query<T>) {
    const as = this.as;

    return query.join(
      this.relation,
      q => q.on(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`)
        .on(`${this.type}_type`, this.model.constructor.name),
      as
    );
  }
}

export default MorphMany;
