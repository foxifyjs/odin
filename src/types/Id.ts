import AnyType from "@foxify/schema/dist/Any";
import { ObjectId } from "mongodb";

class IdType extends AnyType {
  protected static type = "ObjectId";

  protected _base(v: any) {
    if (ObjectId.isValid(v)) return null;

    return "Must be a valid object id";
  }
}

export default IdType;
