import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    cssCodeSplit: false,
    sourcemap: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: "iife",
        name: "JiaClanXhs",
        entryFileNames: "assets/main.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (info) => {
          if (info.name?.endsWith(".css")) return "assets/style.css";
          return "assets/[name][extname]";
        },
        inlineDynamicImports: true,
      },
    },
  },
});
