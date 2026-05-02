const VIEWS = [
  ["library", "Library"],
  ["graph", "Graph"],
  ["timeline", "Timeline"],
  ["compare", "Compare"],
  ["chat", "Ask"],
  ["review", "Review"],
  ["add", "+ Add"],
];

export default function TopBar({ view, onChangeView, saveState, theme }) {
  return (
    <div style={{ background: theme.panel, borderBottom: "1px solid " + theme.panelBorder, padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        {/* Custom book mark from /public — sized inline to match the wordmark.
            BASE_URL keeps the path correct in both Vite dev and Electron's
            file:// build context. */}
        <img
          src={import.meta.env.BASE_URL + "lectus_icon.png"}
          alt="Lectus"
          style={{ height: 40, width: "auto", display: "block", flexShrink: 0 }}
        />
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem", color: theme.textBright, fontStyle: "italic", letterSpacing: "0.01em" }}>Lectus</div>
      </div>
      <div style={{ display: "flex", gap: "0.1rem" }}>
        {VIEWS.map(([v, l]) => (
          <button key={v} onClick={() => onChangeView(v)} style={{ background: "none", border: "none", borderBottom: "1px solid " + (view === v ? theme.accent : "transparent"), color: view === v ? theme.textBright : theme.textSubtle, fontSize: "0.78rem", cursor: "pointer", padding: "0.3rem 0.7rem", letterSpacing: "0.02em", transition: "all .15s" }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <SaveStatePill state={saveState} theme={theme} />
        <button onClick={() => onChangeView("settings")} style={{ background: "none", border: "none", color: view === "settings" ? theme.accent : theme.textMuted, cursor: "pointer", fontSize: "1rem", padding: "0.25rem 0.5rem" }}>⚙</button>
      </div>
    </div>
  );
}

function SaveStatePill({ state, theme }) {
  if (!state || state === "idle") return null;
  const palette = {
    saving: { color: theme.textMuted, bg: theme.chip, label: "Saving…" },
    saved: { color: "#6a9060", bg: "#1a2418", label: "✓ Saved" },
    error: { color: "#c47a6e", bg: "#2418181a", label: "Save error" },
  };
  const p = palette[state] || palette.saved;
  return (
    <span title="Library is saved locally to IndexedDB (and to a JSON file in the desktop app)." style={{ fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase", color: p.color, background: p.bg, border: "1px solid " + p.color + "33", borderRadius: 4, padding: "0.18rem 0.45rem", whiteSpace: "nowrap" }}>
      {p.label}
    </span>
  );
}
