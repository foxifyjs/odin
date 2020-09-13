import { Obj, Operator } from "./general";

export interface Filter<T extends Obj> {
  /* ------------------------- WHERE ------------------------- */

  where(query: FilterQuery<T>): this;

  where<K extends keyof T>(field: K, value: T[K]): this;

  where(field: string, value: unknown): this;

  where<K extends keyof T>(field: K, operator: Operator, value: T[K]): this;

  where(field: string, operator: Operator, value: unknown): this;

  /* ------------------------- OR WHERE ------------------------- */

  orWhere(query: FilterQuery<T>): this;

  orWhere<K extends keyof T>(field: K, value: T[K]): this;

  orWhere(field: string, value: unknown): this;

  orWhere<K extends keyof T>(field: K, operator: Operator, value: T[K]): this;

  orWhere(field: string, operator: Operator, value: unknown): this;

  /* ------------------------- WHERE NULL ------------------------- */

  whereNull(field: keyof T | string): this;

  /* ------------------------- WHERE NOT NULL ------------------------- */

  whereNotNull(field: keyof T | string): this;

  /* ------------------------- WHERE LIKE ------------------------- */

  whereLike(field: keyof T | string, value: string | RegExp): this;

  /* ------------------------- WHERE NOT LIKE ------------------------- */

  whereNotLike(field: keyof T | string, value: string | RegExp): this;

  /* ------------------------- WHERE IN ------------------------- */

  whereIn<K extends keyof T>(field: K, values: T[K][]): this;

  whereIn(field: string, values: unknown[]): this;

  /* ------------------------- WHERE NOT IN ------------------------- */

  whereNotIn<K extends keyof T>(field: K, values: T[K][]): this;

  whereNotIn(field: string, values: unknown[]): this;

  /* ------------------------- WHERE BETWEEN ------------------------- */

  whereBetween<K extends keyof T>(field: K, start: T[K], end: T[K]): this;

  whereBetween(field: string, start: unknown, end: unknown): this;

  /* ------------------------- WHERE NOT BETWEEN ------------------------- */

  whereNotBetween<K extends keyof T>(field: K, start: T[K], end: T[K]): this;

  whereNotBetween(field: string, start: unknown, end: unknown): this;
}

export type FilterQuery<T extends Obj, F extends Filter<T> = Filter<T>> = (
  query: F,
) => unknown;
