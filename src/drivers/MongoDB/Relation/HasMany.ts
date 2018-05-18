import { HasMany as Base } from "../../Relation";
import Query from "../../../base/Query";

class HasMany<T = any> extends Base {
    load(query: Query<T>) {
        return query.join(this.relation, this.localKey, this.foreignKey, this.as);
    }
}

export default HasMany;
