import * as Odin from ".";
import * as DB from "./DB";
import HasOne from "./Relation/HasOne";
import MorphOne from "./Relation/MorphOne";
import Types from "./types";
import { array, makeCollectionName, object } from "./utils";

const MODELS: { [name: string]: typeof Odin | undefined } = {};
const JSON_SCHEMA_DEFINITIONS: { [key: string]: any } = {};

interface Base<T extends object = {}> {
  constructor: typeof Odin;

  id?: DB.Id;

  [key: string]: any;
}

class Base<T extends object = {}> {
  protected static _relations: string[] = [];

  public static connection: Odin.Connection = "default";

  public static collection?: string;

  public static schema: Odin.Schema = {};

  public static timestamps: boolean = true;

  public static softDelete: boolean = false;

  public static CREATED_AT = "created_at";
  public static UPDATED_AT = "updated_at";
  public static DELETED_AT = "deleted_at";

  public static hidden: string[] = [];

  protected static get _collection() {
    return this.collection || makeCollectionName(this.name);
  }

  protected static get _schema() {
    const schema: Odin.Schema = {
      id: Types.id,
      ...this.schema,
    };

    if (this.timestamps) {
      schema[this.CREATED_AT] = Types.date.default(() => new Date());
      schema[this.UPDATED_AT] = Types.date;
    }

    if (this.softDelete)
      schema[this.DELETED_AT] = Types.date;

    return schema;
  }

  protected _original: Odin.Document = {};
  // protected _original: Odin.Document & Partial<T> = {};

  public relations: { [key: string]: any } = {};

  public attributes: Odin.Document = {};
  // public attributes: Odin.Document & Partial<T> = {};

  protected get _isNew() {
    return !this._original.id;
  }

  public static get models() {
    return MODELS;
  }

  public static register = (...models: Array<typeof Odin>) => {
    models.forEach((model) => {
      if (MODELS[model.name]) throw new Error(`Model "${model.name}" already exists`);

      MODELS[model.name] = model;
    });
  }

  public static relation = (target: any, relation: string, descriptor: any) => {
    target.constructor._relations = target.constructor._relations.concat([relation]);
  }

  public static initializeJsonSchema = () => {
    object.forEach(MODELS, (model) => {
      JSON_SCHEMA_DEFINITIONS[model.name] = model.toJsonSchema(false);
    });
  }

  public static toJsonSchema(definitions = true) {
    if (definitions) return {
      definitions: JSON_SCHEMA_DEFINITIONS,
      ref: {
        $ref: `#/definitions/${this.name}`,
      },
    };

    const hidden = this.hidden;

    const jsonSchemaGenerator = (schema: Odin.Schema, ancestors: string[] = []) => {
      const properties: { [key: string]: any } = {};
      const required: string[] = [];

      for (const key in schema) {
        const hide = ancestors.concat([key]).join(".");

        if (hidden.includes(hide)) continue;

        const type = schema[key];

        if (Types.isType(type)) {
          // Type

          let schemaType: string = (type as any).constructor.type.toLowerCase();

          if (
            (type.constructor as any).type === "ObjectId"
            || (type.constructor as any).type === "Date"
          ) schemaType = "string";

          properties[key] = {
            type: schemaType,
          };

          if ((type.constructor as any).type === "Array") {
            let ofSchemaType: string = (type as any)._of.constructor.type.toLowerCase();

            if (
              ofSchemaType === "objectid"
              || ofSchemaType === "date"
            ) ofSchemaType = "string";

            properties[key].items = {
              type: ofSchemaType,
            };
          }

          if ((type as any)._required) required.push(key);

          continue;
        }

        // Object

        const generated = jsonSchemaGenerator(type, ancestors.concat([key]));

        if (object.size(generated.properties) === 0) {
          properties[key] = {
            type: "object",
          };

          continue;
        }

        properties[key] = generated;

        if (generated.required.length) required.push(key);
      }

      return {
        properties,
        required,
        type: "object",
      };
    };

    const jsonSchema = jsonSchemaGenerator(this._schema);

    array.prepend(jsonSchema.required, "id");

    if (this.timestamps) {
      jsonSchema.properties[this.CREATED_AT] = {
        type: "string",
      };

      jsonSchema.properties[this.UPDATED_AT] = {
        type: "string",
      };

      jsonSchema.required.push(this.CREATED_AT);
    }

    if (this.softDelete) jsonSchema.properties[this.DELETED_AT] = {
      type: "string",
    };

    this._relations.forEach((relation) => {
      const proto = this.prototype[relation].call(this.prototype);

      if (proto instanceof HasOne || proto instanceof MorphOne) {
        jsonSchema.properties[relation] = {
          $ref: `#/definitions/${proto.relation.name}`,
        };

        return;
      }

      jsonSchema.properties[relation] = {
        type: "array",
        items: {
          $ref: `#/definitions/${proto.relation.name}`,
        },
      };
    });

    return jsonSchema;
  }
}

export default Base;
