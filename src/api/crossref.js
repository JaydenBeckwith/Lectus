// ── CrossRef DOI lookup ──────────────────────────────────────────────────────
// CrossRef's public API is free and unauthenticated. They politely ask that
// clients identify themselves so they can contact you if you cause problems —
// pass a mailto via the User-Agent string. Because the browser ignores the
// User-Agent header, we use the `mailto` query param instead, which is
// equally honoured by CrossRef.

const CROSSREF_BASE = "https://api.crossref.org/works/";
const POLITE_MAILTO = "lectus@example.local"; // override by editing locally

const stripJatsTags = (s = "") =>
  s
    .replace(/<jats:[^>]+>/g, "")
    .replace(/<\/jats:[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const formatAuthors = (authors = []) => {
  if (!authors.length) return "Unknown";
  const names = authors.slice(0, 3).map((a) => {
    if (a.family && a.given) return `${a.family} ${a.given.split(" ").map((p) => p[0]).join("")}`;
    return a.family || a.name || "";
  });
  return authors.length > 3 ? `${names.join(", ")}, et al.` : names.join(", ");
};

const yearFromIssued = (msg) => {
  const parts =
    msg["published-print"]?.["date-parts"]?.[0] ||
    msg["published-online"]?.["date-parts"]?.[0] ||
    msg.issued?.["date-parts"]?.[0];
  return Array.isArray(parts) ? Number(parts[0]) : null;
};

const cleanDoi = (raw) => {
  let s = String(raw || "").trim();
  s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  s = s.replace(/^doi:\s*/i, "");
  return s;
};

export const lookupDoi = async (rawDoi) => {
  const doi = cleanDoi(rawDoi);
  if (!doi) throw new Error("Empty DOI");
  const url = `${CROSSREF_BASE}${encodeURIComponent(doi)}?mailto=${encodeURIComponent(POLITE_MAILTO)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`DOI not found: ${doi}`);
    throw new Error(`CrossRef ${res.status}`);
  }
  const data = await res.json();
  const m = data.message || {};
  return {
    title: Array.isArray(m.title) ? m.title[0] : m.title || "(untitled)",
    authors: formatAuthors(m.author),
    journal:
      (Array.isArray(m["container-title"]) ? m["container-title"][0] : m["container-title"]) || "",
    year: yearFromIssued(m),
    doi: m.DOI || doi,
    tags: Array.isArray(m.subject) ? m.subject.slice(0, 6) : [],
    abstract: stripJatsTags(m.abstract || ""),
    keyFindings: [],
  };
};
