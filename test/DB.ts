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
  Connect({
    default: {
      database: global.__MONGO_DB_NAME__,
      connection: global.__MONGO_CONNECTION__,
    },
  });

  DB.collection(TABLE).insert(ITEMS, (err) => {
    if (err) throw err;

    DB.collection(TABLE).get((err, items) => {
      if (err) throw err;

      ITEMS.length = 0;

      ITEMS.push(...items);

      done();
    });
  });
});

afterEach((done) => {
  DB.collection(TABLE).delete((err, deleted) => {
    if (err) throw err;

    DB.collection(TABLE).insert(ITEMS, (err, inserted) => {
      if (err) throw err;

      done();
    });
  });
});

afterAll((done) => {
  DB.collection(TABLE).delete((err) => {
    if (err) throw err;

    DB.collection(JOIN_TABLE).delete((err) => {
      if (err) throw err;

      done();
    });
  });
});

describe("`MongoDB` driver", () => {
  test("db.insert one (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).insert(utils.object.omit(ITEMS[0], ["id"]));

    expect(result).toBe(1);
  });

  test("db.insert one (callback style)", (done) => {
    DB.collection(TABLE).insert(utils.object.omit(ITEMS[0], ["id"]), (err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(1);

      done();
    });
  });

  test("db.insert many (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE)
      .insert(ITEMS.map((item: any) => utils.object.omit(item, ["id"])));

    expect(result).toBe(ITEMS.length);
  });

  test("db.insert many (callback style)", (done) => {
    DB.collection(TABLE)
      .insert(ITEMS.map((item: any) => utils.object.omit(item, ["id"])), (err, res) => {
        expect(err).toBe(null);
        expect(res).toBe(ITEMS.length);

        done();
      });
  });

  test("db.value (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).value("name");

    expect(result).toEqual(ITEMS.map(({ name }) => name || undefined));
  });

  test("db.value (callback style)", (done) => {
    DB.collection(TABLE).value("name", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.map(({ name }) => name || undefined));

      done();
    });
  });

  test("db.get (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).get();

    expect(result).toEqual([...ITEMS]);
  });

  test("db.get (callback style)", (done) => {
    DB.collection(TABLE).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS);

      done();
    });
  });

  test("db.first (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).first();

    expect(result).toEqual(ITEMS[0]);
  });

  test("db.first (callback style)", (done) => {
    DB.collection(TABLE).first((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS[0]);

      done();
    });
  });

  test("db.where", (done) => {
    DB.collection(TABLE).where("name", "foo").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => name === "foo"));

      done();
    });
  });

  test("db.orWhere", (done) => {
    DB.collection(TABLE).where("name", "foo").orWhere("style", "async").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name, style }) => name === "foo" || style === "async"));

      done();
    });
  });

  test("db.whereLike", (done) => {
    DB.collection(TABLE).whereLike("name", "foo").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => /foo/.test(name as any)));

      done();
    });
  });

  test("db.whereIn", (done) => {
    DB.collection(TABLE).whereIn("name", ["foo", "bar"]).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => /^(foo|bar)$/.test(name as any)));

      done();
    });
  });

  test("db.whereNotIn", (done) => {
    DB.collection(TABLE).whereNotIn("name", ["foo", "bar"]).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => !/^(foo|bar)$/.test(name as any)));

      done();
    });
  });

  test("db.whereBetween", (done) => {
    DB.collection(TABLE).whereBetween("num", 10, 15).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ num }) => num >= 10 && num <= 15));

      done();
    });
  });

  test("db.whereNotBetween", (done) => {
    DB.collection(TABLE).whereNotBetween("num", 10, 15).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ num }) => num < 10 || num > 15));

      done();
    });
  });

  test("db.whereNull", (done) => {
    DB.collection(TABLE).whereNull("name").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => !name));

      done();
    });
  });

  test("db.whereNotNull", (done) => {
    DB.collection(TABLE).whereNotNull("name").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => !!name));

      done();
    });
  });

  test("db.count (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).where("name", "foo").count();

    expect(result).toEqual(ITEMS.filter(({ name }) => name === "foo").length);
  });

  test("db.count (callback style)", (done) => {
    DB.collection(TABLE).where("name", "foo").count((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.filter(({ name }) => name === "foo").length);

      done();
    });
  });

  test("db.exists (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).where("name", "foo").exists();

    expect(result).toEqual(!!ITEMS.filter(({ name }) => name === "foo").length);
  });

  test("db.exists (callback style)", (done) => {
    DB.collection(TABLE).where("name", "foo").exists((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(!!ITEMS.filter(({ name }) => name === "foo").length);

      done();
    });
  });

  test("db.max (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).max("num");

    expect(result).toEqual(utils.array.clone(ITEMS).sort((a, b) => b.num - a.num)[0].num);
  });

  test("db.max (callback style)", (done) => {
    DB.collection(TABLE).max("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).sort((a, b) => b.num - a.num)[0].num);

      done();
    });
  });

  test("db.min (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).min("num");

    expect(result).toEqual(utils.array.clone(ITEMS).sort((a, b) => a.num - b.num)[0].num);
  });

  test("db.min (callback style)", (done) => {
    DB.collection(TABLE).min("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).sort((a, b) => a.num - b.num)[0].num);

      done();
    });
  });

  test("db.avg (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).avg("num");

    expect(result).toEqual(ITEMS.reduce((prev, cur) => prev + cur.num, 0) / ITEMS.length);
  });

  test("db.avg (callback style)", (done) => {
    DB.collection(TABLE).avg("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.reduce((prev, cur) => prev + cur.num, 0) / ITEMS.length);

      done();
    });
  });

  // test("db.groupBy", (done) => {
  //   DB.collection(TABLE).groupBy("style", (q) => q.having("num", ">=", 10)).get((err, res) => {
  //     expect(err).toBe(null);

  //     const GROUPED = utils.array.groupBy(ITEMS, "style");

  //     expect(res)
  //       .toEqual(Object.keys(GROUPED)
  //         .reduce((prev, cur) => (prev.push(...GROUPED[cur]), prev), [] as any[]));

  //     done();
  //   });
  // });

  test("db.orderBy", (done) => {
    DB.collection(TABLE).orderBy("num", "desc").get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).sort((a, b) => b.num - a.num));

      done();
    });
  });

  test("db.map", (done) => {
    DB.collection(TABLE).map(({ name }) => ({ name: name || "was null" })).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(ITEMS.map(({ name }) => ({ name: name || "was null" })));

      done();
    });
  });

  test("db.skip", (done) => {
    DB.collection(TABLE).skip(4).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).slice(4));

      done();
    });
  });

  test("db.limit", (done) => {
    DB.collection(TABLE).limit(4).get((err, res) => {
      expect(err).toBe(null);
      expect(res).toEqual(utils.array.clone(ITEMS).slice(0, 4));

      done();
    });
  });

  test("db.join", async () => {
    expect.assertions(3);

    const joinInsertResult = await DB.collection(JOIN_TABLE).insert(JOIN_ITEMS);
    expect(joinInsertResult).toBe(JOIN_ITEMS.length);

    const joinResult = await DB.collection(JOIN_TABLE).get();
    expect(joinResult.length).toBe(JOIN_ITEMS.length);

    const result = await DB.collection(TABLE).orderBy("num")
      .join(JOIN_TABLE, q => q.where("for_name", `${TABLE}.name`))
      .get();

    expect(result).toEqual(
      utils.array.clone(ITEMS).sort((a, b) => a.num - b.num)
        .map(item =>
          ({
            ...item,
            [JOIN_TABLE]: (joinResult as Array<{ for_name: string }>)
              .filter(({ for_name }) => item.name === for_name),
          })
        )
    );
  });

  test("db.update (async/await style)", async () => {
    expect.assertions(2);

    const updated = await DB.collection(TABLE).where("name", "foo").update({ num: 1000 });

    expect(updated).toBe(ITEMS.filter(({ name }) => name === "foo").length);

    const result = await DB.collection(TABLE).get();

    expect(result)
      .toEqual(ITEMS.map(item => ({ ...item, num: item.name === "foo" ? 1000 : item.num })));
  });

  test("db.update (callback style)", (done) => {
    DB.collection(TABLE).where("name", "foo").update({ num: 1000 }, (err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(ITEMS.filter(({ name }) => name === "foo").length);

      DB.collection(TABLE).get((err, res) => {
        expect(err).toBe(null);
        expect(res)
          .toEqual(ITEMS.map(item => ({ ...item, num: item.name === "foo" ? 1000 : item.num })));

        done();
      });
    });
  });

  test("db.increment (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).where("name", "bar").increment("num");

    expect(result).toBe(ITEMS.filter(({ name }) => name === "bar").length);
  });

  test("db.increment (callback style)", (done) => {
    DB.collection(TABLE).where("name", "bar").increment("num", (err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(ITEMS.filter(({ name }) => name === "bar").length);

      done();
    });
  });

  test("db.delete (async/await style)", async () => {
    expect.assertions(1);

    const result = await DB.collection(TABLE).delete();

    expect(result).toBe(ITEMS.length);
  });

  test("db.delete (callback style)", (done) => {
    DB.collection(TABLE).delete((err, res) => {
      expect(err).toBe(null);
      expect(res).toBe(ITEMS.length);

      done();
    });
  });
});
