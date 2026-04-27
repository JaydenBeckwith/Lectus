// ── High-level persistence helpers ────────────────────────────────────────────
// Thin shims on top of the KV store that name what each slice of state means.
// Bumping SCHEMA_VERSION lets us migrate older saves later if the paper shape
// ever changes; for now we just compare and discard mismatches.

import { getKV, setKV } from "./db";

const SCHEMA_VERSION = 1;

const KEY_PAPERS = "papers";
const KEY_PREFS = "prefs";

export const loadPapers = async () => {
  const stored = await getKV(KEY_PAPERS);
  if (!stored || stored.version !== SCHEMA_VERSION || !Array.isArray(stored.papers)) {
    return null;
  }
  return stored.papers;
};

export const savePapers = (papers) =>
  setKV(KEY_PAPERS, { version: SCHEMA_VERSION, papers });

export const loadPrefs = async () => {
  const stored = await getKV(KEY_PREFS);
  if (!stored || typeof stored !== "object") return null;
  return stored;
};

export const savePrefs = (prefs) => setKV(KEY_PREFS, prefs);
