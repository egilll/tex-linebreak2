/**
 * Only used by Jest. Not used by the build process due to
 * preset-env causing an extremely significnt performance
 * hit (crawling to a halt for only a few dozen paragraphs)
 */
module.exports = {
  presets: ["@babel/preset-env", "@babel/preset-typescript"],
};
