import { useMemo, useState } from "react";
import { tagColor } from "../constants/tagColors";

// Timeline view with multiple grouping modes (year / year+month / first author /
// status / primary tag) and an inline search filter.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_LABEL = { "to-read": "To read", reading: "Reading", read: "Read" };

const firstAuthor = (s = "") => (s.split(",")[0] || "").trim() || "Unknown";

// Each entry has { key (sort key), label (display), papers }
const groupPapers = (papers, mode) => {
  if (mode === "year") {
    const map = {};
    for (const p of papers) {
      const k = String(p.year ?? "—");
      (map[k] = map[k] || []).push(p);
    }
    return Object.keys(map)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => ({ key: k, label: k, papers: map[k] }));
  }

  if (mode === "month") {
    // We don't store full dates, so synthesize Jan if month is unknown.
    const map = {};
    for (const p of papers) {
      const y = p.year ?? "—";
      const m = p.month && p.month >= 1 && p.month <= 12 ? p.month : 1;
      const k = `${y}-${String(m).padStart(2, "0")}`;
      const label = `${MONTHS[m - 1]} ${y}`;
      (map[k] = map[k] || { key: k, label, papers: [] }).papers.push(p);
    }
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  }

  if (mode === "author") {
    const map = {};
    for (const p of papers) {
      const k = firstAuthor(p.authors);
      (map[k] = map[k] || []).push(p);
    }
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => ({ key: k, label: k, papers: map[k] }));
  }

  if (mode === "status") {
    const order = ["reading", "to-read", "read"];
    const map = {};
    for (const p of papers) {
      const k = p.status || "to-read";
      (map[k] = map[k] || []).push(p);
    }
    return order
      .filter((k) => map[k]?.length)
      .map((k) => ({ key: k, label: STATUS_LABEL[k] || k, papers: map[k] }));
  }

  if (mode === "tag") {
    const map = {};
    for (const p of papers) {
      const k = p.tags?.[0] || "untagged";
      (map[k] = map[k] || []).push(p);
    }
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => ({ key: k, label: k, papers: map[k] }));
  }

  return [{ key: "all", label: "All", papers }];
};

