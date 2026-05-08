import { useEffect, useMemo, useRef, useState } from "react";
import { tagColor } from "../constants/tagColors";
import { compareContradictions } from "../api/llm";
import NoKeyBanner from "./NoKeyBanner";

const MAX_COMPARE = 4;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_OPTS = [
  ["all", "Any status"],
  ["to-read", "To read"],
  ["reading", "Reading"],
  ["read", "Read"],
];

const firstAuthorOf = (s = "") => (s.split(",")[0] || "").trim() || "Unknown";

// All comparable facets. `key` matches the field on the paper object (where
// applicable), `core` items can't be hidden, the rest are user-toggleable.
const FACETS = [
  { key: "title", label: "Title", core: true },
  { key: "tags", label: "Tags", core: true },
  { key: "abstract", label: "Abstract", core: true },
  { key: "methods", label: "Methods", optional: true, prose: true },
  { key: "results", label: "Results", optional: true, prose: true },
  { key: "discussion", label: "Discussion", optional: true, prose: true },
  { key: "keyFindings", label: "Key findings", optional: true },
  { key: "highlights", label: "My highlights", optional: true },
  { key: "notes", label: "My notes", optional: true },
];

const DEFAULT_VISIBLE = new Set([
  "tags",
  "abstract",
  "keyFindings",
  "highlights",
  "notes",
]);

