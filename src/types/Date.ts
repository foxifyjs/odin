import * as utils from "../utils";
import TypeAny from "./Any";

class TypeDate extends TypeAny {
  protected _type = "Date";

  protected _base(v: any) {
    if (utils.date.isDate(v)) return null;

    return "Must be a date";
  }

  public min(date: Date | (() => Date)) {
    if (utils.date.isDate(date)) date = () => date as Date;

    return this._test((v: Date) => v < (date as (() => Date))()
      ? `Must be at least ${date}`
      : null);
  }

  public max(date: Date | (() => Date)) {
    if (utils.date.isDate(date)) date = () => date as Date;

    return this._test((v: Date) => v > (date as (() => Date))()
      ? `Must be at most ${date}`
      : null);
  }
}

export default TypeDate;
