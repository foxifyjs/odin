import Query from "../../../base/Query";
import { MorphMany as Base } from "../../Relation";

class MorphMany<T extends object = {}> extends Base {
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
