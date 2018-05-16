import * as Base from "graphql";
import Model from "../index";
import TypeAny from "../types/Any";

module GraphQL {
    export interface Queries {
        [query: string]: any;
    }
}

type GraphQL = (...models: Model[]) => Base.GraphQLSchema;

const GraphQL: GraphQL = (...models) => {
    const queries: GraphQL.Queries = {};
    const mutations: GraphQL.Queries = {};

    models.map((Model) => {
        const gql = Model.toGraphQL();

        Object.assign(queries, gql.queries);

        Object.assign(mutations, gql.mutations);
    });

    return new Base.GraphQLSchema({
        query: new Base.GraphQLObjectType({
            name: "Query",
            fields: queries,
        }),
        mutation: new Base.GraphQLObjectType({
            name: "Mutation",
            fields: mutations,
        }),
    });
};

export default GraphQL;
