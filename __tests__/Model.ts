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

beforeAll(async () => {
  await Odin.DB.collection(COLLECTION).insert(ITEMS);

  const items = await Odin.DB.collection(COLLECTION).get();

  ITEMS.length = 0;

  ITEMS.push(...items);
});

afterEach(async () => {
  await Odin.DB.collection(COLLECTION).delete();

  await Odin.DB.collection(COLLECTION).insert(ITEMS);
});

afterAll(async () => {
  await Odin.DB.collection(COLLECTION).delete();
});

interface Schema extends Record<string, any> {
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

  public static softDelete = true;
}

test("model.iterate", async () => {
  expect.assertions(ITEMS.length * 2);

  let index = 0;

  for await (const item of User.iterate()) {
    expect(item).toBeInstanceOf(User);
    expect((item as any).toJSON()).toEqual(ITEMS[index++]);
  }
});

test("model.save", async () => {
  expect.assertions(2);

  const item = utils.object.omit(ITEMS[0], ["id"]);

  const user = new User(item);

  const result = await user.save();

  expect(result).toBeInstanceOf(User);
  expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(
    item,
  );
});

test("Model.insert", async () => {
  expect.assertions(1);

  const result = await User.insert(
    ITEMS.map((item) => utils.object.omit(item, ["id"])),
  );

  expect(result).toBe(ITEMS.length);
});

test("Model.create", async () => {
  expect.assertions(2);

  const item = utils.object.omit(ITEMS[0], ["id"]) as Record<string, unknown>;

  const result = await User.create(item);

  expect(result).toBeInstanceOf(Odin);

  expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(
    item,
  );
});

test("Model.insert", async () => {
  expect.assertions(1);

  const items = ITEMS.map((item: any) => utils.object.omit(item, ["id"]));

  const result = await User.insert(items);

  expect(result).toBe(items.length);
});

test("Model.on('create')", async () => {
  expect.assertions(4);

  const item = utils.object.omit(ITEMS[0], ["id"]) as Record<string, unknown>;

  User.on("create", (result) => {
    expect(result).toBeInstanceOf(User);
    expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(
      item,
    );

    User.removeAllListeners("create");
  });

  const result = await User.create(item);

  expect(result).toBeInstanceOf(Odin);
  expect(utils.object.omit(result.toJSON(), ["id", "created_at"])).toEqual(
    item,
  );
});

// __tests__("Model.on('update')", async () => {
//   expect.assertions(3);

//   const item = ITEMS[0];

//   User.on("update", (result) => {
//     expect(result).toBeInstanceOf(User);
//     expect(utils.object.omit(result.toJSON(), ["created_at", "updated_at"]))
//       .toEqual({ ...item, username: "updated" });

//     User.removeAllListeners("update");
//   });

//   const result = await User.where("id", (item as any).id).update({ username: "updated" });

//   expect(result).toBe(1);
// });

// __tests__("Model.on('delete') [soft]", async () => {
//   expect.assertions(3);

//   const item = ITEMS[0];

//   User.on("delete", (result) => {
//     expect(result).toBeInstanceOf(User);
//     expect(utils.object.omit(result.toJSON(), ["created_at", "deleted_at"]))
//       .toEqual(item);

//     User.removeAllListeners("delete");
//   });

//   const result = await User.where("id", (item as any).id).delete();

//   expect(result).toBe(1);
// });

// __tests__("Model.on('delete') [force]", async () => {
//   expect.assertions(3);

//   const item = ITEMS[0];

//   User.on("delete", (result) => {
//     expect(result).toBeInstanceOf(User);
//     expect(utils.object.omit(result.toJSON(), ["created_at"]))
//       .toEqual(item);

//     User.removeAllListeners("delete");
//   });

//   const result = await User.where("id", (item as any).id).delete(true);

//   expect(result).toBe(1);
// });

// __tests__("Model.on('restore')", async () => {
//   expect.assertions(4);

//   const item = ITEMS[0];

//   User.on("restore", (result) => {
//     expect(result).toBeInstanceOf(User);
//     expect(utils.object.omit(result.toJSON(), ["created_at", "updated_at"]))
//       .toEqual(item);

//     User.removeAllListeners("restore");
//   });

//   const result1 = await User.where("id", (item as any).id).delete();

//   expect(result1).toBe(1);

//   const result2 = await User.where("id", (item as any).id).restore();

//   expect(result2).toBe(1);
// });
