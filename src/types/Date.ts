import TypeAny from "./Any";
import * as utils from "../utils";

class TypeDate extends TypeAny {
  protected _type = "Date";

  protected _base(v: any) {
    if (utils.date.isInstance(v)) return null;

    return "Must be a date";
  }

  min(d: Date) {
    return this._test((v: Date) => v < d ? `Must be at least ${d}` : null);
  }

  max(d: Date) {
    return this._test((v: Date) => v > d ? `Must be at most ${d}` : null);
  }
}

export default TypeDate;
