import * as GraphQLBase from "graphql";
import * as Odin from "..";
import Query from "../base/Query";
import QueryBuilder from "../base/QueryBuilder";
import DB from "../DB";
import Types from "../types";
import { string } from "../utils";
import * as utils from "../utils";

const _schema = (model: string, schema: Odin.Schema) => {
  const fields: Schema = {};
  const args: any = {};

  for (const key in schema) {
    const type = schema[key];

    if (Types.isType(type)) {
      // Type

      const gql = (type as any).toGraphQL(model, key);

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

const _projection = (fieldASTs: any) =>
  fieldASTs.selectionSet.selections.reduce(
    (projections: any, selection: any) => {
      projections.push(selection.name.value);

      return projections;
    },
    [],
  );

const _orderBy = (model: string, schema: Odin.Schema) => {
  const orderByASC = (key: string) => `${key}_ASC`;
  const orderByDESC = (key: string) => `${key}_DESC`;
  const getValues = (schema: Odin.Schema, keyPrefix?: string) => {
    const values: { [key: string]: any } = {};

    for (const key in schema) {
      const type = schema[key];
      const _key = utils.array.compact([keyPrefix, key]).join(".");

      if (Types.isType(type)) {
        const ASC = orderByASC(_key);
        values[ASC] = { value: ASC };

        const DESC = orderByDESC(_key);
        values[DESC] = { value: DESC };

        continue;
      }

      utils.object.forEach(
        getValues(schema, _key),
        (value, key) => (values[key] = value),
      );
    }

    return values;
  };

  return new GraphQLBase.GraphQLEnumType({
    name: `${model}OrderByInput`,
    values: getValues(schema),
  });
};

const _prepare = (item: Odin) => item && item.toJSON();

const _encapsulate = async (fn: () => Promise<any>) => {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Error) throw err;

    const errorMessage = utils.object
      .reduce(
        err,
        (prev, message, field) => {
          prev.push(`[${field}]: ${message}`);

          return prev;
        },
        [],
      )
      .join(", ");

    throw new Error(errorMessage);
  }
};

export interface Schema {
  [key: string]: {
    type: GraphQLBase.GraphQLOutputType;
  };
}

export default class GraphQL<
  T extends Record<string, unknown> = Record<string, unknown>
> extends QueryBuilder<T> {
  public static toGraphQL(): any {
    const name = this.name;

    const multiple = this._collection;
    const single = utils.string.pluralize(multiple, 1);

    const schema = _schema(name, this._schema);
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
      const db = (this as any).DB.connection(this.connection).collection(
        this._collection,
      );

      if (this.softDelete) return db.whereNull(this.DELETED_AT);

      return db;
    };

    const queries = {
      [single]: {
        type,
        args,
        resolve: async (
          root: any,
          params: any,
          options: any,
          fieldASTs: any,
        ) => {
          const projection = _projection(fieldASTs.fieldNodes[0]);
          const query: DB = utils.object.reduce(
            params,
            (query, value, key) => query.where(key, value),
            getDB(),
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
        resolve: async (
          root: any,
          params: any,
          options: any,
          fieldASTs: any,
        ) => {
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
            db,
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
      fields: utils.object.omit(args, [
        "id",
        this.CREATED_AT,
        this.UPDATED_AT,
        this.DELETED_AT,
      ]) as any,
    });

    const mutations = {
      [`create_${single}`]: {
        type,
        args: {
          data: {
            type: new GraphQLBase.GraphQLNonNull(inputType),
          },
        },
        resolve: async (
          root: any,
          params: any,
          options: any,
          fieldASTs: any,
        ) => {
          const result = await _encapsulate(
            async () => await this.create(params.data),
          );

          return _prepare(result);
        },
      },
      [`insert_${multiple}`]: {
        type: GraphQLBase.GraphQLInt,
        args: {
          data: {
            type: new GraphQLBase.GraphQLList(
              new GraphQLBase.GraphQLNonNull(inputType),
            ),
          },
        },
        resolve: async (root: any, params: any, options: any, fieldASTs: any) =>
          await _encapsulate(async () => await this.insert(params.data)),
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
        resolve: async (
          root: any,
          params: any,
          options: any,
          fieldASTs: any,
        ) => {
          const query: Query = utils.object.reduce(
            params.query || {},
            (query, value, key) => query.where(key, value),
            this,
          );

          return await _encapsulate(
            async () => await query.update(params.data),
          );
        },
      },
      [`delete_${multiple}`]: {
        type: GraphQLBase.GraphQLInt,
        args: {
          query: {
            type: queryInputType,
          },
        },
        resolve: async (
          root: any,
          params: any,
          options: any,
          fieldASTs: any,
        ) => {
          const query: Query = utils.object.reduce(
            params.query || {},
            (query, value, key) => query.where(key, value),
            this,
          );

          return await query.delete();
        },
      },
    };

    if (this.softDelete)
      mutations[`restore_${multiple}`] = {
        type: GraphQLBase.GraphQLInt,
        args: {
          query: {
            type: queryInputType,
          },
        },
        resolve: async (
          root: any,
          params: any,
          options: any,
          fieldASTs: any,
        ) => {
          const query: Query = utils.object.reduce(
            params.query,
            (query, value, key) => query.where(key, value),
            this.withTrashed(),
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
