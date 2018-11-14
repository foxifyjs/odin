import * as Odin from "../src";
import Model from "../src/Model";
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
  {
    username: "john",
    email: "johndue@example.com",
    name: {
      first: "John",
      last: "Due",
    },
  },
];

Odin.connections({
  default: {
    driver: "MongoDB",
    database: global.__MONGO_DB_NAME__,
    connection: global.__MONGO_CONNECTION__,
  },
});

beforeAll((done) => {
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

afterAll((done) => {
  Odin.DB.table(TABLE).delete((err) => {
    if (err) throw err;

    done();
  });
});

class User extends Odin {
  public static schema = {
    username: User.Types.String.alphanum.min(3).required,
    email: User.Types.String.email.required,
    name: {
      first: User.Types.String.min(3).required,
      last: User.Types.String.min(3),
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

  test("Model.insert (async/await style)", async () => {
    expect.assertions(1);

    const items = ITEMS.map((item: any) => utils.object.omit(item, ["id"]));

    const result = await User.insert(items);

    expect(result).toBe(items.length);
  });

  test("Model.insert (callback style)", (done) => {
    const items = ITEMS.map((item: any) => utils.object.omit(item, ["id"]));

    User.insert(items, (err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(items.length);

      done();
    });
  });

  test("Model.on 'create'", async () => {
    expect.assertions(3);

    User.on("created", (result) => {
      expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(item);
    });

    const item = utils.object.omit(ITEMS[0], ["id"]);

    const result = await User.create(item);

    expect(result).toBeInstanceOf(Odin);

    expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(item);
  });
});
