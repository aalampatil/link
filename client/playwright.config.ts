import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "test/browser",
  workers: 1,
  fullyParallel: false,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:55173",
    browserName: "chromium",
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node ../server/node_modules/tsx/dist/cli.mjs test/browser-stack.ts",
    url: "http://127.0.0.1:55173/test/harness.html",
    reuseExistingServer: false,
    timeout: 90000,
  },
});
