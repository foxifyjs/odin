import Query from "../../../base/Query";
import { HasMany as Base } from "../../Relation";

class HasMany<T = any> extends Base {
  public load(query: Query<T>) {
    return query.join(
      this.relation,
      q => q.on(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`),
      this.as
    );
  }
}

export default HasMany;
