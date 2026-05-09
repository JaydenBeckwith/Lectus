const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const fsp = require("node:fs/promises");

// Pin a stable app name so dev (`electron .`) and the packaged build share
// the same userData directory — otherwise IDB and the JSON backup live in
// different folders and switching builds looks like data loss.
app.setName("Lectus");

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
  // Decide what to do when something inside the app calls window.open().
  //
  // Default: open the URL in the user's real browser so DOI / journal links
  // don't trap the user inside Electron.
  //
  // Exception: Puter.js's auth flow opens a popup at puter.com so the user
  // can log in (or continue as guest), and then posts the session back to
  // window.opener. If we external-launch that popup, the auth token gets
  // set on puter.com in the user's *system* browser and never reaches our
  // BrowserWindow — so Puter's free AI provider never works on desktop.
  // For Puter (and only Puter) we allow the popup to open as an internal
  // BrowserWindow so it can talk back to our renderer.
  const isPuterAuthUrl = (url) => {
    try {
      const u = new URL(url);
      // puter.com, *.puter.com — be permissive about subdomains since
      // their login flow occasionally redirects through api.puter.com etc.
      return u.protocol === "https:" && /(^|\.)puter\.com$/i.test(u.hostname);
    } catch {
      return false;
    }
  };
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isPuterAuthUrl(url)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 480,
          height: 640,
          parent: win,
          modal: false,
          autoHideMenuBar: true,
          webPreferences: {
            // Standard isolation — same as the main window. The popup needs
            // none of our preload IPC; it's just a webview for puter.com.
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        },
      };
    }
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

// Save-on-quit handshake.
//
// When the user closes the app (Cmd/Ctrl-Q, window close, taskbar) we
// pause for a beat to let the renderer flush any pending IndexedDB +
// JSON-file writes. The renderer subscribes via window.lectus.onFlushBeforeQuit
// and calls acknowledgeFlush() once its save resolves. We add a short
// safety timeout so a hung renderer never wedges quit forever.
let isQuittingFlushed = false;
app.on("before-quit", (e) => {
  if (isQuittingFlushed) return; // second pass — proceed
  const wins = BrowserWindow.getAllWindows();
  if (!wins.length) return;
  e.preventDefault();
  let timeout;
  const finish = () => {
    if (isQuittingFlushed) return;
    isQuittingFlushed = true;
    if (timeout) clearTimeout(timeout);
    ipcMain.removeAllListeners("lectus:flushBeforeQuitDone");
    app.quit();
  };
  ipcMain.once("lectus:flushBeforeQuitDone", finish);
  for (const w of wins) {
    try { w.webContents.send("lectus:flushBeforeQuit"); } catch {}
  }
  // Hard cap: 1.5 s. A debounced save is ~150 ms; a JSON file write is
  // a few ms. We never want to make the user wait longer than that.
  timeout = setTimeout(finish, 1500);
});
