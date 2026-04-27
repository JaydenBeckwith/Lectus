// Preload script — runs in an isolated context with access to a subset of Node
// APIs. Currently empty: the renderer doesn't need privileged APIs yet. When we
// graduate to local SQLite, native PDF picking, or filesystem access, expose
// the bridge here via contextBridge.exposeInMainWorld.

// Example for future use:
//
//   const { contextBridge, ipcRenderer } = require("electron");
//   contextBridge.exposeInMainWorld("lectus", {
//     openPdf: () => ipcRenderer.invoke("lectus:openPdf"),
//   });
