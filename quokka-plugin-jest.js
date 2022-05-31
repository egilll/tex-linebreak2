module.exports = {
  beforeEach: (config) => {
    global.describe = (name, fn) => fn();
    global.it = (name, fn) => fn();
    global.expect = require('expect');
  },
};
