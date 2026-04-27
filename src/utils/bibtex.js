// ── BibTeX serialise / parse ─────────────────────────────────────────────────
// We aim to interoperate with Zotero / Mendeley exports, not to be a complete
// BibTeX implementation. The parser handles the common shape:
//
//   @article{citekey,
//     title    = {Some Title},
//     author   = {Last, First and Last, First},
//     journal  = "Cancer Cell",
//     year     = 2023,
//     doi      = {10.1016/...},
//     keywords = {tag1, tag2},
//     abstract = {...},
//     note     = {...}
//   }
//
// Edge cases skipped on purpose: @string concat, %comments, custom command
// expansion, deeply nested braces. Anything we don't recognise is ignored.

const BIBTEX_ESCAPES = [
  [/\\/g, "\\textbackslash{}"],
  [/&/g, "\\&"],
  [/%/g, "\\%"],
  [/\$/g, "\\$"],
  [/#/g, "\\#"],
  [/_/g, "\\_"],
  [/\{/g, "\\{"],
  [/\}/g, "\\}"],
];

const escape = (s = "") => BIBTEX_ESCAPES.reduce((acc, [re, rep]) => acc.replace(re, rep), String(s));

const slugAuthor = (authors) => {
  const first = (authors || "").split(",")[0].trim().split(/\s+/);
  return (first[0] || "anon").toLowerCase().replace(/[^a-z0-9]/g, "");
};

const citeKey = (p) => `${slugAuthor(p.authors)}${p.year || ""}_${(p.id || "").replace(/\W+/g, "")}`;

// Convert "Last, First; Last, First" or "First Last, First Last" to BibTeX
// "Last, First and Last, First" form. Best-effort — preserves what's there.
const formatAuthorsForBibtex = (s = "") =>
  s
    .replace(/\s*et\s+al\.?\s*$/i, "")
    .split(/\s*[,;]\s*/)
    .filter(Boolean)
    .join(" and ");

export const papersToBibtex = (papers) =>
  papers
    .map((p) => {
      const fields = [
        ["title", p.title],
        ["author", formatAuthorsForBibtex(p.authors)],
        ["journal", p.journal],
        ["year", p.year],
        ["doi", p.doi],
        ["abstract", p.abstract],
        ["keywords", (p.tags || []).join(", ")],
        ["note", p.notes],
      ].filter(([, v]) => v !== undefined && v !== null && v !== "");

      const body = fields
        .map(([k, v]) => {
          if (k === "year" && /^\d+$/.test(String(v))) return `  ${k} = {${v}}`;
          return `  ${k} = {${escape(v)}}`;
        })
        .join(",\n");

      return `@article{${citeKey(p)},\n${body}\n}`;
    })
    .join("\n\n");

// ── Parser ───────────────────────────────────────────────────────────────────

// Walk the input from `start`, returning the substring up to the matching
// closing brace plus the index after it. Tracks brace depth.
const readBracedValue = (input, start) => {
  let depth = 1;
  let i = start;
  while (i < input.length && depth > 0) {
    const ch = input[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return [input.slice(start, i), i + 1];
    } else if (ch === "\\" && i + 1 < input.length) {
      i++; // skip escaped char
    }
    i++;
  }
  return [input.slice(start, i), i];
};

const readQuotedValue = (input, start) => {
  let i = start;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "\\" && i + 1 < input.length) {
      i += 2;
      continue;
    }
    if (ch === '"') return [input.slice(start, i), i + 1];
    i++;
  }
  return [input.slice(start, i), i];
};

const readBareValue = (input, start) => {
  let i = start;
  while (i < input.length && !/[,\s}]/.test(input[i])) i++;
  return [input.slice(start, i), i];
};

const stripBraces = (s = "") => s.replace(/[{}]/g, "");

const cleanValue = (raw) =>
  stripBraces(raw)
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\\$/g, "$")
    .replace(/\\#/g, "#")
    .replace(/\\_/g, "_")
    .replace(/\\textbackslash\{\}/g, "\\")
    .replace(/\s+/g, " ")
    .trim();

// Convert "Last, First and Last, First" → "First Last, First Last".
const normaliseAuthors = (s = "") =>
  s
    .split(/\s+and\s+/i)
    .map((person) => {
      const parts = person.split(",").map((x) => x.trim());
      if (parts.length === 2) return `${parts[1]} ${parts[0]}`.trim();
      return person.trim();
    })
    .filter(Boolean)
    .join(", ");

const splitTags = (s = "") =>
  s
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);

// Returns an array of paper-shaped objects. Caller decides what to do with
// duplicates (we de-dupe by DOI in App.jsx).
export const parseBibtex = (input) => {
  const papers = [];
  let i = 0;
  while (i < input.length) {
    // Find next @entry
    const at = input.indexOf("@", i);
    if (at === -1) break;
    const braceStart = input.indexOf("{", at);
    if (braceStart === -1) break;
    const entryType = input.slice(at + 1, braceStart).trim().toLowerCase();
    if (!entryType) {
      i = braceStart + 1;
      continue;
    }

    // Read the whole entry body
    const [body, after] = readBracedValue(input, braceStart + 1);
    i = after;

    // Skip @string, @preamble, @comment
    if (["string", "preamble", "comment"].includes(entryType)) continue;

    // First token of body up to the first comma is the cite key (we ignore it
    // beyond using it as a fallback id).
    const firstComma = body.indexOf(",");
    const citeKey = firstComma === -1 ? body.trim() : body.slice(0, firstComma).trim();
    const fieldText = firstComma === -1 ? "" : body.slice(firstComma + 1);

    // Walk the field=value pairs.
    const fields = {};
    let p = 0;
    while (p < fieldText.length) {
      // skip whitespace and commas
      while (p < fieldText.length && /[\s,]/.test(fieldText[p])) p++;
      if (p >= fieldText.length) break;
      // read field name
      const nameStart = p;
      while (p < fieldText.length && /[A-Za-z0-9_-]/.test(fieldText[p])) p++;
      const name = fieldText.slice(nameStart, p).toLowerCase();
      if (!name) break;
      // skip = and whitespace
      while (p < fieldText.length && /[\s=]/.test(fieldText[p])) p++;
      if (p >= fieldText.length) break;
      // read value
      let value = "";
      const ch = fieldText[p];
      if (ch === "{") {
        const [v, next] = readBracedValue(fieldText, p + 1);
        value = v;
        p = next;
      } else if (ch === '"') {
        const [v, next] = readQuotedValue(fieldText, p + 1);
        value = v;
        p = next;
      } else {
        const [v, next] = readBareValue(fieldText, p);
        value = v;
        p = next;
      }
      fields[name] = cleanValue(value);
    }

    const title = fields.title || "(untitled)";
    const authors = normaliseAuthors(fields.author || fields.editor || "Unknown");
    const tags = splitTags(fields.keywords || fields.keyword || "");
    const yearMatch = (fields.year || fields.date || "").match(/\d{4}/);

    papers.push({
      id: `bib_${Date.now()}_${papers.length}`,
      title,
      authors,
      journal: fields.journal || fields.booktitle || fields["container-title"] || "",
      year: yearMatch ? Number(yearMatch[0]) : null,
      doi: fields.doi || "",
      tags: tags.length ? tags : ["imported"],
      abstract: fields.abstract || "",
      keyFindings: [],
      notes: fields.note || fields.annote || "",
      highlights: [],
      status: "to-read",
      _bibKey: citeKey,
    });
  }
  return papers;
};
