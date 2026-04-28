const test = process.env.NODE_ENv === "test";
module.exports = {
  plugins: [...(test ? ["babel-plugin-transform-import-meta"] : [])],
};
