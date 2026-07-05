import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "node ./node_modules/vite/bin/vite.js preview --host localhost --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] }
    }
  ]
});
