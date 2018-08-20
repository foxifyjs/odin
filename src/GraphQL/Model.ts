import * as Base from "graphql";
import Query from "../base/Query";
import ModelConstructor, { Model } from "../index";
import TypeAny from "../types/Any";
import * as utils from "../utils";

const _schema = (model: string, schema: ModelConstructor.Schema) => {
  const fields: GraphQL.Schema = {};
  const args: any = {};

  for (const key in schema) {
    const type = schema[key];

    if (type instanceof TypeAny) {
      // Type

      const gql = type.toGraphQL(model, key);

      fields[key] = { type: gql.field as any };
      args[key] = { type: gql.arg };

      continue;
    }

    // Object
    const newSchema = _schema(model, type);

    fields[key] = {
      type: new Base.GraphQLObjectType({
        name: `${model}_${key}`,
        fields: newSchema.fields,
      }),
    };

    args[key] = {
      type: new Base.GraphQLInputObjectType({
        name: `${model}_${key}_input`,
        fields: newSchema.args,
      }),
    };
  }

  return {
    fields,
    args,
  };
};

const _projection = (fieldASTs: any) => fieldASTs.selectionSet.selections.reduce((projections: any, selection: any) => {
  projections[selection.name.value] = 1;

  return projections;
}, {});

const _orderBy = (model: string, schema: ModelConstructor.Schema) => {
  const orderByASC = (key: string) => `${key}_ASC`;
  const orderByDESC = (key: string) => `${key}_DESC`;
  const getValues = (schema: ModelConstructor.Schema, keyPrefix?: string) => {
    const values: { [key: string]: any } = {};

    for (const key in schema) {
      const type = schema[key];
      const _key = utils.array.compact([keyPrefix, key]).join(".");

      if (type instanceof TypeAny) {
        const ASC = orderByASC(_key);
        values[ASC] = { value: ASC };

        const DESC = orderByDESC(_key);
        values[DESC] = { value: DESC };

        continue;
      }

      utils.object.forEach(
        getValues(schema, _key),
        (value, key) => values[key] = value
      );
    }

    return values;
  };

  return new Base.GraphQLEnumType({
    name: `${model}OrderByInput`,
    values: getValues(schema),
  });
};

const _prepare = (item: Model) => item.toJSON();

module GraphQL {
  export interface Schema {
    [key: string]: {
      type: Base.GraphQLOutputType,
    };
  }
}

class GraphQL {
  private static schema: ModelConstructor.Schema;
  private static _schema: ModelConstructor.Schema;
  private static _table: string;
  private static timestamps: boolean;
  private static softDelete: boolean;

  static toGraphQL(): any {
    const name = this.name;

    const multiple = this._table;
    const single = utils.string.pluralize(multiple, 1);

    const schema = _schema(name, this.schema);
    const fields = schema.fields;
    const args = {
      id: {
        type: Base.GraphQLID,
      },
      ...schema.args,
    };
    const type = new Base.GraphQLObjectType({
      name,
      fields: {
        id: {
          type: new Base.GraphQLNonNull(Base.GraphQLID),
        },
        ...fields,
      },
    });

    const queries = {
      [single]: {
        type,
        args,
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          const projection = _projection(fieldASTs.fieldNodes[0]);

          let query = (this as any) as ModelConstructor | Query;
          utils.object.forEach(params, (value, key) => {
            query = query.where(key as string, value);
          });

          return _prepare(await (query as Query).first(projection));
        },
      },
      [multiple]: {
        type: new Base.GraphQLList(type),
        args: {
          ...args,
          skip: {
            type: Base.GraphQLInt,
          },
          limit: {
            type: Base.GraphQLInt,
          },
          orderBy: {
            type: _orderBy(name, this._schema),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          const projection = _projection(fieldASTs.fieldNodes[0]);

          let query = (this as any) as ModelConstructor | Query;

          if (this.timestamps) query = query.orderBy("created_at", "desc");

          utils.object.forEach(params, (value, key) => {
            switch (key) {
              case "skip":
                query = query.skip(value);
                break;
              case "limit":
                query = query.limit(value);
                break;
              case "orderBy":
                value = value.split("_");
                query = query.orderBy(value.shift(), value[0].toLowerCase());
                break;
              default:
                query = query.where(key as string, value);
            }
          });

          return (await (query as Query).get(projection)).map(_prepare);
        },
      },
    };

    const inputType = new Base.GraphQLInputObjectType({
      name: `${name}Input`,
      fields: schema.args,
    });

    const mutations = {
      [`create_${single}`]: {
        type,
        args: {
          data: {
            type: new Base.GraphQLNonNull(inputType),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          return _prepare(await ((this as any) as ModelConstructor).create(params.data));
        },
      },
      [`insert_${multiple}`]: {
        type: Base.GraphQLInt,
        args: {
          data: {
            type: new Base.GraphQLList(new Base.GraphQLNonNull(inputType)),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          return await ((this as any) as ModelConstructor).insert(params.data);
        },
      },
      [`update_${multiple}`]: {
        type: Base.GraphQLInt,
        args: {
          query: {
            type: new Base.GraphQLNonNull(inputType),
          },
          data: {
            type: new Base.GraphQLNonNull(inputType),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          let query = (this as any) as ModelConstructor | Query;
          utils.object.forEach(params.query, (value, key) => {
            query = query.where(key as string, value);
          });

          return await (query as Query).update(params.data);
        },
      },
      [`delete_${multiple}`]: {
        type: Base.GraphQLInt,
        args: {
          query: {
            type: new Base.GraphQLNonNull(inputType),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          let query = (this as any) as ModelConstructor | Query;
          utils.object.forEach(params.query, (value, key) => {
            query = query.where(key as string, value);
          });

          return await (query as Query).delete();
        },
      },
    };

    if (this.softDelete)
      mutations[`restore_${multiple}`] = {
        type: Base.GraphQLInt,
        args: {
          query: {
            type: new Base.GraphQLNonNull(inputType),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          let query = (this as any) as ModelConstructor | Query;

          utils.object.forEach(params.query, (value, key) => {
            query = query.where(key as string, value);
          });

          return await (query as Query).update({ deleted_at: null });
        },
      };

    return {
      queries,
      mutations,
    };
  }
}

export interface GraphQLConstructor {
  toGraphQL(): any;
}

export default GraphQL;
