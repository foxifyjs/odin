import { ObjectId } from "mongodb";
import TypeAny from "./Any";

class TypeObjectId extends TypeAny {
  protected _type = "ObjectId";

  protected _base(v: any) {
    if (ObjectId.isValid(v)) return null;

    return "Must be an object id";
  }
}

export default TypeObjectId;
