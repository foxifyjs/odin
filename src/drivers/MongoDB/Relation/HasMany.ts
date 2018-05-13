import { HasMany as Base } from "../../Relation";
import * as DB from "../../../DB";

class HasMany<T = any> extends Base {
    load(query: DB<T>, as: string) {
        return query.join(this.relation.toString(), this.localKey, this.foreignKey, as);
    }
}

export default HasMany;
