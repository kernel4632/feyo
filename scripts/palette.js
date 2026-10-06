/*
色板生成器：把默认主题色写进 src/styles/_palette.scss，作为首屏和 SSR 的初始颜色。
用户运行时想换色，用 src/utils/theme.js 的 applyPalette()，不用重新构建。
颜色逻辑和角色名单都在 src/utils/theme.js 里，这里只管"写文件"，不重复定义。
调用示例：
  node scripts/palette.js          # 重新生成 _palette.scss
  node scripts/palette.js --check  # 只比较，不写文件（构建流程里用来确认产物是最新的）
*/
import { readFile, writeFile } from "node:fs/promises";
import { defaultSeed, defaultVariant, generatePalette } from "../src/utils/theme.js";

/** 拼出完整的 _palette.scss 内容。 */
function buildFile() {
  const block = (isDark) => Object.entries(generatePalette(defaultSeed, { isDark }))
    .map(([name, value]) => `  --kima-color-${name}: ${value};`);

  return [
    "/* 由 scripts/palette.js 生成，不要手改。",
    ` * 默认主题色：${defaultSeed}，配色风格：${defaultVariant}。`,
    " * 改默认色只改 src/utils/theme.js 里的 defaultSeed / defaultVariant，再运行 node scripts/palette.js。",
    " * 运行时换色用 src/utils/theme.js 的 applyPalette()，不用重新构建。",
    " * 深色是默认模式，浅色由 :root[data-kima-theme=\"light\"] 覆盖。",
    " */",
    ":root {",
    ...block(true),
    "}",
    "",
    ':root[data-kima-theme="light"] {',
    ...block(false),
    "}",
    "",
  ].join("\n");
}

const target = new URL("../src/styles/_palette.scss", import.meta.url);
const content = buildFile();
const current = await readFile(target, "utf8").catch(() => "");

if (current === content) {
  console.log(`色板已是最新（${defaultSeed}，${defaultVariant}）`);
} else if (process.argv.includes("--check")) {
  console.error(`色板不是最新，请运行 node scripts/palette.js（${defaultSeed}，${defaultVariant}）`);
  process.exit(1);
} else {
  await writeFile(target, content);
  console.log(`已生成 src/styles/_palette.scss（${defaultSeed}，${defaultVariant}）`);
}
