const path = require("path");

module.exports = {
  entry: "./server/client/index.js",
  output: {
    filename: "index.js",
    path: path.resolve("./server/assets")
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  }
};
