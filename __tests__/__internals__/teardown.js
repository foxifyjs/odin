module.exports = async () => {
  await __CONNECTION__.close();
  await __MONGOD__.stop();

  // await __REPLICA_CONN__.stop();
  // await __REPLICA__.stop();

  process.exit(0);
};