import { Driver } from "../connections";
import TypeArray from "./Array";
import TypeBoolean from "./Boolean";
import TypeDate from "./Date";
import TypeNumber from "./Number";
import TypeObject from "./Object";
import TypeObjectId from "./ObjectId";
import TypeString from "./String";

declare module Type { }

class Type {
  constructor(protected _driver: Driver) { }

  get Array() {
    return new TypeArray();
  }

  get Boolean() {
    return new TypeBoolean();
  }

  get Date() {
    return new TypeDate();
  }

  get Number() {
    return new TypeNumber();
  }

  get Object() {
    return new TypeObject();
  }

  get Id() {
    return new TypeObjectId();
  }

  get String() {
    return new TypeString();
  }
}

export = Type;
