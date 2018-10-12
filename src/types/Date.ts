import * as utils from "../utils";
import TypeAny from "./Any";

class TypeDate extends TypeAny {
  protected _type = "Date";

  protected _base(v: any) {
    if (utils.date.isDate(v)) return null;

    return "Must be a date";
  }

  public min(d: Date) {
    return this._test((v: Date) => v < d ? `Must be at least ${d}` : null);
  }

  public max(d: Date) {
    return this._test((v: Date) => v > d ? `Must be at most ${d}` : null);
  }
}

export default TypeDate;
