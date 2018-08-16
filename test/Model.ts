import Odin from "../src";
import * as utils from "../src/utils";

declare global {
  namespace NodeJS {
    interface Global {
      __MONGO_DB_NAME__: string;
      __MONGO_CONNECTION__: any;
    }
  }
}

const TABLE = "users";
const ITEMS = [
  {
    username: "ardalanamini",
    email: "ardalanamini22@gmail.com",
    name: {
      first: "Ardalan",
      last: "Amini",
    },
  },
];

beforeAll((done) => {
  Odin.connections({
    default: {
      driver: "MongoDB",
      database: global.__MONGO_DB_NAME__,
      connection: global.__MONGO_CONNECTION__,
    },
  });

  Odin.DB.table(TABLE).insert(ITEMS, (err) => {
    if (err) throw err;

    Odin.DB.table(TABLE).get((err, items) => {
      if (err) throw err;

      ITEMS.length = 0;

      ITEMS.push(...items);

      done();
    });
  });
});

afterEach((done) => {
  Odin.DB.table(TABLE).delete((err) => {
    if (err) throw err;

    Odin.DB.table(TABLE).insert(ITEMS, (err) => {
      if (err) throw err;

      done();
    });
  });
});

class User extends Odin {
  static schema = {
    username: Odin.Types.String.alphanum.required,
    email: Odin.Types.String.email.required,
    name: {
      first: Odin.Types.String.required,
      last: Odin.Types.String,
    },
  };
}

describe("Testing Model", () => {
  test("Model.create (async/await style)", async () => {
    expect.assertions(2);

    const item = utils.object.omit(ITEMS[0], ["id"]);

    const result = await User.create(item);

    expect(result).toBeInstanceOf(Odin);

    expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(item);
  });

  test("Model.create (callback style)", (done) => {
    const item = utils.object.omit(ITEMS[0], ["id"]);

    User.create(item, (err, res) => {
      expect(err).toBe(null);
      expect(res).toBeInstanceOf(Odin);
      expect(utils.object.omit(res.toJSON(), ["id", "created_at"])).toEqual(item);

      done();
    });
  });
});
