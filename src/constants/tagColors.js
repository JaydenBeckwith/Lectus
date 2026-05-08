// ── Tag colour map ────────────────────────────────────────────────────────────
// A handful of common tags get hand-tuned colours so the demo library always
// looks the same. Anything outside this map is hashed deterministically into
// the same muted palette aesthetic — that way user-added or AI-suggested
// tags pick up a stable, distinct colour automatically instead of all
// rendering grey.

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

// djb2 string hash — small, fast, good enough for picking a hue. Returns a
// non-negative integer from a (case-folded) string.
const hashStr = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// HSL → hex without external deps. Inputs: 0-360, 0-100, 0-100.
const hslToHex = (h, s, l) => {
  const sd = s / 100;
  const ld = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sd * Math.min(ld, 1 - ld);
  const f = (n) => ld - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * f(x)).toString(16).padStart(2, "0");
  return "#" + toHex(0) + toHex(8) + toHex(4);
};

// Pick a deterministic colour for any tag. Curated tags keep their assigned
// colour; everything else is hashed into roughly the same muted palette
// (~45% saturation, ~40% lightness) so chips stay readable on dark and
// light themes alike.
export const tagColor = (t) => {
  if (!t) return TAG_COLORS.default;
  if (TAG_COLORS[t]) return TAG_COLORS[t];
  const hue = hashStr(String(t).toLowerCase()) % 360;
  return hslToHex(hue, 45, 40);
};
