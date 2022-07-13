const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  // mode: 'development',
  // resolve: {
  //   fallback: {
  //     // "fs": false,
  //     // "tls": false,
  //     // "net": false,
  //     // "path": false,
  //     // "zlib": false,
  //     "http": false,
  //     "https": false,
  //     // "stream": false,
  //     "os": false,
  //     "url": false,

  //   } 
  // },
  entry: "./src/index.js",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CopyWebpackPlugin([{ from: "./src/index.html", to: "index.html" }]),
  ],
  devServer: { contentBase: path.join(__dirname, "dist"), compress: true },
};