// Side-by-side comparison of 2-4 papers. Top half is a paper picker, bottom is
// a sticky-header table where each row labels a facet (abstract, findings,
// tags, notes, highlights, plus optional methods/results/discussion) and each
// column is a paper. Includes an on-demand AI contradiction check.
export default function CompareView({ papers, onSelectPaper, hasKey, onConnect, theme }) {
  const [selection, setSelection] = useState([]);
  const [visible, setVisible] = useState(DEFAULT_VISIBLE);

  // Picker dropdown — opened via the "Add paper" button. Filters mirror the
  // Timeline view so users with large libraries can narrow down quickly.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterAuthor, setFilterAuthor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const pickerRef = useRef(null);

  const [contradictions, setContradictions] = useState(null);
  const [contradictionsLoading, setContradictionsLoading] = useState(false);
  const [contradictionsError, setContradictionsError] = useState("");

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  // Distinct dropdown options derived from the library.
  const years = useMemo(
    () => Array.from(new Set(papers.map((p) => p.year).filter(Boolean))).sort((a, b) => b - a),
    [papers]
  );
  const authors = useMemo(
    () => Array.from(new Set(papers.map((p) => firstAuthorOf(p.authors)))).sort((a, b) => a.localeCompare(b)),
    [papers]
  );
  const tags = useMemo(
    () => Array.from(new Set(papers.flatMap((p) => p.tags || []))).sort((a, b) => a.localeCompare(b)),
    [papers]
  );

  // Apply all filters + search to produce the dropdown list.
  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return papers.filter((p) => {
      if (filterYear !== "all" && String(p.year) !== String(filterYear)) return false;
      if (filterMonth !== "all" && Number(p.month) !== Number(filterMonth)) return false;
      if (filterAuthor !== "all" && firstAuthorOf(p.authors) !== filterAuthor) return false;
      if (filterStatus !== "all" && (p.status || "to-read") !== filterStatus) return false;
      if (filterTag !== "all" && !(p.tags || []).includes(filterTag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        (p.abstract || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [papers, search, filterYear, filterMonth, filterAuthor, filterStatus, filterTag]);

  const clearFilters = () => {
    setSearch("");
    setFilterYear("all");
    setFilterMonth("all");
    setFilterAuthor("all");
    setFilterStatus("all");
    setFilterTag("all");
  };
  const filtersActive =
    Boolean(search) ||
    filterYear !== "all" ||
    filterMonth !== "all" ||
    filterAuthor !== "all" ||
    filterStatus !== "all" ||
    filterTag !== "all";

  const toggle = (id) => {
    setSelection((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COMPARE ? prev : [...prev, id];
      // Selection changed → previous AI analysis is stale.
      setContradictions(null);
      setContradictionsError("");
      return next;
    });
  };

  const toggleFacet = (key) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selected = selection
    .map((id) => papers.find((p) => p.id === id))
    .filter(Boolean);

  const runAnalysis = async () => {
    if (selected.length < 2) return;
    setContradictionsLoading(true);
    setContradictionsError("");
    setContradictions(null);
    try {
      const result = await compareContradictions(selected);
      setContradictions(result);
    } catch (err) {
      setContradictionsError(err.message || "Could not analyse contradictions");
    } finally {
      setContradictionsLoading(false);
    }
  };

  const isVisible = (f) => f.core || visible.has(f.key);
  const optionalFacets = FACETS.filter((f) => f.optional);

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
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem" }}>
          {selected.map((p) => (
            <span
              key={p.id}
              title={p.title}
              style={{
                background: theme.accent + "22",
                border: `1px solid ${theme.accent}`,
                color: theme.textBright,
                borderRadius: 14,
                padding: "0.32rem 0.6rem",
                fontSize: "0.72rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
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
          ))}

          <div ref={pickerRef} style={{ position: "relative" }}>
            <button
              onClick={() => setPickerOpen((v) => !v)}
              disabled={selection.length >= MAX_COMPARE && !pickerOpen}
              title={selection.length >= MAX_COMPARE ? `Already at the ${MAX_COMPARE}-paper max` : "Browse and add a paper"}
              style={{
                background: pickerOpen ? theme.accent + "22" : theme.panel,
                border: `1px solid ${pickerOpen ? theme.accent : theme.panelBorder}`,
                color: pickerOpen ? theme.accent : theme.textSubtle,
                borderRadius: 14,
                padding: "0.32rem 0.8rem",
                fontSize: "0.72rem",
                cursor: selection.length >= MAX_COMPARE && !pickerOpen ? "not-allowed" : "pointer",
                opacity: selection.length >= MAX_COMPARE && !pickerOpen ? 0.4 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              + Add paper{selection.length > 0 ? "" : ""}
              <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>{pickerOpen ? "▴" : "▾"}</span>
            </button>

            {pickerOpen && (
              <PickerPanel
                theme={theme}
                papers={filteredCandidates}
                allCount={papers.length}
                selection={selection}
                onPick={(id) => toggle(id)}
                search={search}
                setSearch={setSearch}
                filterYear={filterYear}
                setFilterYear={setFilterYear}
                filterMonth={filterMonth}
                setFilterMonth={setFilterMonth}
                filterAuthor={filterAuthor}
                setFilterAuthor={setFilterAuthor}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterTag={filterTag}
                setFilterTag={setFilterTag}
                clearFilters={clearFilters}
                filtersActive={filtersActive}
                years={years}
                authors={authors}
                tagsList={tags}
                maxReached={selection.length >= MAX_COMPARE}
              />
            )}
          </div>

          {selection.length > 0 && (
            <button
              onClick={() => {
                setSelection([]);
                setContradictions(null);
                setContradictionsError("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: theme.textMuted,
                fontSize: "0.65rem",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "0.3rem 0.4rem",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Section toggles + AI analysis */}
        {selected.length >= 2 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
              marginTop: "0.9rem",
              paddingTop: "0.8rem",
              borderTop: `1px dashed ${theme.panelBorder}`,
            }}
          >
            <span
              style={{
                fontSize: "0.6rem",
                color: theme.textMuted,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Sections:
            </span>
            {optionalFacets.map((f) => {
              const on = visible.has(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFacet(f.key)}
                  style={{
                    background: on ? theme.accent + "22" : "transparent",
                    border: `1px solid ${on ? theme.accent : theme.panelBorder}`,
                    color: on ? theme.accent : theme.textSubtle,
                    borderRadius: 12,
                    padding: "0.25rem 0.65rem",
                    fontSize: "0.68rem",
                    cursor: "pointer",
                  }}
                >
                  {on ? "✓ " : ""}
                  {f.label}
                </button>
              );
            })}

            <div style={{ flex: 1 }} />

            <button
              onClick={runAnalysis}
              disabled={contradictionsLoading || !hasKey}
              title={!hasKey ? "Connect an AI provider in Settings" : "Find contradictions across selected papers"}
              style={{
                background: hasKey ? theme.accent : theme.chip,
                color: hasKey ? theme.bg : theme.textMuted,
                border: "none",
                borderRadius: 8,
                padding: "0.45rem 0.95rem",
                fontSize: "0.74rem",
                fontWeight: 500,
                cursor: hasKey && !contradictionsLoading ? "pointer" : "not-allowed",
                opacity: contradictionsLoading ? 0.7 : 1,
              }}
            >
              {contradictionsLoading ? "Analysing…" : "Find contradictions ✦"}
            </button>
          </div>
        )}
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
            {!hasKey && (
              <div style={{ marginBottom: "1rem" }}>
                <NoKeyBanner onConnect={onConnect} theme={theme} />
              </div>
            )}

            {/* Contradictions panel — only rendered after the user runs analysis */}
            {(contradictions || contradictionsError || contradictionsLoading) && (
              <ContradictionsPanel
                data={contradictions}
                loading={contradictionsLoading}
                error={contradictionsError}
                theme={theme}
                onDismiss={() => {
                  setContradictions(null);
                  setContradictionsError("");
                }}
              />
            )}

            {FACETS.filter(isVisible).map((f) => (
              <Row key={f.key} label={f.label} theme={theme}>
                {selected.map((p) => (
                  <Cell
                    key={p.id}
                    theme={theme}
                    onClick={f.key === "title" ? () => onSelectPaper(p) : undefined}
                    clickable={f.key === "title"}
                  >
                    {renderFacet(f, p, theme)}
                  </Cell>
                ))}
              </Row>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cell renderers ─────────────────────────────────────────────────────────
function renderFacet(facet, p, theme) {
  switch (facet.key) {
    case "title":
      return (
        <>
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
        </>
      );
    case "tags":
      return (
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
      );
    case "abstract":
      return <Prose theme={theme} text={p.abstract} muted="No abstract." />;
    case "methods":
      return <Prose theme={theme} text={p.methods} muted="No methods extracted." />;
    case "results":
      return <Prose theme={theme} text={p.results} muted="No results extracted." />;
    case "discussion":
      return <Prose theme={theme} text={p.discussion} muted="No discussion extracted." />;
    case "keyFindings":
      return p.keyFindings?.length
        ? p.keyFindings.map((f, i) => (
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
          ))
        : <Muted theme={theme}>None.</Muted>;
    case "highlights":
      return p.highlights?.length
        ? p.highlights.map((h, i) => (
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
        : <Muted theme={theme}>None.</Muted>;
    case "notes":
      return (
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
      );
    default:
      return null;
  }
}

// Collapsible-on-overflow prose block. We clip long text to ~360 chars and
// give the user a "show full" toggle so the comparison rows stay scannable.
function Prose({ theme, text, muted = "—" }) {
  const [expanded, setExpanded] = useState(false);
  const t = (text || "").trim();
  if (!t) return <Muted theme={theme}>{muted}</Muted>;
  const LIMIT = 360;
  const long = t.length > LIMIT;
  const shown = !expanded && long ? t.slice(0, LIMIT).trimEnd() + "…" : t;
  return (
    <div style={{ fontSize: "0.78rem", color: theme.text, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
      {shown}
      {long && (
        <button
          onClick={() => setExpanded((x) => !x)}
          style={{
            background: "none",
            border: "none",
            color: theme.accent,
            cursor: "pointer",
            fontSize: "0.7rem",
            marginLeft: "0.4rem",
            padding: 0,
          }}
        >
          {expanded ? "show less" : "show more"}
        </button>
      )}
    </div>
  );
}

function Muted({ theme, children }) {
  return (
    <span style={{ fontSize: "0.75rem", color: theme.textMuted, fontStyle: "italic" }}>
      {children}
    </span>
  );
}

// ── Contradictions ──────────────────────────────────────────────────────────
function ContradictionsPanel({ data, loading, error, theme, onDismiss }) {
  return (
    <div
      className="fade-in"
      style={{
        background: theme.panel,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: 10,
        padding: "1rem 1.15rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.7rem",
        }}
      >
        <span
          style={{
            fontSize: "0.65rem",
            color: theme.textMuted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          AI contradiction check
        </span>
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            color: theme.textMuted,
            cursor: "pointer",
            fontSize: "0.7rem",
          }}
        >
          ✕
        </button>
      </div>

      {loading && (
        <div className="typing">
          <span style={{ background: theme.accent }} />
          <span style={{ background: theme.accent }} />
          <span style={{ background: theme.accent }} />
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#7c4a4a22",
            border: "1px solid #7c4a4a55",
            color: "#c47a6e",
            borderRadius: 8,
            padding: "0.5rem 0.7rem",
            fontSize: "0.78rem",
          }}
        >
          {error}
        </div>
      )}

      {data && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {data.summary && (
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "0.92rem",
                color: theme.text,
                lineHeight: 1.7,
              }}
            >
              {data.summary}
            </div>
          )}

          {Array.isArray(data.contradictions) && data.contradictions.length > 0 && (
            <div>
              <SubHead theme={theme} accent="#c47a6e">Contradictions</SubHead>
              {data.contradictions.map((c, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: "2px solid #c47a6e55",
                    paddingLeft: "0.7rem",
                    marginBottom: "0.55rem",
                  }}
                >
                  {c.topic && (
                    <div style={{ fontSize: "0.78rem", color: theme.textBright, marginBottom: "0.15rem" }}>
                      {c.topic}
                    </div>
                  )}
                  <div style={{ fontSize: "0.78rem", color: theme.text, lineHeight: 1.6 }}>{c.detail}</div>
                  {c.papers?.length > 0 && (
                    <div style={{ fontSize: "0.66rem", color: theme.textMuted, marginTop: "0.2rem" }}>
                      {c.papers.join(" · ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {Array.isArray(data.agreements) && data.agreements.length > 0 && (
            <div>
              <SubHead theme={theme} accent="#6a9060">Agreements</SubHead>
              {data.agreements.map((a, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: "2px solid #6a906055",
                    paddingLeft: "0.7rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", color: theme.text, lineHeight: 1.6 }}>{a.point}</div>
                  {a.papers?.length > 0 && (
                    <div style={{ fontSize: "0.66rem", color: theme.textMuted, marginTop: "0.2rem" }}>
                      {a.papers.join(" · ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {(!data.contradictions?.length && !data.agreements?.length) && (
            <Muted theme={theme}>No structured points returned.</Muted>
          )}
        </div>
      )}
    </div>
  );
}

function SubHead({ children, theme, accent }) {
  return (
    <div
      style={{
        fontSize: "0.6rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: accent || theme.textMuted,
        marginBottom: "0.35rem",
      }}
    >
      {children}
    </div>
  );
}

// ── Layout primitives ───────────────────────────────────────────────────────
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

// ── Picker dropdown ────────────────────────────────────────────────────────
// Filterable dropdown for adding a paper to the comparison. Filters mirror
// the Timeline view: search, year, month, first author, status, tag.
function PickerPanel({
  theme,
  papers,
  allCount,
  selection,
  onPick,
  search, setSearch,
  filterYear, setFilterYear,
  filterMonth, setFilterMonth,
  filterAuthor, setFilterAuthor,
  filterStatus, setFilterStatus,
  filterTag, setFilterTag,
  clearFilters, filtersActive,
  years, authors, tagsList,
  maxReached,
}) {
  const selectStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: 6,
    padding: "0.32rem 0.45rem",
    color: theme.text,
    fontSize: "0.72rem",
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
      onMouseDown={(e) => e.stopPropagation()}
      className="fade-in"
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        background: theme.panel,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: 10,
        boxShadow: "0 14px 36px rgba(0,0,0,0.45)",
        width: 460,
        maxWidth: "calc(100vw - 3rem)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "0.75rem 0.85rem", borderBottom: `1px solid ${theme.panelBorder}`, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, authors, tags, abstract…"
          style={{
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: 8,
            padding: "0.45rem 0.65rem",
            color: theme.text,
            fontSize: "0.78rem",
            width: "100%",
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
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", color: theme.textMuted }}>
          <span>{papers.length} of {allCount} papers</span>
          {filtersActive && (
            <button
              onClick={clearFilters}
              style={{ background: "transparent", border: "none", color: theme.accent, cursor: "pointer", fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {papers.length === 0 ? (
          <div style={{ padding: "1.25rem 1rem", textAlign: "center", color: theme.textMuted, fontSize: "0.78rem", fontStyle: "italic" }}>
            No papers match these filters.
          </div>
        ) : (
          papers.map((p) => {
            const sel = selection.includes(p.id);
            const disabled = !sel && maxReached;
            return (
              <button
                key={p.id}
                onClick={() => onPick(p.id)}
                disabled={disabled}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = theme.panelHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = sel ? theme.accent + "11" : "transparent"; }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.55rem",
                  width: "100%",
                  textAlign: "left",
                  background: sel ? theme.accent + "11" : "transparent",
                  border: "none",
                  borderBottom: `1px solid ${theme.panelBorder}`,
                  padding: "0.6rem 0.85rem",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.45 : 1,
                  color: "inherit",
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `1.5px solid ${sel ? theme.accent : theme.panelBorder}`,
                    background: sel ? theme.accent : "transparent",
                    flexShrink: 0,
                    marginTop: "0.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                    color: theme.bg,
                  }}
                >
                  {sel && "✓"}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "0.86rem",
                      color: theme.textBright,
                      display: "block",
                      lineHeight: 1.35,
                    }}
                  >
                    {p.title}
                  </span>
                  <span style={{ fontSize: "0.66rem", color: theme.textMuted, display: "block", marginTop: "0.15rem" }}>
                    {firstAuthorOf(p.authors)} · {p.journal || "—"} · {p.year || "?"}
                    {p.tags?.length ? "  ·  " + p.tags.slice(0, 3).join(", ") : ""}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

