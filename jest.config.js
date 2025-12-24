const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/__mocks__/",
    "\\.integration\\.test\\.(ts|tsx)$",
    ".*/__tests__/utils/.*\\.(ts|tsx)$",
  ],
  moduleNameMapper: {
    // Mock the content submodule imports for tests (both alias and relative path forms)
    "^@/content/aquario-mapas/centro-de-informatica/professores$":
      "<rootDir>/src/lib/client/mapas/__mocks__/professors.ts",
    "\\.\\./\\.\\./content/aquario-mapas/centro-de-informatica/professores$":
      "<rootDir>/src/lib/client/mapas/__mocks__/professors.ts",
    "^@/content/(.*)$": "<rootDir>/content/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
