import { MongoCallback, MongoError } from "mongodb";
import { Callback } from "./DB";

export const safeExec = (
  base: any, method: string, args: any[], callback?: Callback<any>, listener: (res: any) => void = () => { }
) => {
  args = args.filter(a => a !== undefined);

  if (callback) {
    const cb: MongoCallback<any> = (err, res) => {
      if (err) return callback(new OdinError(err), res);

      try {
        listener(res);
      } catch (error) {
        console.warn(error);
      }

      callback(err, res);
    };

    return base[method].apply(base, args.concat([cb]));
  }

  return base[method].apply(base, args)
    .then((res: any) => {
      try {
        listener(res);
      } catch (error) {
        console.warn(error);
      }

      return res;
    })
    .catch((err: any) => {
      throw new OdinError(err);
    });
};

class OdinError extends Error {
  public static isOdinError = (arg: any): arg is OdinError => arg instanceof OdinError;

  public mongodb?: { message: string, code?: number };

  public code: number;

  constructor(error: TypeError | MongoError | OdinError) {
    super(error.message);

    this.stack = error.stack;

    if (OdinError.isOdinError(error)) {
      this.code = error.code;

      this.mongodb = error.mongodb;

      return this;
    }

    if (error instanceof TypeError) {
      this.code = 500;

      return this;
    }

    this.mongodb = {
      message: error.message,
      code: error.code,
    };

    switch (error.code) {
      case 2:
      case 3:
      case 4:
      case 12:
      case 14:
      case 15:
      case 16:
        this.code = 422;
        break;
      default:
        this.code = 500;
    }
  }
}

export default OdinError;
