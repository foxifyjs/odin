import { HasMany as Base } from "../../Relation";
import * as DB from "../../../DB";

class HasMany<T = any> extends Base {
    load(query: DB<T>) {
        return query.join(this.relation.toString(), this.localKey, this.foreignKey, this.as);
    }
}

export default HasMany;
