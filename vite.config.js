import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: mode === "lib" ? {
    lib: {
      entry: {
        feyo: fileURLToPath(new URL("./src/index.js", import.meta.url)),
        "feyo-elements": fileURLToPath(new URL("./src/elements.js", import.meta.url)),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: "style",
    },
    rolldownOptions: {
      external: [/^vue(?:\/|$)/, /^@hugeicons\//],
    },
  } : undefined,
}));
