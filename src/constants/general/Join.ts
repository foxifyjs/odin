import { Filter } from "./Filter";
import { Obj, Order } from "./general";

export interface Join<T extends Obj> extends Filter<T> {
  /* ------------------------- JOIN ------------------------- */

  join(table: string, query?: JoinQuery<T>, as?: string): this;

  /* ------------------------- ORDER ------------------------- */

  orderBy(field: keyof T | string, order?: Order): this;

  orderBy(field: { [key in keyof T | string]?: Order }): this;

  /* ------------------------- OFFSET ------------------------- */

  offset(offset: number): this;

  skip(offset: number): this;

  /* ------------------------- LIMIT ------------------------- */

  limit(limit: number): this;

  take(limit: number): this;

  /* ------------------------- PAGINATION ------------------------- */

  paginate(page: number, limit?: number): this;
}

export type JoinQuery<T extends Obj, J extends Join<T> = Join<T>> = (
  query: J,
) => unknown;
