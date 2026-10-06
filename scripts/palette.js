/*
色板生成器：用一个种子色生成整套 Material You 角色色，写进 src/styles/_palette.scss。
想换主题色或换配色风格，只改下面这两个值；其他文件都不用动。
调用示例：
  node scripts/palette.js          # 重新生成 _palette.scss
  node scripts/palette.js --check  # 只比较，不写文件
*/
import { readFile, writeFile } from "node:fs/promises";
import {
  Hct,
  SchemeTonalSpot,
  SchemeMonochrome,
  MaterialDynamicColors,
  argbFromHex,
  hexFromArgb,
} from "@material/material-color-utilities";

// 唯一的主题色来源。
const seed = "#ffffff";

// 配色风格。换风格只改这一个词，不用碰下面的逻辑：
//   "tonal-spot" —— M3 默认，种子色的色相会带到整套色板里（青色种子就是青色主题）
//   "monochrome" —— 纯灰度，没有任何色相，只有明暗
//   "neutral"    —— 近灰度，留一点点色相
const variant = "monochrome";

// 各风格对应的生成器。
const generators = {
  "tonal-spot": SchemeTonalSpot,
  monochrome: SchemeMonochrome,
};

// 纯色系时把错误色也去色，否则它会是整套里唯一的彩色。
const colorless = variant === "monochrome" || variant === "neutral";

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
  const Scheme = generators[variant];
  const scheme = new Scheme(Hct.fromInt(argbFromHex(seed)), isDark, 0);
  const map = {};

  for (const role of roles) {
    let argb = MaterialDynamicColors[role].getArgb(scheme);
    // 纯色系时把 error 系列拉回灰度：它的色相跟主色板无关，
    // 留着它就会成为整套里唯一的彩色，破坏"没有任何颜色"。
    if (colorless && role.toLowerCase().includes("error")) {
      const tone = Hct.fromInt(argb).tone;      // tone 就是感知亮度
      argb = Hct.from(0, 0, tone).toInt();      // 彩度归零，明度不变
    }
    map[`kima-color-${cssName(role)}`] = hexFromArgb(argb);
  }
  return map;
}

/** 拼出完整的 _palette.scss 内容。 */
function buildFile() {
  const line = ([name, value]) => `  --${name}: ${value};`;
  return [
    "/* 由 scripts/palette.js 从种子色生成，不要手改。",
    ` * 种子色：${seed}，配色风格：${variant}。`,
    " * 换色只改 scripts/palette.js 里的 seed 和 variant，再运行 node scripts/palette.js。",
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
  console.log(`色板已是最新（种子 ${seed}，风格 ${variant}）`);
} else if (process.argv.includes("--check")) {
  console.error(`色板不是最新，请运行 node scripts/palette.js（种子 ${seed}，风格 ${variant}）`);
  process.exit(1);
} else {
  await writeFile(target, content);
  console.log(`已生成 src/styles/_palette.scss（种子 ${seed}，风格 ${variant}）`);
}
