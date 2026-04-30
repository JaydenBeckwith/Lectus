import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// SWC plugin variant — same fast-refresh, no Babel pipeline.
// `base: "./"` so the built index.html resolves assets relative to itself
// (required by Electron's file:// loader).
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 5173, strictPort: true, open: true },
});
