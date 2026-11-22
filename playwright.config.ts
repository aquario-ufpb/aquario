import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./e2e/session";

const port = process.env.PORT ?? "3000";

export default defineConfig({
  testDir: "./e2e",
  // The first request compiles /planejador on demand; give each test room for it.
  timeout: 90_000,
  // One worker: every test shares the seeded local database.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
