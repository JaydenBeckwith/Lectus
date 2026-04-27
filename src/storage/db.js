// ── Tiny IndexedDB key-value store ────────────────────────────────────────────
// Single object store keyed by string. Enough for the current shape of the
// library (papers list, theme prefs, profile metadata). If we ever need
// queryable indices over papers we can graduate to a proper store with
// indexes — until then, KV keeps the API trivial.

const DB_NAME = "lectus";
const DB_VERSION = 1;
const STORE = "kv";

let dbPromise = null;

const openDb = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
};

const tx = async (mode, fn) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const result = fn(store);
    t.oncomplete = () => resolve(result?.value ?? result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
};

export const getKV = async (key) => {
  try {
    return await tx("readonly", (store) => store.get(key));
  } catch (err) {
    console.warn(`[lectus] getKV(${key}) failed:`, err);
    return undefined;
  }
};

export const setKV = async (key, value) => {
  try {
    await tx("readwrite", (store) => store.put(value, key));
  } catch (err) {
    console.warn(`[lectus] setKV(${key}) failed:`, err);
  }
};

export const delKV = async (key) => {
  try {
    await tx("readwrite", (store) => store.delete(key));
  } catch (err) {
    console.warn(`[lectus] delKV(${key}) failed:`, err);
  }
};
