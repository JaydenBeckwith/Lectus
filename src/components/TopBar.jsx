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
    <div style={{
      background: theme.panel, borderBottom: `1px solid ${theme.panelBorder}`,
      padding: "0 1.5rem", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: 52, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="1.5" stroke={theme.accent} strokeWidth="1.2" fill="none" opacity="0.5" />
          <line x1="6" y1="6" x2="14" y2="6" stroke={theme.accent} strokeWidth="0.7" />
          <line x1="6" y1="9" x2="14" y2="9" stroke={theme.accent} strokeWidth="0.7" />
          <line x1="6" y1="12" x2="11" y2="12" stroke={theme.accent} strokeWidth="0.7" />
          <circle cx="14.5" cy="13.5" r="2" fill={theme.accent} opacity="0.3" />
        </svg>
        <div style={{
          fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem",
          color: theme.textBright, fontStyle: "italic", letterSpacing: "0.01em",
        }}>Lectus</div>
      </div>
      <div style={{ display: "flex", gap: "0.1rem" }}>
        {VIEWS.map(([v, l]) => (
          <button key={v} onClick={() => onChangeView(v)} style={{
            background: "none", border: "none",
            borderBottom: `1px solid ${view === v ? theme.accent : "transparent"}`,
            color: view === v ? theme.textBright : theme.textSubtle,
            fontSize: "0.78rem", cursor: "pointer", padding: "0.3rem 0.7rem",
            letterSpacing: "0.02em", transition: "all .15s",
          }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <SaveStatePill state={saveState} theme={theme} />
        <button onClick={() => onChangeView("settings")} style={{
          background: "none", border: "none",
          color: view === "settings" ? theme.accent : theme.textMuted,
          cursor: "pointer", fontSize: "1rem", padding: "0.25rem 0.5rem",
        }}>⚙</button>
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
    <span title="Library is saved locally to IndexedDB (and to a JSON file in the desktop app)." style={{
      fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase",
      color: p.color, background: p.bg, border: `1px solid ${p.color}33`,
      borderRadius: 4, padding: "0.18rem 0.45rem", whiteSpace: "nowrap",
    }}>{p.label}</span>
  );
}
