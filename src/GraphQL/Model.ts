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
        } else {
            // Object
            const schema = _schema(model, type);

            fields[key] = {
                type: new Base.GraphQLObjectType({
                    name: `${model}_${key}`,
                    fields: schema.fields,
                }),
            };

            args[key] = {
                type: new Base.GraphQLInputObjectType({
                    name: `${model}_${key}_input`,
                    fields: schema.args,
                }),
            };
        }
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

const _prepare = (item: Model) => item.toJson();

module GraphQL {
    export interface Schema {
        [key: string]: {
            type: Base.GraphQLOutputType,
        };
    }
}

class GraphQL {
    private static _table: string;

    static toGraphQL(): any {
        const name = this.name;

        const multiple = this._table;
        const single = utils.string.singularize(multiple);

        const schema = _schema(name, (this as any).schema);
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
                    utils.object.map(params, (value, key) => {
                        query = query.where(key as string, value);
                    });

                    return _prepare(await (query as Query).first(projection));
                },
            },
            [multiple]: {
                type: new Base.GraphQLList(type),
                args,
                resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
                    const projection = _projection(fieldASTs.fieldNodes[0]);

                    let query = (this as any) as ModelConstructor | Query;
                    utils.object.map(params, (value, key) => {
                        query = query.where(key as string, value);
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
            [`insert_${single}`]: {
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
                    utils.object.map(params.query, (value, key) => {
                        query = query.where(key as string, value);
                    });

                    return await (query as Query).update(params.data);
                },
            },
            [`delete_${multiple}`]: {
                type: Base.GraphQLInt,
                args: {
                    data: {
                        type: new Base.GraphQLNonNull(inputType),
                    },
                },
                resolve: async (root: any, params: any, options: any, fieldASTs: any) => {
                    let query = (this as any) as ModelConstructor | Query;
                    utils.object.map(params.data, (value, key) => {
                        query = query.where(key as string, value);
                    });

                    return await (query as Query).delete();
                },
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
