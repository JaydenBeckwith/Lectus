const bridge = () => (typeof window !== "undefined" && window.lectus ? window.lectus : null);

export const isElectron = () => Boolean(bridge());

export const saveLibraryToFile = async (papers) => {
  const b = bridge();
  if (!b) return null;
  const payload = JSON.stringify(
    { app: "lectus", version: 1, savedAt: new Date().toISOString(), papers },
    null,
    2
  );
  return b.saveLibrary(payload);
};

export const loadLibraryFromFile = async () => {
  const b = bridge();
  if (!b) return null;
  const raw = await b.loadLibrary();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.papers) ? parsed.papers : null;
  } catch {
    return null;
  }
};

export const getLibraryPath = async () => {
  const b = bridge();
  if (!b) return null;
  return b.libraryPath();
};
