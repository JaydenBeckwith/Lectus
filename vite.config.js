import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
//
// `base: "./"` so the built index.html resolves assets relative to itself.
// That's required by Electron's file:// loader (and is harmless when serving
// the build over plain HTTP).
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
});
