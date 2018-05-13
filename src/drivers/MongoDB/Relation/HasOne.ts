import { HasOne as Base } from "../../Relation";
import * as DB from "../../../DB";
import Driver from "../Driver";

class HasOne<T = any> extends Base {
    load(query: DB<T>, as: string) {
        return query.join(this.relation.toString(), this.localKey, this.foreignKey, as)
            .driver((q: Driver<T>) => q.pipeline({
                $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true },
            }));
    }
}

export default HasOne;
