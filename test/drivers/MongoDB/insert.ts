import { MongoClient } from "mongodb";
import Odin from "../../../src";

declare global {
    namespace NodeJS {
        interface Global {
            __MONGO_DB_NAME__: string;
            __MONGO_URI__: string;
        }
    }
}

const { DB, connections } = Odin;

beforeAll(async () => {
    Odin.connections({
        default: {
            driver: "MongoDB",
            database: global.__MONGO_DB_NAME__,
            connection: await MongoClient.connect(global.__MONGO_URI__),
        },
    });
});

test("DB.insert one (async/await) style", async () => {
    const result = await DB.table("users").insert({
        name: "foo",
    });

    expect(result).toBe(1);
});

test("DB.insert one (callback) style", () => {
    DB.table("users").insert({
        name: "foo",
    }, (err, res) => {
        if (err) throw err;

        expect(res).toBe(1);
    });
});

test("DB.insert many (async/await) style", async () => {
    const result = await DB.table("users").insert([
        {
            name: "foo",
        },
        {
            name: "bar",
        },
    ]);

    expect(result).toBe(2);
});

test("DB.insert many (callback) style", () => {
    DB.table("users").insert([
        {
            name: "foo",
        },
        {
            name: "bar",
        },
    ], (err, res) => {
        if (err) throw err;

        expect(res).toBe(2);
    });
});
