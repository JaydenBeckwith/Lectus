import { tagColor } from "../constants/tagColors";

// Vertical timeline grouped by publication year.
export default function TimelineView({ papers, onSelectPaper, theme }) {
  const sorted = [...papers].sort((a, b) => a.year - b.year);
  const years = [...new Set(sorted.map((p) => p.year))].sort();
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const byYear = {};
  sorted.forEach((p) => {
    if (!byYear[p.year]) byYear[p.year] = [];
    byYear[p.year].push(p);
  });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "2rem 1.5rem", background: theme.backdrop }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "1.6rem",
            fontStyle: "italic",
            color: theme.textBright,
            marginBottom: "0.3rem",
          }}
        >
          Timeline
        </div>
        <div style={{ fontSize: "0.78rem", color: theme.textMuted, marginBottom: "2rem" }}>
          {papers.length} papers · {minYear}—{maxYear}
        </div>

        {years.map((year) => (
          <div
            key={year}
            style={{
              marginBottom: "2rem",
              display: "flex",
              gap: "1.5rem",
              alignItems: "flex-start",
            }}
          >
            <div style={{ width: 80, flexShrink: 0, paddingTop: "0.5rem" }}>
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "1.5rem",
                  color: theme.accent,
                  fontStyle: "italic",
                }}
              >
                {year}
              </div>
              <div style={{ fontSize: "0.7rem", color: theme.textMuted, marginTop: "0.2rem" }}>
                {byYear[year].length} paper{byYear[year].length > 1 ? "s" : ""}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                position: "relative",
                borderLeft: `1px solid ${theme.panelBorder}`,
                paddingLeft: "1.5rem",
              }}
            >
              {byYear[year].map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPaper(p)}
                  style={{
                    background: theme.panel,
                    border: `1px solid ${theme.panelBorder}`,
                    borderRadius: 10,
                    padding: "0.85rem 1rem",
                    marginBottom: "0.75rem",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.panelHover;
                    e.currentTarget.style.borderColor = theme.accent + "55";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.panel;
                    e.currentTarget.style.borderColor = theme.panelBorder;
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: -27,
                      top: "50%",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: tagColor(p.tags[0]),
                      border: `2px solid ${theme.bg}`,
                      transform: "translateY(-50%)",
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "0.95rem",
                      color: theme.textBright,
                      lineHeight: 1.4,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {p.title}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: theme.textMuted, marginBottom: "0.4rem" }}>
                    {p.authors} · {p.journal}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                    {p.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        style={{
                          background: tagColor(t) + "33",
                          color: tagColor(t) + "ee",
                          border: `1px solid ${tagColor(t)}44`,
                          borderRadius: 10,
                          padding: "0.1rem 0.45rem",
                          fontSize: "0.6rem",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
