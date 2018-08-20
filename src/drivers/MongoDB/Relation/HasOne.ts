import { HasOne as Base } from "../../Relation";
import Query from "../../../base/Query";
import Driver from "../Driver";

class HasOne<T = any> extends Base {
  load(query: Query<T>) {
    const as = this.as;

    return query.join(
      this.relation,
      (q) => q.on(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`),
      as
    ).driver((q: Driver<T>) => q.pipeline({
      $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true },
    }));
  }
}

export default HasOne;
