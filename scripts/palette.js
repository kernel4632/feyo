/*
色板生成器：用一个种子色生成整套 Material You 角色色，写进 src/styles/_palette.scss。
想换主题色，只改下面的 seed；其他文件都不用动。
调用示例：
  node scripts/palette.js        # 重新生成 _palette.scss
  node scripts/palette.js --check  # 只比较，不写文件（构建时用，package.json 的 prepalette 挂钩）
*/
import { readFile, writeFile } from "node:fs/promises";
import {
  Hct,
  SchemeTonalSpot,
  MaterialDynamicColors,
  argbFromHex,
  hexFromArgb,
} from "@material/material-color-utilities";

// 唯一的主题色来源。
const seed = "#61afef";

// 只导出组件真正用得到的角色：表面、文字、描边、强调色、错误色。
const roles = [
  "surface",                    // 页面背景
  "surfaceContainerLowest",     // 最低层容器
  "surfaceContainerLow",        // 低层容器
  "surfaceContainer",           // 主容器（卡片、侧栏）
  "surfaceContainerHigh",       // 高层容器（悬停、菜单）
  "surfaceContainerHighest",    // 最高层容器（抽屉、弹窗）
  "onSurface",                  // 主文字
  "onSurfaceVariant",           // 次要文字
  "outline",                    // 强描边
  "outlineVariant",             // 弱描边
  "primary",                    // 主操作
  "onPrimary",
  "primaryContainer",           // 柔和主操作
  "onPrimaryContainer",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "inverseSurface",
  "inverseOnSurface",
  "scrim",                      // 抽屉背后的遮罩
];

/** 把驼峰角色名转成 CSS 变量用的连字符写法：surfaceContainerHigh → surface-container-high */
function cssName(role) {
  return role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** 用一个种子生成某个明暗模式的全部颜色，返回变量名到十六进制值的映射。 */
function colors(isDark) {
  const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), isDark, 0);
  const map = {};
  for (const role of roles) {
    map[`kima-color-${cssName(role)}`] = hexFromArgb(MaterialDynamicColors[role].getArgb(scheme));
  }
  return map;
}

/** 拼出完整的 _palette.scss 内容。 */
function buildFile() {
  const line = ([name, value]) => `  --${name}: ${value};`;
  return [
    "/* 由 scripts/palette.js 从种子色生成，不要手改。",
    ` * 种子色：${seed}（改 scripts/palette.js 里的 seed 后重新运行 node scripts/palette.js）。`,
    " * 深色是默认模式，浅色由 :root[data-kima-theme=\"light\"] 覆盖。",
    " */",
    ":root {",
    ...Object.entries(colors(true)).map(line),
    "}",
    "",
    ':root[data-kima-theme="light"] {',
    ...Object.entries(colors(false)).map(line),
    "}",
    "",
  ].join("\n");
}

const target = new URL("../src/styles/_palette.scss", import.meta.url);
const content = buildFile();
const current = await readFile(target, "utf8").catch(() => "");
if (current === content) {
  console.log(`色板已是最新（种子 ${seed}）`);
} else if (process.argv.includes("--check")) {
  console.error(`色板不是最新，请运行 node scripts/palette.js（种子 ${seed}）`);
  process.exit(1);
} else {
  await writeFile(target, content);
  console.log(`已生成 src/styles/_palette.scss（种子 ${seed}）`);
}
