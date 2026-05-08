// ── OpenAlex DOI lookup ──────────────────────────────────────────────────────
// Free, unauthenticated, CORS-enabled metadata API. Where CrossRef often
// leaves `abstract` empty, OpenAlex stores it as an "abstract inverted
// index" (word -> [positions]). Reconstructing it gives us a usable
// abstract for the LLM enrichment step. We also pull a few concept names
// as fallback tags.

const BASE = "https://api.openalex.org/works/doi:";
const POLITE_MAILTO = "lectus@example.local"; // override locally if you like

const cleanDoi = (raw) => {
  let s = String(raw || "").trim();
  s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  s = s.replace(/^doi:\s*/i, "");
  return s;
};

// OpenAlex stores abstracts as { word: [positions...] }. Walk every position
// and place the word at that index, then join. Lossy but readable.
const reconstructAbstract = (inverted) => {
  if (!inverted || typeof inverted !== "object") return "";
  const slots = [];
  for (const [word, positions] of Object.entries(inverted)) {
    if (!Array.isArray(positions)) continue;
    for (const pos of positions) slots[pos] = word;
  }
  return slots.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
};

export const lookupOpenAlex = async (rawDoi) => {
  const doi = cleanDoi(rawDoi);
  if (!doi) throw new Error("Empty DOI");
  const url = `${BASE}${encodeURIComponent(doi)}?mailto=${encodeURIComponent(POLITE_MAILTO)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`OpenAlex: DOI not indexed (${doi})`);
    throw new Error(`OpenAlex ${res.status}`);
  }
  const data = await res.json();
  return {
    abstract: reconstructAbstract(data.abstract_inverted_index),
    concepts: Array.isArray(data.concepts)
      ? data.concepts
          .filter((c) => c.score > 0.4)
          .slice(0, 6)
          .map((c) => String(c.display_name || "").toLowerCase())
          .filter(Boolean)
      : [],
  };
};
