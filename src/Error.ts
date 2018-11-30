import { MongoError } from "mongodb";

class OdinError extends Error {
  public code: number;

  constructor(mongoError: MongoError) {
    super(mongoError.message);

    switch (mongoError.code) {
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
