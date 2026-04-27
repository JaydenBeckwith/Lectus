import { useState, useRef, useEffect } from "react";
import { buildEdges, layoutGraph } from "../utils/graph";
import { tagColor } from "../constants/tagColors";

// Force-directed graph of papers connected by shared tags.
export default function GraphView({ papers, onSelectPaper, theme }) {
  const [hovered, setHovered] = useState(null);
  const [dim, setDim] = useState({ w: 800, h: 600 });
  const [layout, setLayout] = useState(null);
  const ref = useRef(null);

  // Track container size so the layout fills available space.
  useEffect(() => {
    const update = () => {
      if (ref.current) {
        setDim({ w: ref.current.clientWidth, h: ref.current.clientHeight });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Recompute layout whenever papers or container size change.
  useEffect(() => {
    const edges = buildEdges(papers);
    setLayout({ edges, nodes: layoutGraph(papers, edges, dim.w, dim.h) });
  }, [papers, dim]);

  if (!layout) return <div ref={ref} style={{ flex: 1 }} />;

  const { edges, nodes } = layout;
  const counts = {};
  edges.forEach((e) => {
    counts[e.source] = (counts[e.source] || 0) + e.weight;
    counts[e.target] = (counts[e.target] || 0) + e.weight;
  });

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        background: theme.backdrop,
      }}
    >
      {/* Subtle dot grid background */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4, pointerEvents: "none" }}>
        <defs>
          <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill={theme.panelBorder} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Nodes + edges */}
      <svg width={dim.w} height={dim.h} style={{ position: "absolute", inset: 0 }}>
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
              strokeWidth={hi ? 1 + e.weight * 0.4 : 0.5 + e.weight * 0.3}
              opacity={dimmed ? 0.1 : hi ? 0.7 : 0.35}
              style={{ transition: "all .2s" }}
            />
          );
        })}

        {papers.map((p) => {
          const n = nodes[p.id];
          const r = 8 + (counts[p.id] || 0) * 1.2;
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
          return (
            <g
              key={p.id}
              transform={`translate(${n.x},${n.y})`}
              style={{ cursor: "pointer", transition: "opacity .2s", opacity: isDim ? 0.25 : 1 }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectPaper(p)}
            >
              {isHov && <circle r={r + 8} fill={color} opacity={0.15} />}
              <circle r={r} fill={color} stroke={isHov ? theme.textBright : color + "cc"} strokeWidth={isHov ? 2 : 1} />
              <circle r={r * 0.5} fill={theme.bg} opacity={0.3} />
              {isHov && (
                <g>
                  <rect
                    x={r + 12}
                    y={-22}
                    width={Math.min(p.title.length * 5.5, 280)}
                    height={44}
                    fill={theme.panel}
                    stroke={theme.panelBorder}
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={r + 20}
                    y={-6}
                    fill={theme.textBright}
                    fontSize="11"
                    fontFamily="'Instrument Serif', serif"
                    fontStyle="italic"
                  >
                    {p.title.length > 50 ? p.title.slice(0, 48) + "…" : p.title}
                  </text>
                  <text x={r + 20} y={10} fill={theme.textSubtle} fontSize="9">
                    {p.authors.split(",")[0]} · {p.year}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          background: theme.panel + "d8",
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 8,
          padding: "0.7rem 0.9rem",
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
        </div>
      </div>

      {/* Stats badge */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: theme.panel + "d8",
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 8,
          padding: "0.6rem 0.85rem",
          fontSize: "0.7rem",
          backdropFilter: "blur(8px)",
          display: "flex",
          gap: "1rem",
        }}
      >
        <div>
          <span style={{ color: theme.textMuted }}>papers</span>{" "}
          <span style={{ color: theme.accent, fontWeight: 500, marginLeft: "0.3rem" }}>{papers.length}</span>
        </div>
        <div>
          <span style={{ color: theme.textMuted }}>edges</span>{" "}
          <span style={{ color: theme.accent, fontWeight: 500, marginLeft: "0.3rem" }}>{edges.length}</span>
        </div>
      </div>
    </div>
  );
}
