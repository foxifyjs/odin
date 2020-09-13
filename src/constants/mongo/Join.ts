import { MongoPipeline } from "./aggregation";
import { Obj, Join } from "../general";

export interface MongoJoin<T extends Obj> extends Join<T> {
  /* ------------------------- PIPELINE ------------------------- */

  pipe(...pipeline: MongoPipeline<T>): this;
}
