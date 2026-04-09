const config = {
  preset: "ts-jest",
  testEnvironment: "node",

  testMatch: ["<rootDir>/src/**/*.test.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/layer/"],
  modulePathIgnorePatterns: ["<rootDir>/layer/", "dist/"],

  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.controller.ts",
    "!src/**/*.test.ts",
    "!src/index.ts",
    "!src/app.ts",
  ],

  coverageDirectory: "coverage",

  coverageThreshold: {
    global: {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
  },
};

export default config;
