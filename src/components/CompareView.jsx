import { useState } from "react";
import { tagColor } from "../constants/tagColors";

const MAX_COMPARE = 4;

// Side-by-side comparison of 2-4 papers. Top half is a paper picker, bottom is
// a sticky-header table where each row labels a facet (abstract, findings,
// tags, notes, highlights) and each column is a paper.
export default function CompareView({ papers, onSelectPaper, theme }) {
  const [selection, setSelection] = useState([]);

  const toggle = (id) => {
    setSelection((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const selected = selection
    .map((id) => papers.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div
      style={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Picker */}
      <div
        style={{
          borderBottom: `1px solid ${theme.panelBorder}`,
          padding: "1.25rem 1.5rem 1rem",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "1.6rem",
            fontStyle: "italic",
            color: theme.textBright,
            marginBottom: "0.3rem",
          }}
        >
          Compare papers
        </div>
        <div style={{ fontSize: "0.78rem", color: theme.textMuted, marginBottom: "0.9rem" }}>
          Pick {MAX_COMPARE === 4 ? "2-4" : `up to ${MAX_COMPARE}`} papers to view side-by-side ({selection.length} selected)
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            flexWrap: "wrap",
            maxHeight: 110,
            overflowY: "auto",
          }}
        >
          {papers.map((p) => {
            const sel = selection.includes(p.id);
            const disabled = !sel && selection.length >= MAX_COMPARE;
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                disabled={disabled}
                style={{
                  background: sel ? theme.accent + "22" : theme.panel,
                  border: `1px solid ${sel ? theme.accent : theme.panelBorder}`,
                  color: sel ? theme.textBright : theme.textSubtle,
                  borderRadius: 14,
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.72rem",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.4 : 1,
                  transition: "all .15s",
                  maxWidth: 280,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={p.title}
              >
                {sel && "✓ "}
                {p.title.length > 50 ? p.title.slice(0, 48) + "…" : p.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {selected.length < 2 ? (
          <div
            style={{
              padding: "3rem 1.5rem",
              textAlign: "center",
              color: theme.textMuted,
              fontSize: "0.85rem",
            }}
          >
            Select at least two papers to compare.
          </div>
        ) : (
          <div style={{ minWidth: 200 + selected.length * 280, padding: "1rem 1.5rem 2rem" }}>
            <Row label="Title" theme={theme}>
              {selected.map((p) => (
                <Cell key={p.id} theme={theme} onClick={() => onSelectPaper(p)} clickable>
                  <div
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "0.95rem",
                      color: theme.textBright,
                      lineHeight: 1.35,
                    }}
                  >
                    {p.title}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: theme.textMuted, marginTop: "0.3rem" }}>
                    {p.authors.split(",")[0]} et al. · {p.journal} · {p.year}
                  </div>
                </Cell>
              ))}
            </Row>

            <Row label="Tags" theme={theme}>
              {selected.map((p) => (
                <Cell key={p.id} theme={theme}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                    {p.tags.map((t) => (
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
                </Cell>
              ))}
            </Row>

            <Row label="Abstract" theme={theme}>
              {selected.map((p) => (
                <Cell key={p.id} theme={theme}>
                  <div style={{ fontSize: "0.78rem", color: theme.text, lineHeight: 1.65 }}>{p.abstract}</div>
                </Cell>
              ))}
            </Row>

            <Row label="Key findings" theme={theme}>
              {selected.map((p) => (
                <Cell key={p.id} theme={theme}>
                  {p.keyFindings.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "0.35rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ color: theme.accent, fontSize: "0.7rem", marginTop: "0.15rem" }}>◆</span>
                      <span style={{ fontSize: "0.78rem", color: theme.text, lineHeight: 1.55 }}>{f}</span>
                    </div>
                  ))}
                </Cell>
              ))}
            </Row>

            <Row label="My highlights" theme={theme}>
              {selected.map((p) => (
                <Cell key={p.id} theme={theme}>
                  {p.highlights?.length ? (
                    p.highlights.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          background: theme.accent + "11",
                          borderLeft: `2px solid ${theme.accent}`,
                          padding: "0.35rem 0.55rem",
                          marginBottom: "0.3rem",
                          fontSize: "0.72rem",
                          color: theme.text,
                          lineHeight: 1.55,
                          fontStyle: "italic",
                        }}
                      >
                        "{h}"
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: theme.textMuted, fontStyle: "italic" }}>
                      None.
                    </span>
                  )}
                </Cell>
              ))}
            </Row>

            <Row label="My notes" theme={theme}>
              {selected.map((p) => (
                <Cell key={p.id} theme={theme}>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: p.notes ? theme.text : theme.textMuted,
                      lineHeight: 1.65,
                      fontStyle: p.notes ? "normal" : "italic",
                    }}
                  >
                    {p.notes || "No notes."}
                  </div>
                </Cell>
              ))}
            </Row>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children, theme }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `180px repeat(${children.length}, 1fr)`,
        borderTop: `1px solid ${theme.panelBorder}`,
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          padding: "0.85rem 0.75rem",
          fontSize: "0.62rem",
          color: theme.textMuted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          background: theme.panel,
          borderRight: `1px solid ${theme.panelBorder}`,
          position: "sticky",
          left: 0,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Cell({ children, theme, onClick, clickable }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "0.85rem 1rem",
        borderRight: `1px solid ${theme.panelBorder}`,
        cursor: clickable ? "pointer" : "default",
        transition: "background .15s",
      }}
      onMouseEnter={(e) => {
        if (clickable) e.currentTarget.style.background = theme.panelHover;
      }}
      onMouseLeave={(e) => {
        if (clickable) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </div>
  );
}
