import { Connect, DB } from "../src";
import * as utils from "../src/utils";

declare global {
  namespace NodeJS {
    interface Global {
      __MONGO_DB_NAME__: string;
      __MONGO_CONNECTION__: any;
    }
  }
}

interface ItemSchema extends Record<string, unknown> {
  name: string | null;
  style: string;
  num: number;
}

const COLLECTION = "users";
const ITEMS: ItemSchema[] = [
  {
    name: "foo",
    style: "async",
    num: 10,
  },
  {
    name: "bar",
    style: "callback",
    num: 15,
  },
  {
    name: "bar",
    style: "async",
    num: 12,
  },
  {
    name: null,
    style: "async",
    num: 5,
  },
  {
    name: null,
    style: "callback",
    num: 55,
  },
  {
    name: "bar",
    style: "callback",
    num: 22,
  },
];

const JOIN_COLLECTION = "bills";
const JOIN_ITEMS = [
  {
    for_name: "foo",
    bill: 200,
  },
  {
    for_name: "bar",
    bill: 452,
  },
  {
    for_name: "bar",
    bill: 706,
  },
];

beforeAll(async () => {
  Connect({
    default: {
      database: global.__MONGO_DB_NAME__,
      connection: global.__MONGO_CONNECTION__,
    },
  });

  await DB.collection(COLLECTION).insert(ITEMS);

  const items = await DB.collection(COLLECTION).get();

  ITEMS.length = 0;

  ITEMS.push(...items);
});

afterEach(async () => {
  await DB.collection(COLLECTION).delete();

  await DB.collection(COLLECTION).insert(ITEMS);
});

afterAll(async () => {
  await DB.collection(COLLECTION).delete();

  await DB.collection(JOIN_COLLECTION).delete();
});

test("db.insert one", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).insert(
    utils.object.omit(ITEMS[0], ["id"]),
  );

  expect(result).toBe(1);
});

test("db.insert many", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).insert(
    ITEMS.map((item: any) => utils.object.omit(item, ["id"])),
  );

  expect(result).toBe(ITEMS.length);
});

test("db.value", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).value("name");

  expect(result).toEqual(ITEMS.map(({ name }) => name || undefined));
});

test("db.iterate", async () => {
  expect.assertions(ITEMS.length * 2);

  let index = 0;

  for await (const item of DB.collection(COLLECTION).iterate())
    expect(item).toEqual(ITEMS[index++]);

  index = 0;

  for await (const item of DB.collection(COLLECTION).iterate(["name"]))
    expect(item).toEqual({ name: ITEMS[index++].name });
});

test("db.get", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).get();

  expect(result).toEqual(ITEMS);
});

test("db.first", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).first();

  expect(result).toEqual(ITEMS[0]);
});

test("db.where [simple]", async () => {
  const res = await DB.collection<ItemSchema>(COLLECTION)
    .where("name", "foo")
    .get();

  expect(res).toEqual(ITEMS.filter(({ name }) => name === "foo"));
});

test("db.where [complex]", async () => {
  const res = await DB.collection<ItemSchema>(COLLECTION)
    .where((q) => q.where("name", "foo"))
    .get();

  expect(res).toEqual(ITEMS.filter(({ name }) => name === "foo"));
});

test("db.orWhere [simple]", async () => {
  const res = await DB.collection(COLLECTION)
    .where("name", "foo")
    .orWhere("style", "async")
    .get();

  expect(res).toEqual(
    ITEMS.filter(({ name, style }) => name === "foo" || style === "async"),
  );
});

test("db.orWhere [complex]", async () => {
  const res = await DB.collection(COLLECTION)
    .where((q) => q.where("name", "foo"))
    .orWhere((q) => q.where("style", "async"))
    .get();

  expect(res).toEqual(
    ITEMS.filter(({ name, style }) => name === "foo" || style === "async"),
  );
});

test("db.whereLike", async () => {
  const res = await DB.collection(COLLECTION).whereLike("name", "foo").get();

  expect(res).toEqual(ITEMS.filter(({ name }) => /foo/.test(name as any)));
});

test("db.whereIn", async () => {
  const res = await DB.collection(COLLECTION)
    .whereIn("name", ["foo", "bar"])
    .get();

  expect(res).toEqual(
    ITEMS.filter(({ name }) => /^(foo|bar)$/.test(name as any)),
  );
});

test("db.whereNotIn", async () => {
  const res = await DB.collection(COLLECTION)
    .whereNotIn("name", ["foo", "bar"])
    .get();

  expect(res).toEqual(
    ITEMS.filter(({ name }) => !/^(foo|bar)$/.test(name as any)),
  );
});

