const puppeteer = require('puppeteer');

process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = (config) => {
  config.set({
    browsers: ['ChromeHeadless'],

    frameworks: ['mocha'],

    files: [{ pattern: 'build/tests.bundle.js', watched: true }],

    reporters: ['dots'],
  });
};
