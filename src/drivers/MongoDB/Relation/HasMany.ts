import { HasMany as Base } from "../../Relation";
import Query from "../../../base/Query";

class HasMany<T = any> extends Base {
  load(query: Query<T>) {
    return query.join(
      this.relation,
      (q) => q.on(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`),
      this.as
    );
  }
}

export default HasMany;
