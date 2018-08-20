import { MorphOne as Base } from "../../Relation";
import Query from "../../../base/Query";
import Driver from "../Driver";

class MorphOne<T = any> extends Base {
  load(query: Query<T>) {
    const as = this.as;

    return query.join(
      this.relation,
      (q) => q.on(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`)
        .on(`${this.type}_type`, this.model.constructor.filename),
      as
    ).driver((q: Driver<T>) => q.pipeline({
      $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true },
    }));
  }
}

export default MorphOne;
