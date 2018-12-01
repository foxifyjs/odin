import * as Odin from "../src";
import * as utils from "../src/utils";

declare global {
  namespace NodeJS {
    interface Global {
      __MONGO_DB_NAME__: string;
      __MONGO_CONNECTION__: any;
    }
  }
}

const COLLECTION = "users";
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

Odin.Connect({
  default: {
    database: global.__MONGO_DB_NAME__,
    connection: global.__MONGO_CONNECTION__,
  },
});

beforeAll((done) => {
  Odin.DB.collection(COLLECTION).insert(ITEMS, (err) => {
    if (err) throw err;

    Odin.DB.collection(COLLECTION).get((err, items) => {
      if (err) throw err;

      ITEMS.length = 0;

      ITEMS.push(...items);

      done();
    });
  });
});

afterEach((done) => {
  Odin.DB.collection(COLLECTION).delete((err) => {
    if (err) throw err;

    Odin.DB.collection(COLLECTION).insert(ITEMS, (err) => {
      if (err) throw err;

      done();
    });
  });
});

afterAll((done) => {
  Odin.DB.collection(COLLECTION).delete((err) => {
    if (err) throw err;

    done();
  });
});

interface Schema {
  username: string;
  email: string;
  name: {
    first: string;
    last: string;
  };
}

@Odin.register
class User extends Odin<Schema> {
  public static schema = {
    username: User.Types.string.alphanum.min(3).required,
    email: User.Types.string.email.required,
    name: {
      first: User.Types.string.min(3).required,
      last: User.Types.string.min(3),
    },
  };
}

describe("Testing Model", () => {
  test("model.save (async/await style)", async () => {
    expect.assertions(2);

    const item = utils.object.omit(ITEMS[0], ["id"]);

    const user = new User(item);

    const result = await user.save();

    expect(result).toBeInstanceOf(User);
    expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(item);
  });

  test("model.save (callback style)", (done) => {
    expect.assertions(3);

    const item = utils.object.omit(ITEMS[0], ["id"]);

    const user = new User(item);

    user.save((err, res) => {
      expect(err).toBe(null);
      expect(res).toBeInstanceOf(User);
      expect(utils.object.omit(res.toJSON(), ["id", "created_at"])).toEqual(item);

      done();
    });
  });

  test("Model.insert (async/await style)", async () => {
    expect.assertions(1);

    const result = await User.insert(ITEMS.map(item => utils.object.omit(item, ["id"])));

    expect(result).toBe(ITEMS.length);
  });

  test("Model.insert (callback style)", (done) => {
    expect.assertions(2);

    User.insert(ITEMS.map(item => utils.object.omit(item, ["id"])), (err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(ITEMS.length);

      done();
    });
  });

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
    expect.assertions(4);

    const item = utils.object.omit(ITEMS[0], ["id"]);

    User.on("create", (result) => {
      expect(result).toBeInstanceOf(User);
      expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(item);
    });

    const result = await User.create(item);

    expect(result).toBeInstanceOf(Odin);

    expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(item);
  });
});
