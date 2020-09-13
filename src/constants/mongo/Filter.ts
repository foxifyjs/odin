import { MongoPipeline } from "./aggregation";
import { Obj, Filter } from "../general";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MongoFilter<T extends Obj> extends Filter<T> {}
