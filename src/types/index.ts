import TypeArray from "./Array";
import TypeBoolean from "./Boolean";
import TypeDate from "./Date";
import TypeNumber from "./Number";
import TypeObject from "./Object";
import TypeObjectId from "./ObjectId";
import TypeString from "./String";

declare module Type { }

class Type {
  public static get array() {
    return new TypeArray();
  }

  public static get boolean() {
    return new TypeBoolean();
  }

  public static get date() {
    return new TypeDate();
  }

  public static get number() {
    return new TypeNumber();
  }

  public static get object() {
    return new TypeObject();
  }

  public static get id() {
    return new TypeObjectId();
  }

  public static get string() {
    return new TypeString();
  }
}

export = Type;
