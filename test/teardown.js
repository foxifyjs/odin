module.exports = async () => {
  // await global.__MONGOD__.stop();
  await global.__REPLICA__.stop();

  process.exit(0);
};