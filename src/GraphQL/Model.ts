import * as GraphQLBase from "graphql";
import Base from "../Base";
import Query from "../base/Query";
import * as DB from "../DB";
import * as Model from "../index";
import TypeAny from "../types/Any";
import * as utils from "../utils";

const _schema = (model: string, schema: Model.Schema) => {
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
      type: new GraphQLBase.GraphQLObjectType({
        name: `${model}_${key}`,
        fields: newSchema.fields,
      }),
    };

    args[key] = {
      type: new GraphQLBase.GraphQLInputObjectType({
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

const _projection = (fieldASTs: any) => fieldASTs.selectionSet.selections.reduce(
  (projections: any, selection: any) => {
    projections.push(selection.name.value);

    return projections;
  },
  []
);

const _orderBy = (model: string, schema: Model.Schema) => {
  const orderByASC = (key: string) => `${key}_ASC`;
  const orderByDESC = (key: string) => `${key}_DESC`;
  const getValues = (schema: Model.Schema, keyPrefix?: string) => {
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

  return new GraphQLBase.GraphQLEnumType({
    name: `${model}OrderByInput`,
    values: getValues(schema),
  });
};

const _prepare = (item: Model) => item && item.toJSON();

const _encapsulate = async (fn: () => Promise<any>) => {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Error) throw err;

    const errorMessage = utils.object.reduce(
      err,
      (prev, message, field) => {
        prev.push(`[${field}]: ${message}`);

        return prev;
      },
      []
    ).join(", ");

    throw new Error(errorMessage);
  }
};

module GraphQL {
  export interface Schema {
    [key: string]: {
      type: GraphQLBase.GraphQLOutputType,
    };
  }
}

class GraphQL<T = any> extends Base<T> {
  public static toGraphQL(): any {
    const name = this.name;

    const multiple = (this as any)._table;
    const single = utils.string.pluralize(multiple, 1);

    const schema = _schema(name, (this as any)._schema);
    const args = schema.args;
    const type = new GraphQLBase.GraphQLObjectType({
      name,
      fields: {
        id: {
          type: GraphQLBase.GraphQLID,
        },
        ...schema.fields,
      },
    });

    const getDB = () => {
      const db = (this as any).DB.connection((this as any).connection).table((this as any)._table);

      if ((this as any).softDelete) return db.whereNull((this as any).DELETED_AT);

      return db;
    };

    const queries = {
      [single]: {
        type,
        args,
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          const projection = _projection(fieldASTs.fieldNodes[0]);
          const query: DB = utils.object.reduce(
            params,
            (query, value, key) => query.where(key, value),
            getDB()
          );

          return await query.first(projection);
        },
      },
      [multiple]: {
        type: new GraphQLBase.GraphQLList(type),
        args: {
          ...args,
          skip: {
            type: GraphQLBase.GraphQLInt,
          },
          limit: {
            type: GraphQLBase.GraphQLInt,
          },
          orderBy: {
            type: _orderBy(name, (this as any)._schema),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          const projection = _projection(fieldASTs.fieldNodes[0]);

          let db = getDB();

          if ((this as any).timestamps) db = db.orderBy("created_at", "desc");

          const query: DB = utils.object.reduce(
            params,
            (query, value, key) => {
              switch (key) {
                case "skip":
                  return query.skip(value);
                case "limit":
                  return query.limit(value);
                case "orderBy":
                  value = value.split("_");
                  return query.orderBy(value.shift(), value[0].toLowerCase());
                default:
                  return query.where(key as string, value);
              }
            },
            db
          );

          return await query.get(projection);
        },
      },
    };

    const queryInputType = new GraphQLBase.GraphQLInputObjectType({
      name: `${name}QueryInput`,
      fields: args,
    });

    const inputType = new GraphQLBase.GraphQLInputObjectType({
      name: `${name}Input`,
      fields: utils.object.omit(
        args,
        ["id", (this as any).CREATED_AT, (this as any).UPDATED_AT, (this as any).DELETED_AT]
      ) as any,
    });

    const mutations = {
      [`create_${single}`]: {
        type,
        args: {
          data: {
            type: new GraphQLBase.GraphQLNonNull(inputType),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          const result = await _encapsulate(
            async () => await ((this as any) as typeof Model).create(params.data)
          );

          return _prepare(result);
        },
      },
      [`insert_${multiple}`]: {
        type: GraphQLBase.GraphQLInt,
        args: {
          data: {
            type: new GraphQLBase.GraphQLList(new GraphQLBase.GraphQLNonNull(inputType)),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => await _encapsulate(
          async () => await ((this as any) as typeof Model).insert(params.data)
        ),
      },
      [`update_${multiple}`]: {
        type: GraphQLBase.GraphQLInt,
        args: {
          query: {
            type: queryInputType,
          },
          data: {
            type: new GraphQLBase.GraphQLNonNull(inputType),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          const query: Query = utils.object.reduce(
            params.query || {},
            (query, value, key) => query.where(key, value),
            (this as any) as Model | Query
          );

          return await _encapsulate(async () => await query.update(params.data));
        },
      },
      [`delete_${multiple}`]: {
        type: GraphQLBase.GraphQLInt,
        args: {
          query: {
            type: queryInputType,
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          const query: Query = utils.object.reduce(
            params.query || {},
            (query, value, key) => query.where(key, value),
            (this as any) as Model | Query
          );

          return await query.delete();
        },
      },
    };

    if ((this as any).softDelete)
      mutations[`restore_${multiple}`] = {
        type: GraphQLBase.GraphQLInt,
        args: {
          query: {
            type: queryInputType,
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
          const query: Query = utils.object.reduce(
            params.query,
            (query, value, key) => query.where(key, value),
            ((this as any) as typeof Model).withTrashed()
          );

          return await query.restore();
        },
      };

    return {
      queries,
      mutations,
    };
  }
}

export default GraphQL;
