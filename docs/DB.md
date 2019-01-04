# DB <!-- omit in toc -->

Query and manipulate database without `Odin` models interfering

JavaScript:

```javascript
const { DB } = require("@foxify/odin");
```

TypeScript:

```typescript
import { DB } from "@foxify/odin";
```

## Table of Contents <!-- omit in toc -->

- [DB.connection(connection: string)](#dbconnectionconnection-string)
- [DB.collection(collection: string)](#dbcollectioncollection-string)
- [db.collection(collection: string)](#dbcollectioncollection-string)
- [db.aggregate(...objects: object[] | object[][])](#dbaggregateobjects-object--object)
- [db.join(collection: string, query?: DB.JoinQuery, as?: string)](#dbjoincollection-string-query-dbjoinquery-as-string)
- [db.map(mapper: (item: object, index: number, items: object[]) => void)](#dbmapmapper-item-object-index-number-items-object--void)
- [db.orderBy(field: string | { [field: string]: "asc" | "desc" }, order?: "asc" | "desc")](#dborderbyfield-string---field-string-%22asc%22--%22desc%22--order-%22asc%22--%22desc%22)

## DB.connection(connection: string)

Specify the database connection.

```javascript
const db = DB.connection("default");
```

## DB.collection(collection: string)

Specify the database collection.

> It sets `default` as the connection.

```javascript
const db = DB.collection("users");
```

## db.collection(collection: string)

Specify the database collection.

```javascript
const db = db.collection("users");
```

## db.aggregate(...objects: object[] | object[][])

Pushes the deep flattened array of the given objects to query aggregation.

```javascript
const db = db.aggregate(
  {
    $match: {
      foo: "bar",
    },
  },
  {
    $sort: {
      foo: 1,
    },
  },
);
```

## db.join(collection: string, query?: DB.JoinQuery, as?: string)

Joins the given `collection` by the given query (which has a default value) as `as` which is the `collection` by default

```javascript
const db = db.join("user_bills", q => q.where("user_id", "users.id"), "bills");
```

## db.map(mapper: (item: object, index: number, items: object[]) => void)

Gives the given `mapper` to `mongodb` aggregation cursor `map` method.

```javascript
const db = db.map((item, index, items) => item);
```

## db.orderBy(field: string | { [field: string]: "asc" | "desc" }, order?: "asc" | "desc")

Sorts results by the given values.

```javascript
const db = db.orderBy("foo");
```

```javascript
const db = db.orderBy({
  foo: "asc",
  bar: "desc",
});
```
