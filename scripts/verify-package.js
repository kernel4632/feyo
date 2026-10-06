/* Check the actual built package, including SSR imports and stylesheet isolation.
 * Usage after pnpm build:lib: node scripts/verify-package.js.
 * Fails when discovered components are missing, Vue CSS is lost, or the browser
 * entry starts depending on another module instead of being standalone.
 */
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { babelParse } from "vue/compiler-sfc";
import * as library from "../dist/feyo.js";
import { elements } from "../dist/feyo-elements.js";

const root = new URL("../", import.meta.url);
const css = await readFile(new URL("dist/style.css", root), "utf8");
const browserCode = await readFile(new URL("dist/feyo-elements.js", root), "utf8");
const browserImports = babelParse(browserCode, { sourceType: "module" }).program.body
  .filter((node) => node.type === "ImportDeclaration" || node.source);
assert.equal(browserImports.length, 0, "Browser entry must not import other modules");
assert.doesNotMatch(browserCode, /\bimport\s*\(/, "Browser entry must not lazy-load dependencies");
assert.deepEqual(library.componentNames, Object.keys(library).filter((name) => name !== "componentNames"));
assert.equal(library.componentNames.length, Object.keys(elements).length);
assert.match(css, /--feyo-color-primary:/);
assert.doesNotMatch(css, /(?:^|\})\s*(?:html|body|\*)(?:[\s,{.:>])/, "Library CSS must not reset the host page");

// Check against the folder, not a second component list that could become stale.
let discovered = 0;
const folder = new URL("src/components/", root);
for (const file of await readdir(folder)) {
  if (!file.endsWith(".ce.vue")) continue;                                  // 只看组件文件
  const tag = `feyo-${file.slice(0, -".ce.vue".length)}`;                   // 文件名就是标签名
  const name = `Feyo${tag.slice(5).split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join("")}`;
  assert.ok(library[name], `Missing named Vue export ${name}`);
  assert.equal(library[name].styles, undefined, `${name} must use extracted Vue CSS`);
  assert.ok(elements[tag]?.styles?.length, `Missing inline element CSS for ${tag}`);
  assert.ok(css.includes(library[name].__scopeId), `Missing scoped Vue CSS for ${name}`);
  discovered++;
}
assert.equal(discovered, library.componentNames.length, "Build is stale; rebuild after adding/removing components");
console.log(`Verified ${discovered} components, extracted Vue CSS, inline element CSS, SSR imports, and a standalone browser module.`);
