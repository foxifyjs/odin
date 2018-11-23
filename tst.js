const {
  array,
  object
} = require("prototyped.js/es6/methods")

const arr = [
  "100",
  "200",
  "100.010",
  "100.010.001",
  "100.020",
];

const get = (relation, rs = {}) => {
  const relations = relation.split(".");

  const curr = relations.shift();

  return {
    ...rs,
    [curr]: relations.length ? get(relations.join("."), rs[curr]) : {}
  }
}

console.log(arr.reduce((prev, curr) => {
  return {
    ...prev,
    ...get(curr, prev),
  };
}, {}));

const get2 = (relation, prev = []) => {
  const relations = relation.split(".");

  const curr = relations.shift();

  const index = prev.findIndex((p) => p.relation === curr);

  if (index !== -1) {
    prev[index].relations = get2(relations.join("."), prev[index].relations);

    return prev;
  }

  prev.push({
    relation: curr,
    relations: [],
  });

  return prev;

  // return {
  //   ...prev,
  //   [curr]: relations.length ? get2(relations.join("."), prev[curr]) : {}
  // }
}

console.log(
  JSON.stringify(arr.reduce((prev, curr) => {
    return get2(curr, prev);
  }, []), undefined, 2)
);