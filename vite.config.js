/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// SWC plugin variant — same fast-refresh, no Babel pipeline.
// `base: "./"` so the built index.html resolves assets relative to itself
// (required by Electron's file:// loader).
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 5173, strictPort: true, open: true },

  // Skip the previous-build artefacts when Vite scans for entries — otherwise
  // it tries to parse `release/win-unpacked/LICENSES.chromium.html` and
  // friends. Also keeps the Vitest output focused on src/.
  optimizeDeps: { entries: ["index.html", "src/**/*.{js,jsx}"] },

  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{js,jsx}"],
    // Don't run on the bundled/electron-builder output if anything sneaks in.
    exclude: ["node_modules", "dist", "release", "release/**"],
  },
});
