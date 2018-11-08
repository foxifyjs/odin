import * as Odin from ".";
import { Base as Driver } from "./drivers";

const MODELS: { [name: string]: typeof Odin | undefined } = {};

interface Base<T extends object = {}> {
  [key: string]: any;

  id?: Driver.Id;
}

class Base {
  protected get _isNew() {
    return !this.attributes.id;
  }

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
}

export default Base;
