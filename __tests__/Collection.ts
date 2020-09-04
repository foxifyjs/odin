import { Collection, Connect } from "../src";

declare global {
  namespace NodeJS {
    interface Global {
      __MONGO_DB_NAME__: string;
      __MONGO_CONNECTION__: any;
    }
  }
}

Connect({
  default: {
    database: global.__MONGO_DB_NAME__,
    connection: global.__MONGO_CONNECTION__,
  },
});

it("Should create collection with the given indexes (async/await)", async () => {
  expect.assertions(0);

  const collection = new Collection("tests");

  collection
    .index({ field_1: 1, field_2: -1 }, { name: "field_1_field_2", background: true, unique: true })
    .index({ field_3: 1 }, { name: "field_3", background: true })
    .timestamps()
    .softDelete();

  await collection.exec();
});

it("Should create collection with the given indexes (callback)", (done) => {
  expect.assertions(1);

  const collection = new Collection("tests2");

  collection
    .index({ field_1: 1, field_2: -1 }, { name: "field_1_field_2", background: true, unique: true })
    .index({ field_3: 1 }, { name: "field_3", background: true })
    .timestamps()
    .softDelete();

  collection.exec((err) => {
    expect(err).toBe(null);
    done();
  });
});
