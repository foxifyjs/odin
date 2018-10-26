import * as Odin from ".";
import { Base as Driver } from "./drivers";

const MODELS: { [name: string]: typeof Odin | undefined } = {};

interface Base<T= any> {
  new(document?: Odin.Document): Odin<T>;

  constructor: typeof Odin;

  id?: Driver.Id;
}

class Base<T= any> {
  protected _isNew: boolean = false;

  static get models() {
    return MODELS;
  }

  public static isOdin = (arg: any): arg is Odin => arg instanceof Odin;

  public static register = (...models: Array<typeof Odin>) => {
    models.forEach((model) => {
      if (MODELS[model.name]) throw new Error(`Model "${model.name}" already exists`);

      MODELS[model.name] = model;
    });
  }

  constructor(document: Odin.Document = {}) {
    if (!document.id) this._isNew = true;
  }
}

export default Base;
