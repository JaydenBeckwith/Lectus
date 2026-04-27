// ── Tag colour map ────────────────────────────────────────────────────────────
// Stable colour assignment for the most common tags so a paper's tags look the
// same across the library, graph, timeline and detail views. Tags not in the
// map fall through to `default`.

export const TAG_COLORS = {
  melanoma: "#4a7c59",
  neoadjuvant: "#7c4a6b",
  immunotherapy: "#4a647c",
  "RNA splicing": "#7c6b4a",
  biomarker: "#7c4a4a",
  TME: "#5a4a7c",
  neoantigen: "#4a7c7c",
  "clinical trial": "#7a7c4a",
  LAG3: "#7c5a4a",
  CTLA4: "#7c5a8a",
  PD1: "#5a7c8a",
  "isoform switching": "#8a7c5a",
  default: "#3a4a5a",
};

export const tagColor = (t) => TAG_COLORS[t] || TAG_COLORS.default;
