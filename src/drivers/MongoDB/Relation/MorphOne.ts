import Query from "../../../base/Query";
import { MorphOne as Base } from "../../Relation";
import Driver from "../Driver";

class MorphOne<T extends object = {}> extends Base {
  public load(query: Query<T>) {
    const as = this.as;

    return query.join(
      this.relation,
      q => q.where(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`)
        .where(`${this.type}_type`, this.model.constructor.name),
      as
    ).driver((q: Driver<T>) => q.pipeline({
      $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true },
    }));
  }
}

export default MorphOne;
