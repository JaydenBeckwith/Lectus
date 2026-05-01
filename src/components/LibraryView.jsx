import { tagColor } from "../constants/tagColors";

const STATUS_OPTIONS = [
  ["all", "All"],
  ["to-read", "To read"],
  ["reading", "Reading"],
  ["read", "Read"],
];

// Library list with status + tag sidebar and a search input.
export default function LibraryView({
  papers,
  filtered,
  search,
  setSearch,
  activeTag,
  setActiveTag,
  statusFilter,
  setStatusFilter,
  allTags,
  statusColors,
  onSelectPaper,
  theme,
}) {
  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
      {/* Sidebar: status + tag filters */}
      <div
        style={{
          width: 200,
          borderRight: `1px solid ${theme.panelBorder}`,
          padding: "1rem 0",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "0 1rem",
            fontSize: "0.62rem",
            color: theme.textMuted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "0.6rem",
          }}
        >
          Status
        </div>
        {STATUS_OPTIONS.map(([s, l]) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.3rem 1rem",
              background: statusFilter === s ? theme.chip : "none",
              border: "none",
              color: statusFilter === s ? theme.accent : theme.textSubtle,
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            {l} ({s === "all" ? papers.length : papers.filter((p) => p.status === s).length})
          </button>
        ))}

        <div
          style={{
            padding: "0 1rem",
            fontSize: "0.62rem",
            color: theme.textMuted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginTop: "1rem",
            marginBottom: "0.6rem",
          }}
        >
          Tags
        </div>
        <button
          onClick={() => setActiveTag(null)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "0.3rem 1rem",
            background: !activeTag ? theme.chip : "none",
            border: "none",
            color: !activeTag ? theme.accent : theme.textSubtle,
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          All ({papers.length})
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTag(t === activeTag ? null : t)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.3rem 1rem",
              background: activeTag === t ? theme.chip : "none",
              border: "none",
              color: activeTag === t ? theme.accent : theme.textSubtle,
              fontSize: "0.72rem",
              cursor: "pointer",
            }}
          >
            {t} ({papers.filter((p) => p.tags.includes(t)).length})
          </button>
        ))}
      </div>

      {/* Main panel: search + list */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1.25rem", borderBottom: `1px solid ${theme.panelBorder}` }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, authors, tags, abstracts..."
            style={{
              width: "100%",
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: 8,
              padding: "0.5rem 0.75rem",
              color: theme.text,
              fontSize: "0.82rem",
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.75rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                color: theme.textMuted,
                textAlign: "center",
                paddingTop: "3rem",
                fontSize: "0.85rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {papers.length === 0 ? (
                <>
                  <div
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "1.2rem",
                      fontStyle: "italic",
                      color: theme.textBright,
                    }}
                  >
                    Your library is empty
                  </div>
                  <div style={{ maxWidth: 360, lineHeight: 1.6 }}>
                    Add a paper from the <strong style={{ color: theme.accent }}>+ Add</strong> tab —
                    paste a DOI for a free CrossRef lookup, or drop a PDF for AI extraction. You
                    can also load a sample library from <strong style={{ color: theme.accent }}>Settings → Load example library</strong>.
                  </div>
                </>
              ) : (
                "No papers match your filters."
              )}
            </div>
          )}
          {filtered.map((p) => {
            const sc = statusColors[p.status];
            return (
              <div
                key={p.id}
                className="fade-in"
                onClick={() => onSelectPaper(p)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.panelHover;
                  e.currentTarget.style.borderColor = theme.accent + "55";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.panel;
                  e.currentTarget.style.borderColor = theme.panelBorder;
                }}
                style={{
                  background: theme.panel,
                  border: `1px solid ${theme.panelBorder}`,
                  borderRadius: 10,
                  padding: "0.9rem 1rem",
                  cursor: "pointer",
                  transition: "all .2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: "0.95rem",
                        color: theme.textBright,
                        lineHeight: 1.4,
                        marginBottom: "0.3rem",
                      }}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: theme.textMuted, marginBottom: "0.5rem" }}>
                      {p.authors} · {p.journal} · {p.year}
                    </div>
                  </div>
                  <span
                    style={{
                      background: sc.bg,
                      color: sc.color,
                      fontSize: "0.62rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: 4,
                      flexShrink: 0,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {sc.label}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", alignItems: "center" }}>
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: tagColor(t) + "33",
                        color: tagColor(t) + "ee",
                        border: `1px solid ${tagColor(t)}44`,
                        borderRadius: 12,
                        padding: "0.15rem 0.55rem",
                        fontSize: "0.65rem",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {p.notes && (
                    <span style={{ fontSize: "0.65rem", color: theme.accent, marginLeft: "0.3rem" }}>
                      ✎ Notes
                    </span>
                  )}
                  {p.highlights?.length > 0 && (
                    <span style={{ fontSize: "0.65rem", color: theme.accent }}>
                      ◆ {p.highlights.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
