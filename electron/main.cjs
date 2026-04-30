const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const fsp = require("node:fs/promises");

const isDev = !!process.env.VITE_DEV_SERVER_URL;
const libraryPath = () => path.join(app.getPath("userData"), "lectus-library.json");

ipcMain.handle("lectus:saveLibrary", async (_evt, json) => {
  const target = libraryPath();
  await fsp.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp`;
  await fsp.writeFile(tmp, json, "utf8");
  await fsp.rename(tmp, target);
  return { ok: true, path: target };
});

ipcMain.handle("lectus:loadLibrary", async () => {
  const target = libraryPath();
  if (!fs.existsSync(target)) return null;
  return fsp.readFile(target, "utf8");
});

ipcMain.handle("lectus:libraryPath", async () => libraryPath());

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
  if (process.platform !== "darwin") app.quit();
});
