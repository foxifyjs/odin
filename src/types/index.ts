import * as Schema from "@foxify/schema";
import AnyType from "@foxify/schema/dist/Any";
import ArrayType from "@foxify/schema/dist/Array";
import ObjectType from "@foxify/schema/dist/Object";
import * as Base from "graphql";
import { GraphQLDateTime } from "graphql-iso-date";
import { object, string } from "../utils";
import IdType from "./Id";

const { forEach } = object;
const { isEmpty } = string;

/******************** Array ********************/

const ArrayTypeOf = ArrayType.prototype.of;
ArrayType.prototype.of = function of(type) {
  (this as any)._of = type;

  return ArrayTypeOf.call(this, type);
};

/******************** Object ********************/

const ObjectTypeKeys = ObjectType.prototype.keys;
ObjectType.prototype.keys = function keys(obj) {
  (this as any)._keys = obj;

  return ObjectTypeKeys.call(this, obj);
};

/******************** GraphQL ********************/

(AnyType.prototype as any).toGraphQL = function toGraphQL(model: string, key: string = "") {
  let field: Base.GraphQLType | undefined;
  let arg: Base.GraphQLInputType | undefined;

  switch (this.constructor.type) {
    case "Array":
      const gql = this._of.toGraphQL(model, key);

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
      const fields: any = {};
      const args: any = {};

      forEach(this._keys, (value, subKey) => {
        const gql = value.toGraphQL(model, `${key}_${subKey}`);

        fields[subKey] = gql.field;
        args[subKey] = gql.arg;
      });

      field = new Base.GraphQLObjectType({
        fields,
        name: isEmpty(key) ? model : `${model}_${key}`,
      });
      arg = new Base.GraphQLInputObjectType({
        name: isEmpty(key) ? `${model}_input` : `${model}_${key}_input`,
        fields: args,
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
};

export default {
  get array() {
    return Schema.array;
  },

  get boolean() {
    return Schema.boolean;
  },

  get date() {
    return Schema.date;
  },

  get id() {
    return new IdType();
  },

  get number() {
    return Schema.number;
  },

  get object() {
    return Schema.object;
  },

  get string() {
    return Schema.string;
  },

  // Helpers
  isType: (arg: any): arg is AnyType => arg instanceof AnyType,
};
