const path = require("path");
const slsw = require("serverless-webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  context: __dirname,
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  entry: slsw.lib.entries,
  target: "node",
  externals: [nodeExternals()],
  resolve: {
    extensions: [".mjs", ".json", ".ts", ".js", ".cjs"],
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.(tsx?)$/,
        loader: "ts-loader",
        options: {
          compiler: "typescript",
          transpileOnly: true,
          experimentalWatchApi: true,
          configFile: "tsconfig.json",
          compilerOptions: {},
        },
        exclude: [
          [
            path.resolve(__dirname, "layer"),
            path.resolve(__dirname, "node_modules"),
            path.resolve(__dirname, ".serverless"),
            path.resolve(__dirname, ".webpack"),
          ],
        ],
      },
    ],
  },
  optimization: {
    nodeEnv: false,
  },
};
