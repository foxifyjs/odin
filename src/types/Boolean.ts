import * as utils from "../utils";
import TypeAny from "./Any";

class TypeBoolean extends TypeAny {
  protected _type = "Boolean";

  protected _base(v: any) {
    if (utils.boolean.isBoolean(v)) return null;

    return "Must be a boolean";
  }
}

export default TypeBoolean;
