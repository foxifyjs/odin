import * as Base from "graphql";
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

  return new Base.GraphQLEnumType({
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
      type: Base.GraphQLOutputType,
    };
  }
}

class GraphQL {
  private static _schema: Model.Schema;
  private static _table: string;
  private static timestamps: boolean;
  // private static softDelete: boolean;
  private static CREATED_AT: string;
  private static UPDATED_AT: string;
  private static DELETED_AT: string;
  public static DB: Model.DB;
  public static connection: Model.Connection;

  public static toGraphQL(): any {
    const name = this.name;

    const multiple = this._table;
    const single = utils.string.pluralize(multiple, 1);

    const schema = _schema(name, this._schema);
    const args = schema.args;
    const type = new Base.GraphQLObjectType({
      name,
      fields: {
        id: {
          type: Base.GraphQLID,
        },
        ...schema.fields,
      },
    });

    const getDB = () => {
      const db = this.DB.connection(this.connection).table(this._table);

      if ((this as any).softDelete) return db.whereNull(this.DELETED_AT);

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

          let db = getDB();

          if (this.timestamps) db = db.orderBy("created_at", "desc");

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

    const queryInputType = new Base.GraphQLInputObjectType({
      name: `${name}QueryInput`,
      fields: args,
    });

    const inputType = new Base.GraphQLInputObjectType({
      name: `${name}Input`,
      fields: utils.object.omit(
        args,
        ["id", this.CREATED_AT, this.UPDATED_AT, this.DELETED_AT]
      ) as any,
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
          const result = await _encapsulate(
            async () => await ((this as any) as typeof Model).create(params.data)
          );

          return _prepare(result);
        },
      },
      [`insert_${multiple}`]: {
        type: Base.GraphQLInt,
        args: {
          data: {
            type: new Base.GraphQLList(new Base.GraphQLNonNull(inputType)),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) => await _encapsulate(
          async () => await ((this as any) as typeof Model).insert(params.data)
        ),
      },
      [`update_${multiple}`]: {
        type: Base.GraphQLInt,
        args: {
          query: {
            type: queryInputType,
          },
          data: {
            type: new Base.GraphQLNonNull(inputType),
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
        type: Base.GraphQLInt,
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
        type: Base.GraphQLInt,
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
