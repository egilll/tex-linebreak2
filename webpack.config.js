const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const hyphenLangs = ["en-us"];
let hyphenLibs = {};
for (let lang of hyphenLangs) {
  hyphenLibs[`hyphens_${lang}`] = `hyphenation.${lang}`;
}

module.exports = {
  entry: {
    demos: "src/demo/demo.ts",
    lib: "./src",
    ...hyphenLibs,
  },
  devtool: "inline-source-map",
  mode: process.env.NODE_ENV || "development",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  stats: {
    assets: false,
    children: false,
    chunks: false,
    hash: false,
    modules: false,
    publicPath: false,
    timings: false,
    version: false,
    warnings: true,
  },
  /** Will serve from http://localhost:3000/index.html */
  devServer: {
    port: 3000,
    static: {
      directory: "./src/demo/",
    },
    hot: false,
    liveReload: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
  resolve: {
    modules: ["./", "node_modules"],
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),

    // Build a UMD bundle that can be used from a `<script>` tag, or imported
    // into a CommonJS / ESM environment.
    libraryTarget: "umd",
    library: "texLinebreak_[name]",

    // Make the UMD bundle usable in Node.
    // See https://github.com/webpack/webpack/issues/6522
    globalObject: "typeof self !== 'undefined' ? self : this",
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: false,
      template: "./src/demo/demo.html",
    }),
  ],
};
