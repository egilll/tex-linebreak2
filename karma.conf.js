const webpackConfig = require("./webpack.config.js");
const puppeteer = require("puppeteer");
process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = (config) => {
  config.set({
    browsers: ["ChromeHeadless"],

    frameworks: ["mocha"],

    files: [{ pattern: "test/**/*.test.ts", watched: true }],

    // mime: {
    //   // Serve compiled TypeScript bundles with correct mime type.
    //   //
    //   // See https://github.com/angular/angular-cli/issues/2125#issuecomment-247395088
    //   "application/javascript": ["ts", "tsx"],
    // },

    preprocessors: {
      "**/*.ts": "webpack",
    },

    webpack: {
      mode: "development",
      module: webpackConfig.module,
      resolve: webpackConfig.resolve,
    },

    webpackMiddleware: {
      stats: "errors-only",
    },

    reporters: ["mocha"],
    mochaReporter: {
      showDiff: true,
    },
  });
};
