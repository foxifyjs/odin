module.exports = async () => {
  await __CONNECTION__.close();

  process.exit(0);
};