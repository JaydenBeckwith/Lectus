import { getKV, setKV } from "./db";

const SCHEMA_VERSION = 1;
const KEY_PAPERS = "papers";
const KEY_PREFS = "prefs";
const KEY_PROJECTS = "projects";

export const loadPapers = async () => {
  const stored = await getKV(KEY_PAPERS);
  if (!stored || stored.version !== SCHEMA_VERSION || !Array.isArray(stored.papers)) return null;
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

// Projects = EndNote-style groups. Each project is { id, name, createdAt }.
// Per-paper membership lives on the paper itself (paper.projects: string[])
// so a paper can belong to multiple projects without duplication.
export const loadProjects = async () => {
  const stored = await getKV(KEY_PROJECTS);
  if (!stored || stored.version !== SCHEMA_VERSION || !Array.isArray(stored.projects)) return null;
  return stored.projects;
};

export const saveProjects = (projects) =>
  setKV(KEY_PROJECTS, { version: SCHEMA_VERSION, projects });
