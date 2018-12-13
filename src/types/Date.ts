import * as utils from "../utils";
import TypeAny from "./Any";

class TypeDate extends TypeAny {
  protected _type = "Date";

  protected _base(v: any) {
    if (utils.string.isString(v) || utils.number.isNumber(v)) v = new Date(v);

    if (utils.date.isDate(v) && v.toString() !== "Invalid Date") return null;

    return "Must be a valid date";
  }

  public min(date: Date | number | string | (() => (Date | number | string))) {
    if (utils.date.isDate(date)) date = () => date as Date;

    return this._test((v: Date) => v < (date as (() => Date))()
      ? `Must be at least ${date}`
      : null);
  }

  public max(date: Date | number | string | (() => (Date | number | string))) {
    if (utils.date.isDate(date)) date = () => date as Date;

    return this._test((v: Date) => v > (date as (() => Date))()
      ? `Must be at most ${date}`
      : null);
  }
}

export default TypeDate;
