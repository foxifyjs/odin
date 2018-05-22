import { MorphMany as Base } from "../../Relation";
import Query from "../../../base/Query";

class MorphMany<T = any> extends Base {
  load(query: Query<T>) {
    const as = this.as;

    return query.join(
      this.relation,
      (q) => q.on(this.localKey, `${this.model.constructor.toString()}.${this.foreignKey}`)
        .on(`${this.type}_type`, this.model.constructor.filename),
      as,
    );
  }
}

export default MorphMany;
