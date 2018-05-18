import { HasOne as Base } from "../../Relation";
import Query from "../../../base/Query";
import Driver from "../Driver";

class HasOne<T = any> extends Base {
    load(query: Query<T>) {
        return query.join(this.relation, this.localKey, this.foreignKey, this.as)
            .driver((q: Driver<T>) => q.pipeline({
                $unwind: { path: `$${this.as}`, preserveNullAndEmptyArrays: true },
            }));
    }
}

export default HasOne;