test("db.whereBetween", async () => {
  const res = await DB.collection(COLLECTION).whereBetween("num", 10, 15).get();

  expect(res).toEqual(ITEMS.filter(({ num }) => num >= 10 && num <= 15));
});

test("db.whereNotBetween", async () => {
  const res = await DB.collection(COLLECTION)
    .whereNotBetween("num", 10, 15)
    .get();

  expect(res).toEqual(ITEMS.filter(({ num }) => num < 10 || num > 15));
});

test("db.whereNull", async () => {
  const res = await DB.collection(COLLECTION).whereNull("name").get();

  expect(res).toEqual(ITEMS.filter(({ name }) => !name));
});

test("db.whereNotNull", async () => {
  const res = await DB.collection(COLLECTION).whereNotNull("name").get();

  expect(res).toEqual(ITEMS.filter(({ name }) => !!name));
});

test("db.count", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).where("name", "foo").count();

  expect(result).toEqual(ITEMS.filter(({ name }) => name === "foo").length);
});

test("db.exists", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).where("name", "foo").exists();

  expect(result).toEqual(!!ITEMS.filter(({ name }) => name === "foo").length);
});

test("db.max", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).max("num");

  expect(result).toEqual(
    utils.array.clone(ITEMS).sort((a, b) => b.num - a.num)[0].num,
  );
});

test("db.min", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).min("num");

  expect(result).toEqual(
    utils.array.clone(ITEMS).sort((a, b) => a.num - b.num)[0].num,
  );
});

test("db.avg", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).avg("num");

  expect(result).toEqual(
    ITEMS.reduce((prev, cur) => prev + cur.num, 0) / ITEMS.length,
  );
});

// __tests__("db.groupBy", (done) => {
//   DB.collection(COLLECTION).groupBy("style", (q) => q.having("num", ">=", 10)).get((err, res) => {
//     expect(err).toBe(null);

//     const GROUPED = utils.array.groupBy(ITEMS, "style");

//     expect(res)
//       .toEqual(Object.keys(GROUPED)
//         .reduce((prev, cur) => (prev.push(...GROUPED[cur]), prev), [] as any[]));

//     done();
//   });
// });

test("db.orderBy", async () => {
  const res = await DB.collection(COLLECTION).orderBy("num", "desc").get();

  expect(res).toEqual(utils.array.clone(ITEMS).sort((a, b) => b.num - a.num));
});

test("db.map", async () => {
  const res = await DB.collection(COLLECTION)
    .map(({ name }) => ({ name: name || "was null" }))
    .get();

  expect(res).toEqual(ITEMS.map(({ name }) => ({ name: name || "was null" })));
});

test("db.skip", async () => {
  const res = await DB.collection(COLLECTION).skip(4).get();

  expect(res).toEqual(utils.array.clone(ITEMS).slice(4));
});

test("db.limit", async () => {
  const res = await DB.collection(COLLECTION).limit(4).get();

  expect(res).toEqual(utils.array.clone(ITEMS).slice(0, 4));
});

test("db.join", async () => {
  expect.assertions(3);

  const joinInsertResult = await DB.collection(JOIN_COLLECTION).insert(
    JOIN_ITEMS,
  );
  expect(joinInsertResult).toBe(JOIN_ITEMS.length);

  const joinResult = await DB.collection(JOIN_COLLECTION).get();
  expect(joinResult.length).toBe(JOIN_ITEMS.length);

  const result = await DB.collection(COLLECTION)
    .orderBy("num")
    .join(JOIN_COLLECTION, (q) => q.where("for_name", `${COLLECTION}.name`))
    .get();

  expect(result).toEqual(
    utils.array
      .clone(ITEMS)
      .sort((a, b) => a.num - b.num)
      .map((item) => ({
        ...item,
        [JOIN_COLLECTION]: (joinResult as Array<{ for_name: string }>).filter(
          ({ for_name }) => item.name === for_name,
        ),
      })),
  );
});

test("db.update", async () => {
  expect.assertions(2);

  const updated = await DB.collection(COLLECTION)
    .where("name", "foo")
    .update({ num: 1000 });

  expect(updated).toBe(ITEMS.filter(({ name }) => name === "foo").length);

  const result = await DB.collection(COLLECTION).get();

  expect(result).toEqual(
    ITEMS.map((item) => ({
      ...item,
      num: item.name === "foo" ? 1000 : item.num,
    })),
  );
});

test("db.increment", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION)
    .where("name", "bar")
    .increment("num");

  expect(result).toBe(ITEMS.filter(({ name }) => name === "bar").length);
});

test("db.delete", async () => {
  expect.assertions(1);

  const result = await DB.collection(COLLECTION).delete();

  expect(result).toBe(ITEMS.length);
});
