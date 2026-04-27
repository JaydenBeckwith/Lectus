// Electron main process. Creates a single BrowserWindow that loads either the
// Vite dev server (when VITE_DEV_SERVER_URL is set) or the built static files
// (when packaged). Keep this file CommonJS — Electron's main process supports
// ESM but the toolchain story is simpler with .cjs and the project's
// "type": "module" setting won't fight us.

const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const isDev = !!process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#07090b",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Open external links (anything not the loaded app) in the user's default
  // browser instead of inside the Electron window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // Standard cross-platform quit behaviour: stay alive on macOS, quit elsewhere.
  if (process.platform !== "darwin") app.quit();
});
