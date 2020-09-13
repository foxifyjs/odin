import * as mongo from "mongodb";
import { MongoID } from "./general";
import { MongoJoin } from "./Join";
import { Obj, DB } from "../general";

export interface MongoDB<T extends Obj> extends DB<T, MongoID>, MongoJoin<T> {
  /* ------------------------- UNSET ------------------------- */

  unset(fields: string[]): Promise<number>;

  unset<K extends keyof T>(fields: K[]): Promise<number>;

  /* ------------------------- INDEXES ------------------------- */

  indexes(): Promise<unknown>;

  /* ------------------------- INDEX ------------------------- */

  index(field: string, options?: mongo.IndexOptions): Promise<unknown>;

  index(spec: Obj, options?: mongo.IndexOptions): Promise<unknown>;

  /* ------------------------- REINDEX ------------------------- */

  reIndex(): Promise<unknown>;

  /* ------------------------- DROP INDEX ------------------------- */

  dropIndex(
    index: string,
    options?: mongo.CommonOptions & { maxTimeMS?: number },
  ): Promise<unknown>;
}
