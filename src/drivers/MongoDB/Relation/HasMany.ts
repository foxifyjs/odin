import { HasMany as Base } from "../../Relation";
import Query from "../../../base/Query";

class HasMany<T = any> extends Base {
  load(query: Query<T>) {
    return query.join(
      this.relation,
      (q) => q.on(this.localKey, `${this.model.constructor.toString()}.${this.foreignKey}`),
      this.as,
    );
  }
}

export default HasMany;
