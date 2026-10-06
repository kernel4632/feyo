// Browser regressions against the real Vite source entry: pnpm exec playwright test.
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.KIMA_TEST_PORT || 5188);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  // 截图脚本是给人看的，不参与 pnpm test；单独用 pnpm shots 跑。
  testIgnore: "**/shots.spec.js",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" } },
  ],
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/tests/fixture.html`,
    reuseExistingServer: false,
  },
});
