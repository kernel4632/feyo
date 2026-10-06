/*
截图：把预览页的几张关键画面拍下来放进 shots/，用于跟用户确认视觉效果。
用法：pnpm shots（会自己起一个预览页服务器）。
改完 token 或组件后重跑，就能看前后对比。
*/
import { expect, test } from "@playwright/test";

test("拍下基础层与按钮组的深色、浅色效果", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".kima-gallery")).toBeVisible();

  // 首屏：基础层（色板、字体阶梯、圆角层级）
  await page.screenshot({ path: "shots/base-dark.png" });

  // 按钮组：重点看整条是否连贯、外侧是不是满圆
  const buttonGroup = page.locator("#actions");
  await buttonGroup.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await buttonGroup.screenshot({ path: "shots/button-group-dark.png" });

  // 表单输入区：输入框、复选框、开关改成"透明度分层"后最值得看的地方
  const form = page.locator("#form");
  await form.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await form.screenshot({ path: "shots/form-dark.png" });

  // 切浅色再拍一遍，确认两套主题都正常
  await page.evaluate(() => {
    document.documentElement.dataset.kimaTheme = "light";
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shots/base-light.png" });
  await buttonGroup.screenshot({ path: "shots/button-group-light.png" });

  // 纵向那一条单独放大拍，用来确认首末段的圆角和内部分隔线。
  const verticalGroup = page.locator(".kima-button-group--vertical").first();
  await page.evaluate(() => {
    document.documentElement.dataset.kimaTheme = "dark";
  });
  await page.waitForTimeout(300);
  await verticalGroup.screenshot({ path: "shots/button-group-vertical.png", scale: "css" });
  const box = await verticalGroup.boundingBox();
  await page.screenshot({
    path: "shots/button-group-vertical-zoom.png",
    clip: { x: box.x - 12, y: box.y - 12, width: box.width + 24, height: box.height + 24 },
  });
});
