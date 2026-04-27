// Top navigation bar with logo, view tabs, and the settings cog.

const VIEWS = [
  ["library", "Library"],
  ["graph", "Graph"],
  ["timeline", "Timeline"],
  ["compare", "Compare"],
  ["chat", "Ask"],
  ["review", "Review"],
  ["add", "+ Add"],
];

export default function TopBar({ view, onChangeView, theme }) {
  return (
    <div
      style={{
        background: theme.panel,
        borderBottom: `1px solid ${theme.panelBorder}`,
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 52,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="1.5" stroke={theme.accent} strokeWidth="1.2" fill="none" opacity="0.5" />
          <line x1="6" y1="6" x2="14" y2="6" stroke={theme.accent} strokeWidth="0.7" />
          <line x1="6" y1="9" x2="14" y2="9" stroke={theme.accent} strokeWidth="0.7" />
          <line x1="6" y1="12" x2="11" y2="12" stroke={theme.accent} strokeWidth="0.7" />
          <circle cx="14.5" cy="13.5" r="2" fill={theme.accent} opacity="0.3" />
        </svg>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "1.3rem",
            color: theme.textBright,
            fontStyle: "italic",
            letterSpacing: "0.01em",
          }}
        >
          Lectus
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.1rem" }}>
        {VIEWS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => onChangeView(v)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `1px solid ${view === v ? theme.accent : "transparent"}`,
              color: view === v ? theme.textBright : theme.textSubtle,
              fontSize: "0.78rem",
              cursor: "pointer",
              padding: "0.3rem 0.7rem",
              letterSpacing: "0.02em",
              transition: "all .15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        onClick={() => onChangeView("settings")}
        style={{
          background: "none",
          border: "none",
          color: view === "settings" ? theme.accent : theme.textMuted,
          cursor: "pointer",
          fontSize: "1rem",
          padding: "0.25rem 0.5rem",
        }}
      >
        ⚙
      </button>
    </div>
  );
}
