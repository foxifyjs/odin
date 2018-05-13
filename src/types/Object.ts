import TypeAny from "./Any";
import * as utils from "../utils";

class TypeObject extends TypeAny {
  protected _type = "Object";

  protected _base(v: any) {
    if (utils.object.isInstance(v)) return null;

    return "Must be a object";
  }
}

export default TypeObject;
