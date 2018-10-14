import * as Odin from ".";
import { Base as Driver } from "./drivers";

interface Base<T= any> {
  new(document?: Odin.Document): Odin<T>;

  constructor: typeof Odin;

  readonly name: string;

  id?: Driver.Id;
}

class Base<T= any> {
  public static isOdin = (arg: any): arg is Odin => arg instanceof Odin;
}

export default Base;