export default function TimelineView({ papers, onSelectPaper, theme }) {
  const [mode, setMode] = useState("year");
  const [direction, setDirection] = useState("asc"); // "asc" | "desc"
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.journal || "").toLowerCase().includes(q)
    );
  }, [papers, query]);

  const groups = useMemo(() => {
    const g = groupPapers(filtered, mode);
    return direction === "desc" ? [...g].reverse() : g;
  }, [filtered, mode, direction]);

  // Within each group, sort papers by year desc as a sensible default —
  // unless we're already grouping by year (then sort by author for variety).
  const orderedGroups = useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        papers: [...g.papers].sort((a, b) => {
          if (mode === "year" || mode === "month") {
            return firstAuthor(a.authors).localeCompare(firstAuthor(b.authors));
          }
          return (b.year || 0) - (a.year || 0);
        }),
      })),
    [groups, mode]
  );

  const totalCount = filtered.length;
  const yearRange = useMemo(() => {
    const ys = papers.map((p) => p.year).filter(Boolean);
    if (!ys.length) return "";
    return `${Math.min(...ys)}–${Math.max(...ys)}`;
  }, [papers]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem 1.5rem 2rem", background: theme.backdrop }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "0.6rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "1.6rem",
                fontStyle: "italic",
                color: theme.textBright,
                marginBottom: "0.15rem",
              }}
            >
              Timeline
            </div>
            <div style={{ fontSize: "0.78rem", color: theme.textMuted }}>
              {totalCount} paper{totalCount === 1 ? "" : "s"}
              {yearRange && ` · ${yearRange}`}
            </div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter timeline…"
            style={{
              minWidth: 200,
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: 8,
              padding: "0.45rem 0.75rem",
              color: theme.text,
              fontSize: "0.78rem",
            }}
          />
        </div>

        {/* Group / sort controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.62rem",
              color: theme.textMuted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginRight: "0.25rem",
            }}
          >
            Group by
          </div>
          {[
            ["year", "Year"],
            ["month", "Year + Month"],
            ["author", "First author"],
            ["status", "Status"],
            ["tag", "Tag"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              style={{
                background: mode === k ? theme.chip : "transparent",
                border: `1px solid ${mode === k ? theme.accent : theme.panelBorder}`,
                color: mode === k ? theme.accent : theme.textSubtle,
                borderRadius: 16,
                padding: "0.25rem 0.7rem",
                fontSize: "0.7rem",
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              {l}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setDirection((d) => (d === "asc" ? "desc" : "asc"))}
            style={{
              background: "transparent",
              border: `1px solid ${theme.panelBorder}`,
              color: theme.textSubtle,
              borderRadius: 16,
              padding: "0.25rem 0.7rem",
              fontSize: "0.7rem",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
            title="Toggle sort direction"
          >
            {direction === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>

        {orderedGroups.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: theme.textMuted,
              fontSize: "0.85rem",
              padding: "2rem 0",
            }}
          >
            No papers match.
          </div>
        ) : (
          orderedGroups.map((group) => (
            <div
              key={group.key}
              style={{
                marginBottom: "2rem",
                display: "flex",
                gap: "1.5rem",
                alignItems: "flex-start",
              }}
            >
              <div style={{ width: 130, flexShrink: 0, paddingTop: "0.4rem" }}>
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "1.4rem",
                    color: theme.accent,
                    fontStyle: "italic",
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                  }}
                >
                  {group.label}
                </div>
                <div style={{ fontSize: "0.7rem", color: theme.textMuted, marginTop: "0.25rem" }}>
                  {group.papers.length} paper{group.papers.length === 1 ? "" : "s"}
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
                {group.papers.map((p) => (
                  <PaperCard key={p.id} paper={p} onSelect={onSelectPaper} theme={theme} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PaperCard({ paper, onSelect, theme }) {
  const sLabel = STATUS_LABEL[paper.status] || paper.status;
  const sColor =
    paper.status === "read"
      ? "#6a9060"
      : paper.status === "reading"
      ? theme.accent
      : theme.textSubtle;
  return (
    <div
      onClick={() => onSelect(paper)}
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
        padding: "0.85rem 1rem",
        marginBottom: "0.75rem",
        cursor: "pointer",
        position: "relative",
        transition: "all .15s",
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
          background: tagColor(paper.tags[0]),
          border: `2px solid ${theme.bg}`,
          transform: "translateY(-50%)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "0.25rem",
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "0.97rem",
            color: theme.textBright,
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {paper.title}
        </div>
        <span
          style={{
            background: theme.chip,
            color: sColor,
            border: `1px solid ${sColor}33`,
            fontSize: "0.6rem",
            padding: "0.1rem 0.45rem",
            borderRadius: 4,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          {sLabel}
        </span>
      </div>

      <div
        style={{
          fontSize: "0.7rem",
          color: theme.textMuted,
          marginBottom: "0.4rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.6rem",
        }}
      >
        <span>{paper.authors}</span>
        {paper.journal && <span>· {paper.journal}</span>}
        {paper.year && <span>· {paper.year}</span>}
        {paper.doi && (
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            · {paper.doi}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", alignItems: "center" }}>
        {paper.tags.slice(0, 5).map((t) => (
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
        {paper.tags.length > 5 && (
          <span style={{ fontSize: "0.6rem", color: theme.textMuted }}>
            +{paper.tags.length - 5}
          </span>
        )}
        {paper.keyFindings?.length > 0 && (
          <span
            style={{
              fontSize: "0.6rem",
              color: theme.textSubtle,
              marginLeft: "auto",
            }}
          >
            ◆ {paper.keyFindings.length} finding{paper.keyFindings.length === 1 ? "" : "s"}
          </span>
        )}
        {paper.highlights?.length > 0 && (
          <span style={{ fontSize: "0.6rem", color: theme.accent }}>
            ❝{paper.highlights.length}
          </span>
        )}
        {paper.notes && <span style={{ fontSize: "0.6rem", color: theme.accent }}>✎</span>}
      </div>
    </div>
  );
}
