import { Join } from "./Join";
import { Obj } from "./general";

export interface DB<T extends Obj, ID> extends Join<T> {
  /* ------------------------- INSERT ------------------------- */

  insert(item: T): Promise<number>;

  insert(items: T[]): Promise<number>;

  /* ------------------------- INSERT GET ID ------------------------- */

  insertGetId(item: T): Promise<ID>;

  /* ------------------------- GET ------------------------- */

  get(): Promise<T[]>;

  get(...select: Array<keyof T | string>): Promise<Partial<T>[]>;

  /* ------------------------- COUNT ------------------------- */

  count(): Promise<number>;

  /* ------------------------- EXISTS ------------------------- */

  exists(): Promise<boolean>;

  /* ------------------------- PLUCK ------------------------- */

  pluck<K extends keyof T>(field: K): Promise<T[K][]>;

  pluck(field: string): Promise<unknown[]>;

  value<K extends keyof T>(field: K): Promise<T[K][]>;

  value(field: string): Promise<unknown[]>;

  /* ------------------------- FIRST ------------------------- */

  first(): Promise<T>;

  first(...select: Array<keyof T | string>): Promise<Partial<T>>;

  /* ------------------------- MAXIMUM ------------------------- */

  max<K extends keyof T>(field: K): Promise<T[K]>;

  max(field: string): Promise<unknown>;

  /* ------------------------- MINIMUM ------------------------- */

  min<K extends keyof T>(field: K): Promise<T[K]>;

  min(field: string): Promise<unknown>;

  /* ------------------------- AVERAGE ------------------------- */

  avg<K extends keyof T>(field: K): Promise<T[K]>;

  avg(field: string): Promise<unknown>;

  /* ------------------------- ASYNC ITERATOR ------------------------- */

  [Symbol.asyncIterator](): AsyncIterator<T>;

  /* ------------------------- UPDATE ------------------------- */

  update(update: Partial<T>): Promise<number>;

  /* ------------------------- INCREMENT ------------------------- */

  increment(field: keyof T | string, count?: number): Promise<number>;

  /* ------------------------- DECREMENT ------------------------- */

  decrement(field: keyof T | string, count?: number): Promise<number>;

  /* ------------------------- DELETE ------------------------- */

  delete(): Promise<number>;
}
