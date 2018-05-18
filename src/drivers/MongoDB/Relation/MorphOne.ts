import { MorphOne as Base } from "../../Relation";
import Query from "../../../base/Query";
import Driver from "../Driver";

class MorphOne<T = any> extends Base {
    load(query: Query<T>) {
        const as = this.as;
        const key = `${this.type}_type`;
        const type = this.model.constructor.filename;

        return query.join(this.relation, this.localKey, this.foreignKey, as)
            .driver((q: Driver<T>) => q.pipeline({
                $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true },
            }))
            .map((item: any) => {
                const value = item.attribues[as];

                if (value)
                    item.attribues[as] = value[key] === type ? value : null;

                return item;
            });
    }
}

export default MorphOne;
