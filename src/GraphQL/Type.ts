import * as Base from "graphql";
import { GraphQLDateTime } from "graphql-iso-date";

class Type {
  toGraphQL(model: string, key: string) {
    let field: Base.GraphQLType | undefined;
    let arg: Base.GraphQLInputType | undefined;

    switch ((this as any)._type) {
      case "Array":
        const gql = (this as any).ofType.toGraphQL(model, key);

        field = new Base.GraphQLList(gql.field);
        arg = new Base.GraphQLList(gql.arg);

        break;
      case "Boolean":
        field = Base.GraphQLBoolean;
        arg = Base.GraphQLBoolean;

        break;
      case "Number":
        field = Base.GraphQLInt;
        arg = Base.GraphQLInt;

        break;
      case "Object":
        field = new Base.GraphQLObjectType({
          name: `${model}_${key}`,
          fields: {},
        });
        arg = new Base.GraphQLInputObjectType({
          name: `${model}_${key}_input`,
          fields: {},
        });

        break;
      case "ObjectId":
        field = Base.GraphQLID;
        arg = Base.GraphQLID;

        break;
      case "String":
        field = Base.GraphQLString;
        arg = Base.GraphQLString;

        break;
      case "Date":
        field = GraphQLDateTime;
        arg = GraphQLDateTime;

        break;
    }

    return {
      field,
      arg,
    };
  }
}

export default Type;
