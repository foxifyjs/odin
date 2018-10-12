import { number } from "../utils";
import TypeAny from "./Any";

class TypeNumber extends TypeAny {
  protected _type = "Number";

  protected _base(v: any) {
    if (number.isNumber(v)) return null;

    return "Must be a number";
  }

  get integer() {
    return this._test((v: number) => !Number.isInteger(v) ? `Must be an integer` : null);
  }

  get positive() {
    return this._test((v: number) => v < 0 ? `Must be a positive number` : null);
  }

  get negative() {
    return this._test((v: number) => v > 0 ? `Must be a negative number` : null);
  }

  public min(n: number) {
    if (!number.isNumber(n)) throw new TypeError("'n' must be a number");

    return this._test((v: number) => v < n ? `Must be at least ${n}` : null);
  }

  public max(n: number) {
    if (!number.isNumber(n)) throw new TypeError("'n' must be a number");

    return this._test((v: number) => v > n ? `Must be at most ${n}` : null);
  }

  public precision(n: number) {
    if (!number.isNumber(n)) throw new TypeError("'n' must be a number");

    return this._test((v: number) => `${v}`.split(".")[1].length < n ?
      `Must be have at most ${n} decimal places` : null);
  }

  public multiple(n: number) {
    if (!number.isNumber(n)) throw new TypeError("'n' must be a number");

    if (n < 0) throw new TypeError("'n' must be a positive number");

    return this._test((v: number) => v % n !== 0 ? `Must be a multiple of ${n}` : null);
  }
}

export default TypeNumber;
