import Query from "../../../base/Query";
import { EmbedMany as Base } from "../../Relation";

class EmbedMany<T extends object = {}> extends Base {
  public load(query: Query<T>) {
    return query.join(
      this.relation,
      q => q.whereIn(this.foreignKey, `${this.model.constructor.toString()}.${this.localKey}`),
      this.as
    );
  }
}

export default EmbedMany;
