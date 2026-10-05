/* Build the site or one library target with the matching Vue style compiler.
 * Usage: pnpm build (site-dist), pnpm build:lib (both dist entries).
 * New components are discovered whenever Vite loads this configuration.
 */
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { generateExports } from "./scripts/components.js";

export default defineConfig(async ({ mode }) => {
  await generateExports();
  const library = mode === "lib" || mode === "elements";
  const elements = mode === "elements";
  const entryName = elements ? "feyo-elements" : "feyo";

  return {
    root: fileURLToPath(new URL("./", import.meta.url)),
    publicDir: library ? false : "public",
    // Ordinary Vue mounts need extracted CSS; only elements need component.styles.
    plugins: [vue({ customElement: elements })],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: library ? {
      outDir: "dist",
      // The Vue build clears old library files; the elements build preserves its CSS.
      emptyOutDir: !elements,
      lib: {
        entry: fileURLToPath(new URL(elements ? "./src/elements.js" : "./src/index.js", import.meta.url)),
        formats: ["es"],
        fileName: () => `${entryName}.js`,
        cssFileName: "style",
      },
      rolldownOptions: {
        external: elements ? [] : [/^vue(?:\/|$)/, /^@hugeicons\//],
      },
    } : {
      outDir: "site-dist",
    },
  };
});
