module.exports = {
  moduleDirectories: [__dirname, "node_modules"],
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
