import { useMemo, useState } from "react";
import NoKeyBanner from "./NoKeyBanner";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_OPTS = [
  ["all", "Any status"],
  ["to-read", "To read"],
  ["reading", "Reading"],
  ["read", "Read"],
];
const firstAuthorOf = (s = "") => (s.split(",")[0] || "").trim() || "Unknown";

// Literature review generator. Two modes:
//   • Paragraph  — a single 250-400 word narrative.
//   • Structured — sectioned JSON synthesis (agreements / contradictions /
//                  gaps / future directions / per-paper contributions).
export default function ReviewView({
  papers,
  reviewSelection,
  setReviewSelection,
  reviewTopic,
  setReviewTopic,
  reviewMode,
  setReviewMode,
  reviewOutput,
  reviewStructured,
  reviewLoading,
  reviewError,
  onGenerate,
  hasKey,
  onConnect,
  projects = [],
  theme,
}) {
  const toggle = (id) =>
    setReviewSelection(
      reviewSelection.includes(id)
        ? reviewSelection.filter((x) => x !== id)
        : [...reviewSelection, id]
    );

  // Picker filter state — same structure as CompareView's PickerPanel so
  // users get a familiar way to narrow a large library down before picking.
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterAuthor, setFilterAuthor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [filterProject, setFilterProject] = useState("all");

  const years = useMemo(
    () => Array.from(new Set(papers.map((p) => p.year).filter(Boolean))).sort((a, b) => b - a),
    [papers]
  );
  const authors = useMemo(
    () => Array.from(new Set(papers.map((p) => firstAuthorOf(p.authors)))).sort((a, b) => a.localeCompare(b)),
    [papers]
  );
  const tagsList = useMemo(
    () => Array.from(new Set(papers.flatMap((p) => p.tags || []))).sort((a, b) => a.localeCompare(b)),
    [papers]
  );

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return papers.filter((p) => {
      if (filterYear !== "all" && String(p.year) !== String(filterYear)) return false;
      if (filterMonth !== "all" && Number(p.month) !== Number(filterMonth)) return false;
      if (filterAuthor !== "all" && firstAuthorOf(p.authors) !== filterAuthor) return false;
      if (filterStatus !== "all" && (p.status || "to-read") !== filterStatus) return false;
      if (filterTag !== "all" && !(p.tags || []).includes(filterTag)) return false;
      if (filterProject !== "all" && !(p.projects || []).includes(filterProject)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        (p.abstract || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [papers, search, filterYear, filterMonth, filterAuthor, filterStatus, filterTag, filterProject]);

  const clearFilters = () => {
    setSearch("");
    setFilterYear("all");
    setFilterMonth("all");
    setFilterAuthor("all");
    setFilterStatus("all");
    setFilterTag("all");
    setFilterProject("all");
  };
  const filtersActive =
    Boolean(search) ||
    filterYear !== "all" ||
    filterMonth !== "all" ||
    filterAuthor !== "all" ||
    filterStatus !== "all" ||
    filterTag !== "all" ||
    filterProject !== "all";

  const selectedPapers = reviewSelection
    .map((id) => papers.find((p) => p.id === id))
    .filter(Boolean);

  // Quick action: select every paper that currently passes the filters.
  const addAllFiltered = () => {
    const next = new Set(reviewSelection);
    for (const p of filteredCandidates) next.add(p.id);
    setReviewSelection(Array.from(next));
  };

  const selectStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: 6,
    padding: "0.32rem 0.45rem",
    color: theme.text,
    fontSize: "0.74rem",
    minWidth: 0,
    width: "100%",
  };
  const labelStyle = {
    fontSize: "0.58rem",
    color: theme.textMuted,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "0.2rem",
    display: "block",
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.5rem",
        maxWidth: 900,
        margin: "0 auto",
        width: "100%",
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
        Literature review
      </div>
      <div style={{ fontSize: "0.78rem", color: theme.textMuted, marginBottom: "1.5rem" }}>
        Select papers, optionally focus a topic, get a publication-ready synthesis
      </div>

      {!hasKey && (
        <div style={{ marginBottom: "1rem" }}>
          <NoKeyBanner onConnect={onConnect} theme={theme} />
        </div>
      )}

      {/* Mode toggle */}
      <div
        style={{
          display: "inline-flex",
          background: theme.panel,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 8,
          padding: 3,
          marginBottom: "1.25rem",
        }}
      >
        {[
          ["paragraph", "Paragraph"],
          ["structured", "Structured"],
        ].map(([m, label]) => (
          <button
            key={m}
            onClick={() => setReviewMode(m)}
            style={{
              background: reviewMode === m ? theme.chip : "transparent",
              color: reviewMode === m ? theme.accent : theme.textSubtle,
              border: "none",
              borderRadius: 6,
              padding: "0.4rem 0.9rem",
              fontSize: "0.75rem",
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Topic input */}
      <div style={{ marginBottom: "1rem" }}>
        <SectionLabel theme={theme}>Topic / Focus (optional)</SectionLabel>
        <input
          value={reviewTopic}
          onChange={(e) => setReviewTopic(e.target.value)}
          placeholder="e.g. CTLA4 isoform switching as a biomarker"
          style={{
            width: "100%",
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: 8,
            padding: "0.55rem 0.75rem",
            color: theme.text,
            fontSize: "0.82rem",
          }}
        />
      </div>

      {/* Selection header + selected chips */}
      <div
        style={{
          fontSize: "0.68rem",
          color: theme.textMuted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Selected for review ({reviewSelection.length})</span>
        {reviewSelection.length > 0 && (
          <button
            onClick={() => setReviewSelection([])}
            style={{
              background: "none",
              border: "none",
              color: theme.textSubtle,
              fontSize: "0.65rem",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Clear
          </button>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          marginBottom: "1rem",
          minHeight: 36,
          padding: "0.45rem",
          background: theme.panel,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        {selectedPapers.length === 0 ? (
          <span style={{ fontSize: "0.72rem", color: theme.textMuted, fontStyle: "italic", padding: "0 0.4rem" }}>
            No papers selected — pick at least 2 below.
          </span>
        ) : (
          selectedPapers.map((p) => (
            <span
              key={p.id}
              title={p.title}
              style={{
                background: theme.accent + "22",
                border: `1px solid ${theme.accent}`,
                color: theme.textBright,
                borderRadius: 14,
                padding: "0.25rem 0.55rem",
                fontSize: "0.7rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                maxWidth: 320,
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {firstAuthorOf(p.authors)} ({p.year}) — {p.title}
              </span>
              <button
                onClick={() => toggle(p.id)}
                title="Remove"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  lineHeight: 1,
                  padding: 0,
                  opacity: 0.7,
                }}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* Filter toolbar */}
      <SectionLabel theme={theme}>Choose papers to add</SectionLabel>
      <div
        style={{
          background: theme.panel,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 10,
          padding: "0.75rem 0.85rem",
          marginBottom: "0.6rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.55rem",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, authors, tags, abstract…"
          style={{
            width: "100%",
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: 8,
            padding: "0.45rem 0.65rem",
            color: theme.text,
            fontSize: "0.78rem",
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.45rem" }}>
          <div>
            <label style={labelStyle}>Year</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={selectStyle}>
              <option value="all">Any</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Month</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={selectStyle}>
              <option value="all">Any</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
              {STATUS_OPTS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>First author</label>
            <select value={filterAuthor} onChange={(e) => setFilterAuthor(e.target.value)} style={selectStyle}>
              <option value="all">Any author</option>
              {authors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tag</label>
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={selectStyle}>
              <option value="all">Any tag</option>
              {tagsList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {projects.length > 0 && (
            <div style={{ gridColumn: "1 / span 3" }}>
              <label style={labelStyle}>Project</label>
              <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={selectStyle}>
                <option value="all">Any project</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", color: theme.textMuted }}>
          <span>{filteredCandidates.length} of {papers.length} papers</span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {filtersActive && (
              <button
                onClick={clearFilters}
                style={{ background: "transparent", border: "none", color: theme.accent, cursor: "pointer", fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Reset filters
              </button>
            )}
            {filteredCandidates.length > 0 && (
              <button
                onClick={addAllFiltered}
                title="Add every paper that currently matches the filters"
                style={{ background: "transparent", border: `1px solid ${theme.chipBorder}`, color: theme.accent, borderRadius: 6, padding: "0.2rem 0.55rem", fontSize: "0.66rem", cursor: "pointer" }}
              >
                Add all {filteredCandidates.length}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtered checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.5rem", maxHeight: 340, overflowY: "auto" }}>
        {filteredCandidates.length === 0 ? (
          <div style={{ padding: "1rem", textAlign: "center", color: theme.textMuted, fontSize: "0.78rem", fontStyle: "italic" }}>
            No papers match these filters.
          </div>
        ) : (
          filteredCandidates.map((p) => {
            const sel = reviewSelection.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                style={{
                  background: sel ? theme.chip : theme.panel,
                  border: `1px solid ${sel ? theme.accent : theme.panelBorder}`,
                  borderRadius: 8,
                  padding: "0.6rem 0.85rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.7rem",
                  cursor: "pointer",
                  transition: "all .15s",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1.5px solid ${sel ? theme.accent : theme.panelBorder}`,
                    background: sel ? theme.accent : "transparent",
                    marginTop: "0.15rem",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    color: theme.bg,
                  }}
                >
                  {sel && "✓"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "0.85rem",
                      color: theme.textBright,
                      lineHeight: 1.35,
                      marginBottom: "0.2rem",
                    }}
                  >
                    {p.title}
                  </div>
                  <div style={{ fontSize: "0.66rem", color: theme.textMuted }}>
                    {firstAuthorOf(p.authors)} · {p.journal || "—"} · {p.year || "?"}
                    {p.tags?.length ? "  ·  " + p.tags.slice(0, 4).join(", ") : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={onGenerate}
        disabled={reviewSelection.length < 2 || reviewLoading}
        style={{
          background: reviewSelection.length >= 2 ? theme.accent : theme.chip,
          color: reviewSelection.length >= 2 ? theme.bg : theme.textMuted,
          border: "none",
          borderRadius: 8,
          padding: "0.7rem 1.5rem",
          fontSize: "0.82rem",
          fontWeight: 500,
          cursor: reviewSelection.length >= 2 && !reviewLoading ? "pointer" : "not-allowed",
          marginBottom: "1.5rem",
        }}
      >
        {reviewLoading
          ? "Synthesising..."
          : `Generate ${reviewMode === "structured" ? "structured synthesis" : "review"}${
              reviewSelection.length >= 2 ? ` from ${reviewSelection.length} papers` : " (select 2+)"
            }`}
      </button>

      {reviewError && (
        <div
          style={{
            background: "#7c4a4a22",
            border: "1px solid #7c4a4a55",
            color: "#c47a6e",
            borderRadius: 8,
            padding: "0.6rem 0.85rem",
            fontSize: "0.78rem",
            marginBottom: "1rem",
          }}
        >
          {reviewError}
        </div>
      )}

      {reviewMode === "paragraph"
        ? renderParagraph({ reviewOutput, reviewLoading, theme })
        : renderStructured({ reviewStructured, reviewLoading, papers, theme })}
    </div>
  );
}

function SectionLabel({ children, theme }) {
  return (
    <div
      style={{
        fontSize: "0.68rem",
        color: theme.textMuted,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "0.4rem",
      }}
    >
      {children}
    </div>
  );
}

// ── Paragraph renderer ───────────────────────────────────────────────────────
function renderParagraph({ reviewOutput, reviewLoading, theme }) {
  if (!reviewOutput && !reviewLoading) return null;
  return (
    <div
      className="fade-in"
      style={{
        background: theme.panel,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: 10,
        padding: "1.25rem 1.5rem",
        marginTop: "1rem",
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          color: theme.textMuted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "0.8rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Generated review</span>
        {reviewOutput && (
          <button
            onClick={() => navigator.clipboard.writeText(reviewOutput)}
            style={{
              background: "none",
              border: "none",
              color: theme.accent,
              fontSize: "0.65rem",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Copy
          </button>
        )}
      </div>
      {reviewLoading ? (
        <TypingDots theme={theme} />
      ) : (
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "0.92rem",
            lineHeight: 1.85,
            color: theme.text,
          }}
        >
          {reviewOutput
            .split("\n")
            .map((para, i) => para.trim() && <p key={i} style={{ marginBottom: "1rem" }}>{para}</p>)}
        </div>
      )}
    </div>
  );
}

// ── Structured renderer ─────────────────────────────────────────────────────
function renderStructured({ reviewStructured, reviewLoading, papers, theme }) {
  if (reviewLoading) {
    return (
      <div
        className="fade-in"
        style={{
          background: theme.panel,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 10,
          padding: "1.25rem 1.5rem",
        }}
      >
        <TypingDots theme={theme} />
      </div>
    );
  }
  if (!reviewStructured) return null;

  const s = reviewStructured;
  const paperById = Object.fromEntries(papers.map((p) => [p.id, p]));

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {s.summary && (
        <SectionCard title="Summary" theme={theme}>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.75, color: theme.text, fontFamily: "'Instrument Serif', serif" }}>
            {s.summary}
          </p>
        </SectionCard>
      )}

      <PointsList title="Agreements" items={s.agreements} theme={theme} accent="#6a9060" />
      <PointsList title="Contradictions" items={s.contradictions} theme={theme} accent="#c47a6e" />
      <PointsList title="Gaps" items={s.gaps} theme={theme} accent="#c4a35f" />

      {s.future_directions?.length > 0 && (
        <SectionCard title="Future directions" theme={theme}>
          {s.future_directions.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "0.6rem",
                marginBottom: "0.4rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ color: theme.accent, fontSize: "0.7rem", marginTop: "0.15rem" }}>→</span>
              <span style={{ fontSize: "0.83rem", color: theme.text, lineHeight: 1.65 }}>{f}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {s.per_paper?.length > 0 && (
        <SectionCard title="Per-paper contributions" theme={theme}>
          {s.per_paper.map((row, i) => {
            const p = paperById[row.id];
            return (
              <div
                key={i}
                style={{
                  borderTop: i === 0 ? "none" : `1px solid ${theme.panelBorder}`,
                  paddingTop: i === 0 ? 0 : "0.65rem",
                  paddingBottom: "0.65rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "0.85rem",
                    color: theme.textBright,
                    marginBottom: "0.2rem",
                  }}
                >
                  {p?.title || row.id}
                </div>
                <div style={{ fontSize: "0.78rem", color: theme.text, lineHeight: 1.6 }}>{row.contribution}</div>
              </div>
            );
          })}
        </SectionCard>
      )}
    </div>
  );
}

function SectionCard({ title, children, theme, right }) {
  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: 10,
        padding: "1rem 1.25rem",
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          color: theme.textMuted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "0.7rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function PointsList({ title, items, theme, accent }) {
  if (!items?.length) return null;
  return (
    <SectionCard title={title} theme={theme}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            borderLeft: `2px solid ${accent}55`,
            paddingLeft: "0.75rem",
            marginBottom: i === items.length - 1 ? 0 : "0.7rem",
          }}
        >
          <div style={{ fontSize: "0.83rem", color: theme.text, lineHeight: 1.65 }}>{item.point}</div>
          {item.papers?.length > 0 && (
            <div style={{ fontSize: "0.68rem", color: theme.textMuted, marginTop: "0.2rem" }}>
              {item.papers.join(" · ")}
            </div>
          )}
        </div>
      ))}
    </SectionCard>
  );
}

function TypingDots({ theme }) {
  return (
    <div className="typing">
      <span style={{ background: theme.accent }} />
      <span style={{ background: theme.accent }} />
      <span style={{ background: theme.accent }} />
    </div>
  );
}
