import * as Base from "graphql";

class Type {
  toGraphQL(model: string, key: string) {
    let field: Base.GraphQLType | undefined;
    let arg: Base.GraphQLInputType | undefined;

    let typer = (type: Base.GraphQLType) => type;
    if ((this as any)._required) typer = (type: Base.GraphQLType) => new Base.GraphQLNonNull(type);

    switch ((this as any)._type) {
      case "Array":
        const gql = (this as any).ofType.toGraphQL(model, key);

        field = typer(new Base.GraphQLList(gql.field));
        arg = new Base.GraphQLList(gql.arg);

        break;
      case "Boolean":
        field = typer(Base.GraphQLBoolean);
        arg = Base.GraphQLBoolean;

        break;
      case "Number":
        field = typer(Base.GraphQLInt);
        arg = Base.GraphQLInt;

        break;
      case "Object":
        field = typer(new Base.GraphQLObjectType({
          name: `${model}_${key}`,
          fields: {},
        }));
        arg = new Base.GraphQLInputObjectType({
          name: `${model}_${key}_input`,
          fields: {},
        });

        break;
      case "ObjectId":
        field = typer(Base.GraphQLID);
        arg = Base.GraphQLID;

        break;
      case "String":
        field = typer(Base.GraphQLString);
        arg = Base.GraphQLString;

        break;
    }

    return {
      field,
      arg,
    };
  }
}

export default Type;
