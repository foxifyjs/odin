import * as utils from "../utils";
import TypeAny from "./Any";

class TypeObject extends TypeAny {
  protected _type = "Object";

  protected _base(v: any) {
    if (utils.object.isObject(v)) return null;

    return "Must be a object";
  }
}

export default TypeObject;
