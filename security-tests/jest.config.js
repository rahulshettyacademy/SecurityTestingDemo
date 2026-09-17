/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/helpers/jestSetup.ts"],
};
