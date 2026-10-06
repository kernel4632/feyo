/*
基础层截图：把预览页的深色和浅色各拍一张，放在 shots/ 里给用户看。
用法：先启动 pnpm dev，再运行 pnpm exec playwright test tests/shots.spec.js
改完 token 或组件后重跑，就能对比前后效果。
*/
import { expect, test } from "@playwright/test";

test("拍下基础层的深色与浅色效果", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".kima-gallery")).toBeVisible();

  await page.screenshot({ path: "shots/base-dark.png", fullPage: false });

  // 预览页的主题开关会改 html 上的 data-kima-theme，直接改属性就是切浅色。
  await page.evaluate(() => {
    document.documentElement.dataset.kimaTheme = "light";
  });
  await page.screenshot({ path: "shots/base-light.png", fullPage: false });
});
