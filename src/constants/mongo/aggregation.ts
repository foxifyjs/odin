import { Obj } from "../general";

export type MongoPipeline<T extends Obj> = MongoPipelineStage<T>[];

export type MongoPipelineStage<T extends Obj> =
  | MongoPipelineStageCount
  | MongoPipelineStageGroup
  | MongoPipelineStageLimit
  | MongoPipelineStageLookup<T>
  | MongoPipelineStageMatch<T>
  | MongoPipelineStageProject
  | MongoPipelineStageSkip
  | MongoPipelineStageSort;

export interface MongoPipelineStageCount {
  $count: string;
}

export interface MongoPipelineStageGroup {
  $group: {
    // TODO:
    _id: unknown;
    [field: string]: unknown;
  };
}

export interface MongoPipelineStageLimit {
  $limit: number;
}

export interface MongoPipelineStageLookup<T extends Obj> {
  $lookup:
    | {
        from: string;
        localField: keyof T;
        foreignField: string;
        as: string;
      }
    | {
        from: string;
        let: { [field: string]: string };
        pipeline: MongoPipeline<T>;
        as: string;
      };
}

export interface MongoPipelineStageMatch<T extends Obj> {
  $match: Partial<T> | Obj;
}

export interface MongoPipelineStageProject {
  $project: { [field: string]: 1 | 0 | boolean | MongoPipelineExpression };
}

export interface MongoPipelineStageSkip {
  $skip: number;
}

export interface MongoPipelineStageSort {
  $sort: { [field: string]: 1 | -1 | { $meta: string } };
}

export interface MongoPipelineStageUnset {
  $unset: string | string[];
}

export interface MongoPipelineExpression {
  [expression: string]: unknown;
}
