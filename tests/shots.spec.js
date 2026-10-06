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

  // 换主题色：点第 2 个种子色（紫），确认整套色板跟着变。
  // 这一步验证的是"运行时换色"这条路是通的，不是只有构建期能换。
  const secondSeed = page.locator(".kima-gallery__seed").nth(1);
  if (await secondSeed.count()) {
    await secondSeed.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: "shots/theme-purple.png" });
    // 点回第一个（青蓝）供后面的截图用。
    await page.locator(".kima-gallery__seed").first().click();
    await page.waitForTimeout(300);
  }

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

  // 图标线宽：把图标按钮那一排按 3 倍像素密度拍下来，
  // 放大看才能判断 2px 的线到底够不够粗。
  const iconButtons = page.locator(".kima-icon-button");
  if (await iconButtons.count()) {
    const first = iconButtons.first();
    await first.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await first.boundingBox();
    const count = Math.min(await iconButtons.count(), 6);
    await page.screenshot({
      path: "shots/icons-zoom.png",
      // 截取从第一个图标按钮往右的一段，高度留出上下边距。
      clip: { x: box.x - 10, y: box.y - 14, width: (box.width + 20) * count, height: box.height + 28 },
    });
  }

  // 切浅色再拍一遍，确认两套主题都正常
  await page.evaluate(() => {
    document.documentElement.dataset.kimaTheme = "light";
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shots/base-light.png" });
  await buttonGroup.screenshot({ path: "shots/button-group-light.png" });

  // 打开下拉，放大拍一张，确认弹层是实色、背后文字不会透上来。
  await page.evaluate(() => {
    document.documentElement.dataset.kimaTheme = "dark";
  });
  const selectTrigger = page.locator(".kima-select__trigger").first();
  if (await selectTrigger.count()) {
    await selectTrigger.scrollIntoViewIfNeeded();
    await selectTrigger.click();
    await page.waitForTimeout(400);
    // 只拍触发器加下拉这一块，放大看清字有没有跟背后的内容叠在一起。
    const triggerBox = await selectTrigger.boundingBox();
    await page.screenshot({
      path: "shots/popup-dark.png",
      clip: {
        x: Math.max(0, triggerBox.x - 16),
        y: Math.max(0, triggerBox.y - 16),
        width: 420,
        height: 380,
      },
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // 纵向那一条单独放大拍，用来确认首末段的圆角和内部分隔线。
  const verticalGroup = page.locator(".kima-button-group--vertical").first();
  await page.waitForTimeout(300);
  await verticalGroup.screenshot({ path: "shots/button-group-vertical.png", scale: "css" });
  const box = await verticalGroup.boundingBox();
  await page.screenshot({
    path: "shots/button-group-vertical-zoom.png",
    clip: { x: box.x - 12, y: box.y - 12, width: box.width + 24, height: box.height + 24 },
  });
});
