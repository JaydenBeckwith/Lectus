import { useState, useRef, useEffect, useMemo } from "react";
import { buildEdges, layoutGraph } from "../utils/graph";
import { tagColor } from "../constants/tagColors";

// Force-directed graph of papers connected by shared tags. Larger nodes,
// always-visible "Author Year" labels, expanded hover card with full title +
// tags, mouse-wheel zoom + drag pan.

const NODE_BASE_R = 14;
const NODE_WEIGHT_SCALE = 1.8;
const REPULSION_BOOST = 1.4; // gives the layout more breathing room

const firstAuthor = (s = "") => (s.split(",")[0] || "").trim();

export default function GraphView({ papers, onSelectPaper, theme }) {
  const [hovered, setHovered] = useState(null);
  const [dim, setDim] = useState({ w: 800, h: 600 });
  const [layout, setLayout] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const ref = useRef(null);

  // Container resize observer
  useEffect(() => {
    const update = () => {
      if (ref.current) setDim({ w: ref.current.clientWidth, h: ref.current.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Recompute layout on data or canvas size change. Larger virtual canvas
  // (1.4×) than the visible area gives nodes more space to spread.
  useEffect(() => {
    const edges = buildEdges(papers);
    const w = Math.max(dim.w * REPULSION_BOOST, 600);
    const h = Math.max(dim.h * REPULSION_BOOST, 500);
    setLayout({ edges, nodes: layoutGraph(papers, edges, w, h), w, h });
  }, [papers, dim]);

  const counts = useMemo(() => {
    if (!layout) return {};
    const c = {};
    for (const e of layout.edges) {
      c[e.source] = (c[e.source] || 0) + e.weight;
      c[e.target] = (c[e.target] || 0) + e.weight;
    }
    return c;
  }, [layout]);

  // ── Pan / zoom handlers ───────────────────────────────────────────────
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((z) => Math.min(2.5, Math.max(0.4, z + delta)));
  };

  const onMouseDown = (e) => {
    if (e.target.closest("[data-node]")) return;
    dragRef.current = { x: e.clientX, y: e.clientY, pan };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.pan.x + (e.clientX - dragRef.current.x),
      y: dragRef.current.pan.y + (e.clientY - dragRef.current.y),
    });
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!layout) return <div ref={ref} style={{ flex: 1 }} />;
  const { edges, nodes, w: vw, h: vh } = layout;

  // Centre the virtual canvas inside the visible viewport, then apply pan.
  const offX = (dim.w - vw * zoom) / 2 + pan.x;
  const offY = (dim.h - vh * zoom) / 2 + pan.y;

  return (
    <div
      ref={ref}
      onWheel={handleWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        background: theme.backdrop,
        cursor: dragRef.current ? "grabbing" : "grab",
      }}
    >
      {/* Subtle dot grid */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4, pointerEvents: "none" }}>
        <defs>
          <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill={theme.panelBorder} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Network */}
      <svg
        width={dim.w}
        height={dim.h}
        style={{ position: "absolute", inset: 0 }}
        viewBox={`0 0 ${dim.w} ${dim.h}`}
      >
        <g transform={`translate(${offX}, ${offY}) scale(${zoom})`}>
          {edges.map((e, i) => {
            const a = nodes[e.source];
            const b = nodes[e.target];
            const hi = hovered && (hovered === e.source || hovered === e.target);
            const dimmed = hovered && !hi;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={hi ? theme.accent : theme.panelBorder}
                strokeWidth={hi ? 1.5 + e.weight * 0.6 : 0.7 + e.weight * 0.5}
                opacity={dimmed ? 0.08 : hi ? 0.8 : 0.4}
                style={{ transition: "all .2s" }}
              />
            );
          })}

          {papers.map((p) => {
            const n = nodes[p.id];
            const r = NODE_BASE_R + (counts[p.id] || 0) * NODE_WEIGHT_SCALE;
            const color = tagColor(p.tags[0]);
            const isHov = hovered === p.id;
            const isDim =
              hovered &&
              !isHov &&
              !edges.some(
                (e) =>
                  (e.source === hovered && e.target === p.id) ||
                  (e.target === hovered && e.source === p.id)
              );
            const labelAuthor = firstAuthor(p.authors);
            const label = `${labelAuthor}${p.year ? ` · ${p.year}` : ""}`;

            return (
              <g
                key={p.id}
                data-node="1"
                transform={`translate(${n.x},${n.y})`}
                style={{ cursor: "pointer", transition: "opacity .2s", opacity: isDim ? 0.2 : 1 }}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectPaper(p)}
              >
                {isHov && <circle r={r + 12} fill={color} opacity={0.18} />}
                <circle
                  r={r}
                  fill={color}
                  stroke={isHov ? theme.textBright : color + "cc"}
                  strokeWidth={isHov ? 2.5 : 1.5}
                />
                <circle r={r * 0.45} fill={theme.bg} opacity={0.35} />

                {/* Always-visible label below the node */}
                <text
                  y={r + 14}
                  textAnchor="middle"
                  fill={isHov ? theme.textBright : theme.textSubtle}
                  fontSize="11"
                  fontFamily="'Instrument Sans', sans-serif"
                  style={{ pointerEvents: "none", transition: "fill .15s" }}
                >
                  {label}
                </text>

                {/* Hover card with the full title + tags */}
                {isHov && (
                  <g style={{ pointerEvents: "none" }}>
                    {(() => {
                      const titleLines = wrapText(p.title, 36);
                      const lineHeight = 16;
                      const padding = 12;
                      const cardW = 320;
                      const tagsH = p.tags?.length ? 22 : 0;
                      const cardH = padding + titleLines.length * lineHeight + 18 + tagsH + padding;
                      const cardX = r + 18;
                      const cardY = -cardH / 2;
                      return (
                        <>
                          <rect
                            x={cardX}
                            y={cardY}
                            width={cardW}
                            height={cardH}
                            rx="6"
                            fill={theme.panel}
                            stroke={theme.accent + "55"}
                            strokeWidth="1"
                          />
                          {titleLines.map((line, i) => (
                            <text
                              key={i}
                              x={cardX + padding}
                              y={cardY + padding + 12 + i * lineHeight}
                              fill={theme.textBright}
                              fontSize="12"
                              fontFamily="'Instrument Serif', serif"
                              fontStyle="italic"
                            >
                              {line}
                            </text>
                          ))}
                          <text
                            x={cardX + padding}
                            y={cardY + padding + titleLines.length * lineHeight + 14}
                            fill={theme.textSubtle}
                            fontSize="10"
                          >
                            {p.authors.length > 50 ? p.authors.slice(0, 48) + "…" : p.authors}
                          </text>
                          {p.tags?.length > 0 &&
                            p.tags.slice(0, 4).map((t, i) => {
                              const tx = cardX + padding + i * 70;
                              const ty = cardY + cardH - padding - 12;
                              return (
                                <g key={t}>
                                  <rect
                                    x={tx}
                                    y={ty - 9}
                                    width={Math.min(t.length * 6 + 10, 65)}
                                    height={14}
                                    rx="3"
                                    fill={tagColor(t) + "33"}
                                    stroke={tagColor(t) + "55"}
                                  />
                                  <text
                                    x={tx + 5}
                                    y={ty + 1}
                                    fill={tagColor(t) + "ee"}
                                    fontSize="9"
                                  >
                                    {t.length > 9 ? t.slice(0, 8) + "…" : t}
                                  </text>
                                </g>
                              );
                            })}
                        </>
                      );
                    })()}
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          background: theme.panel + "e8",
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 8,
          padding: "0.7rem 0.95rem",
          fontSize: "0.7rem",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            color: theme.textMuted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "0.6rem",
            marginBottom: "0.5rem",
          }}
        >
          Network
        </div>
        <div style={{ color: theme.textSubtle, lineHeight: 1.7 }}>
          <div>● Paper (size = connections)</div>
          <div>— Shared tags</div>
          <div style={{ color: theme.textMuted, fontSize: "0.65rem", marginTop: "0.4rem" }}>
            scroll to zoom · drag to pan
          </div>
        </div>
      </div>

      {/* Stats + zoom controls */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            background: theme.panel + "e8",
            border: `1px solid ${theme.panelBorder}`,
            borderRadius: 8,
            padding: "0.55rem 0.85rem",
            fontSize: "0.7rem",
            backdropFilter: "blur(8px)",
            display: "flex",
            gap: "1rem",
          }}
        >
          <div>
            <span style={{ color: theme.textMuted }}>papers</span>{" "}
            <span style={{ color: theme.accent, fontWeight: 500, marginLeft: "0.3rem" }}>
              {papers.length}
            </span>
          </div>
          <div>
            <span style={{ color: theme.textMuted }}>edges</span>{" "}
            <span style={{ color: theme.accent, fontWeight: 500, marginLeft: "0.3rem" }}>
              {edges.length}
            </span>
          </div>
        </div>

        <div
          style={{
            background: theme.panel + "e8",
            border: `1px solid ${theme.panelBorder}`,
            borderRadius: 8,
            padding: "0.3rem",
            backdropFilter: "blur(8px)",
            display: "flex",
            gap: "0.3rem",
          }}
        >
          <ZoomBtn theme={theme} onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}>−</ZoomBtn>
          <button
            onClick={resetView}
            style={{
              background: "transparent",
              border: "none",
              color: theme.textSubtle,
              fontSize: "0.65rem",
              padding: "0.25rem 0.55rem",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
            title="Reset view"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ZoomBtn theme={theme} onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}>+</ZoomBtn>
        </div>
      </div>
    </div>
  );
}

function ZoomBtn({ children, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: theme.chip,
        border: `1px solid ${theme.chipBorder}`,
        color: theme.accent,
        borderRadius: 5,
        width: 26,
        height: 22,
        cursor: "pointer",
        fontSize: "0.85rem",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

// Word-wrap a string into lines no longer than maxChars.
function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length <= maxChars) {
      current = (current + " " + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // cap at 3 lines
}
