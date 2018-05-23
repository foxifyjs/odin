module.exports = async () => {
  await global.__MONGOD__.stop();
  process.exit(0);
};