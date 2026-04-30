export default function NoKeyBanner({ onConnect, theme }) {
  return (
    <div
      className="fade-in"
      style={{
        margin: "0.85rem 1.25rem 0",
        background: theme.accent + "11",
        border: `1px solid ${theme.accent}44`,
        borderRadius: 10,
        padding: "0.65rem 0.9rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
        <span
          style={{
            fontSize: "0.62rem",
            color: theme.accent,
            background: theme.bg,
            border: `1px solid ${theme.accent}55`,
            borderRadius: 4,
            padding: "0.15rem 0.45rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          AI off
        </span>
        <span
          style={{
            fontSize: "0.78rem",
            color: theme.text,
            lineHeight: 1.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Add an Anthropic API key to enable this feature.
        </span>
      </div>
      <button
        onClick={onConnect}
        style={{
          background: theme.accent,
          color: theme.bg,
          border: "none",
          borderRadius: 6,
          padding: "0.35rem 0.85rem",
          fontSize: "0.74rem",
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Connect Anthropic
      </button>
    </div>
  );
}
