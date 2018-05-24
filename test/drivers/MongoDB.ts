import Odin from "../../src";

declare global {
  namespace NodeJS {
    interface Global {
      __MONGO_DB_NAME__: string;
      __MONGO_CONNECTION__: any;
    }
  }
}

const { DB, connections } = Odin;

beforeAll(() => {
  Odin.connections({
    default: {
      driver: "MongoDB",
      database: global.__MONGO_DB_NAME__,
      connection: global.__MONGO_CONNECTION__,
    },
  });
});

const TABLE = "users";
const JOIN_TABLE = "bills";

const test = (name: string, fn: jest.ProvidesCallback) => it(name, fn, 10 * 1000);

describe("Testing `MongoDB` driver", async () => {
  const insertOneAsyncItem = {
    name: "foo",
    style: "async",
    num: 10,
  };

  test("DB.insert one (async/await style)", async () => {
    const result = await DB.table(TABLE).insert(insertOneAsyncItem);

    expect(result).toBe(1);
  });

  const insertOneCallbackItem = {
    name: "bar",
    style: "callback",
    num: 15,
  };

  test("DB.insert one (callback style)", () => {
    DB.table(TABLE).insert(insertOneCallbackItem, (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(1);
    });
  });

  const insertManyAsyncItems = [
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
  ];

  test("DB.insert many (async/await style)", async () => {
    const result = await DB.table(TABLE).insert(insertManyAsyncItems);

    expect(result).toBe(insertManyAsyncItems.length);
  });

  const insertManyCallbackItems = [
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

  test("DB.insert many (callback style)", () => {
    DB.table(TABLE).insert(insertManyCallbackItems, (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(2);
    });
  });

  const getItems = [insertOneAsyncItem, insertOneCallbackItem, ...insertManyAsyncItems, ...insertManyCallbackItems];

  test("DB.value (async/await style)", async () => {
    const result = await DB.table(TABLE).value("name");

    expect(result).toEqual(getItems.map(({ name }) => name));
  });

  test("DB.value (callback style)", () => {
    DB.table(TABLE).value("name", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.map(({ name }) => name));
    });
  });

  test("DB.get (async/await style)", async () => {
    const result = await DB.table(TABLE).get(["name", "style", "num"]);

    expect(result).toEqual(getItems);
  });

  test("DB.get (callback style)", () => {
    DB.table(TABLE).get(["name", "style", "num"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems);
    });
  });

  test("DB.first (async/await style)", async () => {
    const result = await DB.table(TABLE).first(["name", "style"]);

    expect(result).toEqual(getItems.map(({ name, style }) => ({ name, style }))[0]);
  });

  test("DB.first (callback style)", () => {
    DB.table(TABLE).first(["name", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.map(({ name, style }) => ({ name, style }))[0]);
    });
  });

  test("db.where", () => {
    DB.table(TABLE).where("name", "foo").get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.filter(({ name }) => name === "foo"));
    });
  });

  test("db.orWhere", () => {
    DB.table(TABLE).where("name", "foo").orWhere("style", "async").get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.filter(({ name, style }) => name === "foo" || style === "async"));
    });
  });

  test("db.whereLike", () => {
    DB.table(TABLE).whereLike("name", "foo").get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.filter(({ name }) => /foo/.test(name)));
    });
  });

  test("db.whereIn", () => {
    DB.table(TABLE).whereIn("name", ["foo", "bar"]).get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.filter(({ name }) => /^(foo|bar)$/.test(name)));
    });
  });

  test("db.whereNotIn", () => {
    DB.table(TABLE).whereNotIn("name", ["foo", "bar"]).get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.filter(({ name }) => !/^(foo|bar)$/.test(name)));
    });
  });

  test("db.whereBetween", () => {
    DB.table(TABLE).whereBetween("num", 10, 15).get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.filter(({ num }) => num >= 10 && num <= 15));
    });
  });

  test("db.whereNotBetween", () => {
    DB.table(TABLE).whereNotBetween("num", 10, 15).get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.filter(({ num }) => num < 10 || num > 15));
    });
  });

  test("db.whereNull", () => {
    DB.table(TABLE).whereNull("name").get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.filter(({ name }) => name === null));
    });
  });

  test("db.whereNotNull", () => {
    DB.table(TABLE).whereNotNull("name").get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.filter(({ name }) => name !== null));
    });
  });

  test("DB.count (async/await style)", async () => {
    const result = await DB.table(TABLE).where("name", "foo").count();

    expect(result)
      .toEqual(getItems.filter(({ name }) => name === "foo").length);
  });

  test("DB.count (callback style)", () => {
    DB.table(TABLE).where("name", "foo").count((err, res) => {
      expect(err).toBe(null);
      expect(res)
        .toEqual(getItems.filter(({ name }) => name === "foo").length);
    });
  });

  test("DB.exists (async/await style)", async () => {
    const result = await DB.table(TABLE).where("name", "foo").exists();

    expect(result)
      .toEqual(!!getItems.filter(({ name }) => name === "foo"));
  });

  test("DB.exists (callback style)", () => {
    DB.table(TABLE).where("name", "foo").exists((err, res) => {
      expect(err).toBe(null);
      expect(res)
        .toEqual(!!getItems.filter(({ name }) => name === "foo"));
    });
  });

  test("db.min", () => {
    DB.table(TABLE).min("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.sort((a, b) => a.num - b.num)[0].num);
    });
  });

  test("db.max", () => {
    DB.table(TABLE).max("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.sort((a, b) => b.num - a.num)[0].num);
    });
  });

  test("db.avg", () => {
    DB.table(TABLE).avg("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.reduce((prev, curr) => prev + curr.num, 0) / getItems.length);
    });
  });

  test("db.orderBy", () => {
    DB.table(TABLE).orderBy("num", "desc").get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res[0]).toEqual(getItems.sort((a, b) => b.num - a.num)[0]);
    });
  });

  test("db.map", () => {
    DB.table(TABLE).orderBy("num").map(({ name }) => ({ name: name || "was null" })).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.sort((a, b) => a.num - b.num).map(({ name }) => ({ name: name || "was null" })));
    });
  });

  test("db.skip", () => {
    DB.table(TABLE).skip(4).orderBy("num").get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.sort((a, b) => a.num - b.num).slice(4));
    });
  });

  test("db.limit", () => {
    DB.table(TABLE).limit(4).orderBy("num").get(["name", "num", "style"], (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(getItems.sort((a, b) => a.num - b.num).slice(0, 4));
    });
  });

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

  test("db.join", async () => {
    const result1 = await DB.table(JOIN_TABLE).insert(JOIN_ITEMS);
    expect(result1).toBe(JOIN_ITEMS.length);

    const result = await DB.table(TABLE)
      .orderBy("num")
      .join(JOIN_TABLE, (q) => q.on("for_name", `${TABLE}.name`))
      .get(["name", "num", "style", `${JOIN_TABLE}.for_name`, `${JOIN_TABLE}.bill`]);

    expect(result).toEqual(
      getItems.sort((a, b) => a.num - b.num)
        .map((item) =>
          ({
            ...item,
            [JOIN_TABLE]: JOIN_ITEMS.filter(({ for_name }) => item.name === for_name),
          }),
      ),
    );
  });

  // TODO: update, increment, delete
});
