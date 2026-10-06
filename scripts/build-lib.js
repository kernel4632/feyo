/* Build both package entries sequentially with Vite's standard build API.
 * Usage: pnpm build:lib; prepack runs the same command before creating a package.
 * Vue writes dist/kima.js + style.css; elements adds the standalone browser module.
 */
import { build } from "vite";
import { fileURLToPath } from "node:url";

const configFile = fileURLToPath(new URL("../vite.config.js", import.meta.url));
await build({ configFile, mode: "lib" });
await build({ configFile, mode: "elements" });
