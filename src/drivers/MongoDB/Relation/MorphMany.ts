import { MorphMany as Base } from "../../Relation";
import Query from "../../../base/Query";

class MorphMany<T = any> extends Base {
    load(query: Query<T>) {
        const as = this.as;
        const key = `${this.type}_type`;
        const type = this.model.constructor.filename;

        return query.join(this.relation, this.localKey, this.foreignKey, as)
            .map((item: any) => {
                item.attribues[as] = item.attribues[as].filter((i: any) => i[key] === type);

                return item;
            });
    }
}

export default MorphMany;
