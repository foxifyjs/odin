import TypeAny from "./Any";
import * as utils from "../utils";

class TypeBoolean extends TypeAny {
  protected _type = "Boolean";

  protected _base(v: any) {
    if (utils.boolean.isInstance(v)) return null;

    return "Must be a boolean";
  }
}

export default TypeBoolean;
