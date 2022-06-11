const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const glob = require("glob");

const hyphenLangs = ["en-us"];
let hyphenLibs = {};
for (let lang of hyphenLangs) {
  hyphenLibs[`hyphens_${lang}`] = `hyphenation.${lang}`;
}

const files = glob.sync("./src/**/*.ts").filter(
  (filename) =>
    !filename.includes("/demo/") &&
    // !filename.includes("/deprecated/") &&
    // !filename.includes("monospace") &&
    !filename.includes("/tmp_") &&
    !filename.endsWith(".d.ts")
);

module.exports = {
  entry: {
    demo: "./src/demo/demo.ts",
    lib: files,
    lib_web: "./src/html/texLinebreakDOM.ts",
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
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
  /** Will serve demo page at http://localhost:3000/index.html */
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
  plugins: [
    new HtmlWebpackPlugin({
      inject: false,
      template: "./src/demo/demo.html",
    }),
  ],
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
};
