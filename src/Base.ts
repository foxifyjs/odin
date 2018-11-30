import * as Odin from ".";
import * as DB from "./DB";

const MODELS: { [name: string]: typeof Odin | undefined } = {};

interface Base<T extends object = {}> {
  constructor: typeof Odin;

  id?: DB.Id;

  [key: string]: any;
}

class Base<T extends object = {}> {
  public static _relations: string[] = [];

  protected _original: Odin.Document & Partial<T> = {};

  public attributes: Odin.Document & Partial<T> = {};

  protected get _isNew() {
    return !this._original.id;
  }

  public static get models() {
    return MODELS;
  }

  public static isOdin = (arg: any): arg is Odin => arg instanceof Odin;

  public static register = (...models: Array<typeof Odin>) => {
    models.forEach((model) => {
      if (MODELS[model.name]) throw new Error(`Model "${model.name}" already exists`);

      MODELS[model.name] = model;
    });
  }

  public static relation = (target: any, relation: string) => {
    target.constructor._relations = target.constructor._relations.concat([relation]);
  }
}

export default Base;
