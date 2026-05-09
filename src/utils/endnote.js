// ── EndNote / RIS parser ─────────────────────────────────────────────────────
// Two related text formats EndNote (and Zotero / Mendeley / PubMed / Web of
// Science) commonly export.
//
// `.enw` (EndNote tagged):
//
//     %0 Journal Article
//     %T Pembrolizumab in advanced melanoma
//     %A Smith, John
//     %A Doe, Alice
//     %J NEJM
//     %D 2020
//     %R 10.1056/NEJMoa1234567
//     %K melanoma
//     %K immunotherapy
//     %X Abstract text…
//
// `.ris`:
//
//     TY  - JOUR
//     T1  - Pembrolizumab in advanced melanoma
//     AU  - Smith, John
//     AU  - Doe, Alice
//     JO  - NEJM
//     PY  - 2020
//     DO  - 10.1056/NEJMoa1234567
//     KW  - melanoma
//     KW  - immunotherapy
//     AB  - Abstract text…
//     ER  -
//
// We accept either, auto-detected from the first line. Multi-line values are
// joined with spaces; %A / AU repeat per author; %K / KW repeat per keyword.

const ENW_FIELDS = {
  T: "title",
  A: "author",
  J: "journal",
  B: "journal", // book / secondary title — used by some exporters as journal-equivalent
  D: "year",
  V: "volume",
  P: "pages",
  R: "doi",
  U: "url",
  K: "keyword",
  X: "abstract",
  Z: "notes",
  N: "notes", // some exporters use %N for notes; we accept it
  I: "publisher",
  // We deliberately ignore %0 (record type) — Lectus treats every record as
  // a paper. Same for %@, %M, %9 — esoteric and rarely useful here.
};

const RIS_FIELDS = {
  TI: "title",
  T1: "title",
  AU: "author",
  A1: "author",
  JO: "journal",
  JF: "journal",
  T2: "journal",
  PY: "year",
  Y1: "year",
  VL: "volume",
  IS: "issue",
  SP: "pages",
  DO: "doi",
  UR: "url",
  KW: "keyword",
  AB: "abstract",
  N1: "notes",
  N2: "abstract", // some exporters put the abstract in N2
  PB: "publisher",
};

const yearFrom = (raw) => {
  const m = String(raw || "").match(/\d{4}/);
  return m ? Number(m[0]) : null;
};

const splitTagsField = (raw) =>
  String(raw || "")
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);

// Given the lines of a single record + which dictionary, accumulate fields.
// Continuation lines (no tag) append to the previous field with a space.
const accumulate = (lines, getTag) => {
  const acc = { authors: [], keywords: [] };
  let lastKey = null;

  const push = (key, value) => {
    if (!value) return;
    if (key === "author") acc.authors.push(value);
    else if (key === "keyword") {
      // Some exporters jam multiple keywords into one line separated by ; / ,
      const parts = splitTagsField(value);
      if (parts.length > 1) acc.keywords.push(...parts);
      else acc.keywords.push(value);
    } else if (acc[key]) acc[key] = acc[key] + " " + value;
    else acc[key] = value;
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim()) {
      lastKey = null;
      continue;
    }
    const parsed = getTag(line);
    if (parsed) {
      push(parsed.key, parsed.value);
      // Repeating-key fields don't have a "last" we can append to.
      lastKey = parsed.key === "author" || parsed.key === "keyword" ? null : parsed.key;
    } else if (lastKey) {
      // Continuation of the previous field.
      push(lastKey, line.trim());
    }
  }

  return acc;
};

const enwTag = (line) => {
  // EndNote tagged: %X value
  if (line[0] !== "%") return null;
  const code = line[1];
  const key = ENW_FIELDS[code];
  if (!key) return null;
  const value = line.slice(2).trim();
  return { key, value };
};

const risTag = (line) => {
  // RIS: "AU  - value" (two-letter tag, two spaces, dash, space).
  const m = line.match(/^([A-Z][A-Z0-9])\s+-\s?(.*)$/);
  if (!m) return null;
  const tag = m[1];
  if (tag === "ER") return { key: "__end__", value: "" };
  if (tag === "TY") return null; // record type — ignored
  const key = RIS_FIELDS[tag];
  if (!key) return null;
  return { key, value: m[2].trim() };
};

// Split into records. ENW records are separated by one or more blank lines.
// RIS records are explicitly terminated by `ER  -` lines.
const splitEnwRecords = (text) => {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split(/\r?\n/).filter((l) => l.trim().length > 0))
    .filter((lines) => lines.length > 0);
};

const splitRisRecords = (text) => {
  const records = [];
  let current = [];
  for (const raw of text.split(/\r?\n/)) {
    if (/^ER\s+-/.test(raw)) {
      if (current.length) records.push(current);
      current = [];
    } else {
      current.push(raw);
    }
  }
  // Some files don't end with ER — keep what's left if it has any tagged lines.
  if (current.length && current.some((l) => /^[A-Z][A-Z0-9]\s+-/.test(l))) records.push(current);
  return records;
};

// Decide which dialect the input is.
const detectFormat = (text) => {
  const head = text.slice(0, 2000);
  if (/^\s*TY\s+-/m.test(head)) return "ris";
  if (/^\s*%[A-Z0-9]\s/m.test(head)) return "enw";
  return null;
};

const buildPaper = (acc, idx) => ({
  id: `enw_${Date.now()}_${idx}`,
  title: acc.title || "(untitled)",
  authors: acc.authors.length ? acc.authors.join(", ") : "Unknown",
  journal: acc.journal || "",
  year: yearFrom(acc.year),
  doi: acc.doi || "",
  tags: acc.keywords.length ? acc.keywords : ["imported"],
  abstract: acc.abstract || "",
  keyFindings: [],
  methods: "",
  results: "",
  discussion: "",
  notes: acc.notes || "",
  highlights: [],
  status: "to-read",
});

export const parseEndnoteOrRis = (text) => {
  if (!text || !text.trim()) return [];
  const fmt = detectFormat(text);
  if (!fmt) return [];

  const records = fmt === "ris" ? splitRisRecords(text) : splitEnwRecords(text);
  const getTag = fmt === "ris" ? risTag : enwTag;

  return records.map((lines, i) => buildPaper(accumulate(lines, getTag), i));
};

// Helper for callers that want to know if an input looks like EndNote/RIS
// before committing to a parse. Returns "enw" | "ris" | null.
export const detectEndnoteFormat = detectFormat;
