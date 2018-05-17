import { HasOne as Base } from "../../Relation";
import * as DB from "../../../DB";
import Driver from "../Driver";

class HasOne<T = any> extends Base {
    load(query: DB<T>) {
        return query.join(this.relation.toString(), this.localKey, this.foreignKey, this.as)
            .driver((q: Driver<T>) => q.pipeline({
                $unwind: { path: `$${this.as}`, preserveNullAndEmptyArrays: true },
            }));
    }
}

export default HasOne;
