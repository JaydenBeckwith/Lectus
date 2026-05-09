// Preload script — runs in an isolated context with access to a subset of
// Node APIs and contextBridge. Exposes a tiny `window.lectus` object to
// the renderer so it can persist the library to a JSON file in userData
// (the durable backup behind IndexedDB) and trigger a save-on-close flush.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lectus", {
  // Library JSON file backup (sibling of IndexedDB — survives reinstalls
  // and per-origin storage clears).
  saveLibrary: (json) => ipcRenderer.invoke("lectus:saveLibrary", json),
  loadLibrary: () => ipcRenderer.invoke("lectus:loadLibrary"),
  libraryPath: () => ipcRenderer.invoke("lectus:libraryPath"),

  // Main process tells the renderer "we're about to quit — flush any
  // pending writes". The renderer subscribes via this helper and replies
  // by calling acknowledgeFlush() once the in-flight save resolves.
  onFlushBeforeQuit: (handler) => {
    const wrapped = () => handler();
    ipcRenderer.on("lectus:flushBeforeQuit", wrapped);
    // Return an unsubscribe so React effects can clean up cleanly.
    return () => ipcRenderer.removeListener("lectus:flushBeforeQuit", wrapped);
  },
  acknowledgeFlush: () => ipcRenderer.send("lectus:flushBeforeQuitDone"),
});
