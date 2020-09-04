module.exports = async () => {
  await __CONNECTION__.close();
  await __MONGOD__.stop();

  process.exit(0);
};