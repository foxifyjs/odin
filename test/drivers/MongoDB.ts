import { DB, connections } from "../../src";
import * as utils from "../../src/utils";

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

const JOIN_TABLE = "bills";
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

beforeAll((done) => {
  connections({
    default: {
      driver: "MongoDB",
      database: global.__MONGO_DB_NAME__,
      connection: global.__MONGO_CONNECTION__,
    },
  });

  DB.table(TABLE).insert(ITEMS, (err) => {
    if (err) throw err;

    DB.table(TABLE).get((err, items) => {
      if (err) throw err;

      ITEMS.length = 0;

      ITEMS.push(...items);

      done();
    });
  });
});

afterEach((done) => {
  DB.table(TABLE).delete((err, deleted) => {
    if (err) throw err;

    DB.table(TABLE).insert(ITEMS, (err, inserted) => {
      if (err) throw err;

      done();
    });
  });
});

afterAll((done) => {
  DB.table(TABLE).delete((err) => {
    if (err) throw err;

    DB.table(JOIN_TABLE).delete((err) => {
      if (err) throw err;

      done();
    });
  });
});

describe("`MongoDB` driver", () => {
  test("db.insert one (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).insert(utils.object.omit(ITEMS[0], ["id"]));

    expect(result).toBe(1);
  });

  test("db.insert one (callback style)", (done) => {
    DB.table(TABLE).insert(utils.object.omit(ITEMS[0], ["id"]), (err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(1);

      done();
    });
  });

  test("db.insert many (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).insert(ITEMS.map((item: any) => utils.object.omit(item, ["id"])));

    expect(result).toBe(ITEMS.length);
  });

  test("db.insert many (callback style)", (done) => {
    DB.table(TABLE).insert(ITEMS.map((item: any) => utils.object.omit(item, ["id"])), (err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(ITEMS.length);

      done();
    });
  });

  test("db.value (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).value("name");

    expect(result).toEqual(ITEMS.map(({ name }) => name || undefined));
  });

  test("db.value (callback style)", (done) => {
    DB.table(TABLE).value("name", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.map(({ name }) => name || undefined));

      done();
    });
  });

  test("db.get (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).get();

    expect(result).toEqual([...ITEMS]);
  });

  test("db.get (callback style)", (done) => {
    DB.table(TABLE).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS);

      done();
    });
  });

  test("db.first (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).first();

    expect(result).toEqual(ITEMS[0]);
  });

  test("db.first (callback style)", (done) => {
    DB.table(TABLE).first((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS[0]);

      done();
    });
  });

  test("db.where", (done) => {
    DB.table(TABLE).where("name", "foo").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => name === "foo"));

      done();
    });
  });

  test("db.orWhere", (done) => {
    DB.table(TABLE).where("name", "foo").orWhere("style", "async").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name, style }) => name === "foo" || style === "async"));

      done();
    });
  });

  test("db.whereLike", (done) => {
    DB.table(TABLE).whereLike("name", "foo").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => /foo/.test(name)));

      done();
    });
  });

  test("db.whereIn", (done) => {
    DB.table(TABLE).whereIn("name", ["foo", "bar"]).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => /^(foo|bar)$/.test(name)));

      done();
    });
  });

  test("db.whereNotIn", (done) => {
    DB.table(TABLE).whereNotIn("name", ["foo", "bar"]).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => !/^(foo|bar)$/.test(name)));

      done();
    });
  });

  test("db.whereBetween", (done) => {
    DB.table(TABLE).whereBetween("num", 10, 15).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ num }) => num >= 10 && num <= 15));

      done();
    });
  });

  test("db.whereNotBetween", (done) => {
    DB.table(TABLE).whereNotBetween("num", 10, 15).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ num }) => num < 10 || num > 15));

      done();
    });
  });

  test("db.whereNull", (done) => {
    DB.table(TABLE).whereNull("name").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => !name));

      done();
    });
  });

  test("db.whereNotNull", (done) => {
    DB.table(TABLE).whereNotNull("name").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => !!name));

      done();
    });
  });

  test("db.count (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).where("name", "foo").count();

    expect(result).toEqual(ITEMS.filter(({ name }) => name === "foo").length);
  });

  test("db.count (callback style)", (done) => {
    DB.table(TABLE).where("name", "foo").count((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => name === "foo").length);

      done();
    });
  });

  test("db.exists (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).where("name", "foo").exists();

    expect(result).toEqual(!!ITEMS.filter(({ name }) => name === "foo").length);
  });

  test("db.exists (callback style)", (done) => {
    DB.table(TABLE).where("name", "foo").exists((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(!!ITEMS.filter(({ name }) => name === "foo").length);

      done();
    });
  });

  test("db.max (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).max("num");

    expect(result).toEqual(utils.array.clone(ITEMS).sort((a, b) => b.num - a.num)[0].num);
  });

  test("db.max (callback style)", (done) => {
    DB.table(TABLE).max("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).sort((a, b) => b.num - a.num)[0].num);

      done();
    });
  });

  test("db.min (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).min("num");

    expect(result).toEqual(utils.array.clone(ITEMS).sort((a, b) => a.num - b.num)[0].num);
  });

  test("db.min (callback style)", (done) => {
    DB.table(TABLE).min("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).sort((a, b) => a.num - b.num)[0].num);

      done();
    });
  });

  test("db.avg (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).avg("num");

    expect(result).toEqual(ITEMS.reduce((prev, cur) => prev + cur.num, 0) / ITEMS.length);
  });

  test("db.avg (callback style)", (done) => {
    DB.table(TABLE).avg("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.reduce((prev, cur) => prev + cur.num, 0) / ITEMS.length);

      done();
    });
  });

  // test("db.groupBy", (done) => {
  //   DB.table(TABLE).groupBy("style", (q) => q.having("num", ">=", 10)).get((err, res) => {
  //     expect(err).toBe(null);

  //     const GROUPED = utils.array.groupBy(ITEMS, "style");

  //     expect(res)
  //       .toEqual(Object.keys(GROUPED).reduce((prev, cur) => (prev.push(...GROUPED[cur]), prev), [] as any[]));

  //     done();
  //   });
  // });

  test("db.orderBy", (done) => {
    DB.table(TABLE).orderBy("num", "desc").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).sort((a, b) => b.num - a.num));

      done();
    });
  });

  test("db.map", (done) => {
    DB.table(TABLE).map(({ name }) => ({ name: name || "was null" })).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.map(({ name }) => ({ name: name || "was null" })));

      done();
    });
  });

  test("db.skip", (done) => {
    DB.table(TABLE).skip(4).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).slice(4));

      done();
    });
  });

  test("db.limit", (done) => {
    DB.table(TABLE).limit(4).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).slice(0, 4));

      done();
    });
  });

  test("db.join", async () => {
    expect.assertions(3);

    const joinInsertResult = await DB.table(JOIN_TABLE).insert(JOIN_ITEMS);
    expect(joinInsertResult).toBe(JOIN_ITEMS.length);

    const joinResult = await DB.table(JOIN_TABLE).get();
    expect(joinResult.length).toBe(JOIN_ITEMS.length);

    const result = await DB.table(TABLE).orderBy("num")
      .join(JOIN_TABLE, (q) => q.on("for_name", `${TABLE}.name`))
      .get();

    expect(result).toEqual(
      utils.array.clone(ITEMS).sort((a, b) => a.num - b.num)
        .map((item) =>
          ({
            ...item,
            [JOIN_TABLE]: joinResult.filter(({ for_name }) => item.name === for_name),
          }),
        ),
    );
  });

  test("db.update (async/await style)", async () => {
    expect.assertions(2);

    const updated = await DB.table(TABLE).where("name", "foo").update({ num: 1000 });

    expect(updated).toBe(ITEMS.filter(({ name }) => name === "foo").length);

    const result = await DB.table(TABLE).get();

    expect(result).toEqual(ITEMS.map((item) => ({ ...item, num: item.name === "foo" ? 1000 : item.num })));
  });

  test("db.update (callback style)", (done) => {
    DB.table(TABLE).where("name", "foo").update({ num: 1000 }, (err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(ITEMS.filter(({ name }) => name === "foo").length);

      DB.table(TABLE).get((err, res) => {
        expect(err).toBe(null);
        expect(res).toEqual(ITEMS.map((item) => ({ ...item, num: item.name === "foo" ? 1000 : item.num })));

        done();
      });
    });
  });

  test("db.increment (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).where("name", "bar").increment("num");

    expect(result).toBe(ITEMS.filter(({ name }) => name === "bar").length);
  });

  test("db.increment (callback style)", (done) => {
    DB.table(TABLE).where("name", "bar").increment("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(ITEMS.filter(({ name }) => name === "bar").length);

      done();
    });
  });

  test("db.delete (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.table(TABLE).delete();

    expect(result).toBe(ITEMS.length);
  });

  test("db.delete (callback style)", (done) => {
    DB.table(TABLE).delete((err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(ITEMS.length);

      done();
    });
  });
});
