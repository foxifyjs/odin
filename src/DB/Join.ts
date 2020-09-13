import Filter from "./Filter";
import {
  ORDER,
  MONGO_ROOT,
  Obj,
  JoinQuery,
  MongoJoin,
  MongoPipeline,
  MongoPipelineStageSort,
  Order,
} from "../constants";

export default class Join<T extends Obj>
  extends Filter<T>
  implements MongoJoin<T> {
  protected _pipeline: MongoPipeline<T> = [];

  public get pipeline(): MongoPipeline<T> {
    if (Object.keys(this._filters).length > 0) {
      this._pipeline = this._pipeline.concat({ $match: this._filters });

      this._filters = {};
    }

    return this._pipeline;
  }

  public constructor(public table: string) {
    super();
  }

  /* ------------------------- JOIN ------------------------- */

  // TODO: right filters
  public join(
    table: string,
    query: JoinQuery<T, Join<T>> = (q) =>
      q.where(`${table}_id`, `$${table}._id`),
    as = table,
  ): this {
    const join = new Join<T>(table);

    query(join);

    return this.pipe({
      $lookup: {
        let: { [this.table]: MONGO_ROOT },
        from: table,
        pipeline: join.pipeline,
        as,
      },
    });
  }

  /* ------------------------- ORDER ------------------------- */

  public orderBy<K extends keyof T>(field: K | string, order?: Order): this;
  public orderBy<K extends keyof T>(
    fields: { [key in K | string]: Order },
  ): this;
  public orderBy(
    fields: string | { [key: string]: Order },
    order: Order = ORDER.ASC,
  ): this {
    const $sort: MongoPipelineStageSort["$sort"] = {};

    if (typeof fields === "string")
      $sort[fields] = order === ORDER.ASC ? 1 : -1;
    else {
      for (const field in fields as { [key in keyof T | string]?: Order }) {
        if (!Object.prototype.hasOwnProperty.call(fields, field)) continue;

        $sort[field] = fields[field] === ORDER.ASC ? 1 : -1;
      }
    }

    return this.pipe({ $sort });
  }

  /* ------------------------- OFFSET ------------------------- */

  public offset(offset: number): this;
  public offset($skip: number): this {
    return this.pipe({ $skip });
  }

  public skip(offset: number): this {
    return this.offset(offset);
  }

  /* ------------------------- LIMIT ------------------------- */

  public limit(limit: number): this;
  public limit($limit: number): this {
    return this.pipe({ $limit });
  }

  public take(limit: number): this {
    return this.limit(limit);
  }

  /* ------------------------- PAGINATION ------------------------- */

  public paginate(page: number, limit = 10): this {
    return this.offset(page * limit).limit(limit);
  }

  /* ------------------------- PIPELINE ------------------------- */

  public pipe(...pipeline: MongoPipeline<T>): this {
    if (pipeline.length > 0) this._pipeline = this.pipeline.concat(pipeline);

    return this;
  }
}
