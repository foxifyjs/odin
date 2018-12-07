import { MongoCallback, MongoError } from "mongodb";
import { Callback } from "./DB";

export const safeExec = (base: any, method: string, args: any[], callback?: Callback<any>) => {
  args = args.filter(a => a !== undefined);

  if (callback) {
    const cb: MongoCallback<any> = (err, res) => {
      if (err) return callback(new OdinError(err), res);

      callback(err, res);
    };

    return base[method].apply(base, args.concat([cb]));
  }

  return new Promise(async (resolve, reject) => {
    try {
      resolve(await base[method].apply(base, args));
    } catch (err) {
      reject(new OdinError(err));
    }
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
