import { useState, useRef, useEffect, useMemo } from "react";
import { buildEdges, layoutGraph } from "../utils/graph";
import { tagColor } from "../constants/tagColors";

// Force-directed graph of papers connected by shared tags. Larger nodes,
// always-visible "Author Year" labels, expanded hover card, mouse-wheel zoom,
// drag-to-pan, and drag-to-reposition individual nodes (the position sticks).

const NODE_BASE_R = 14;
const NODE_WEIGHT_SCALE = 1.8;
const REPULSION_BOOST = 1.4;
const DRAG_THRESHOLD_PX = 3; // below this, treat as a click instead of drag

const firstAuthor = (s = "") => (s.split(",")[0] || "").trim();

export default function GraphView({ papers, onSelectPaper, theme }) {
  const [hovered, setHovered] = useState(null);
  const [dim, setDim] = useState({ w: 800, h: 600 });
  const [layout, setLayout] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Drag state. `panDrag` for canvas panning, `nodeDrag` for moving a node.
  // We keep them as refs (not state) so mid-drag updates don't re-render
  // every pixel — only the layout / pan state setters do.
  const panDrag = useRef(null);
  const nodeDrag = useRef(null);
  const ref = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const update = () => {
      if (ref.current) setDim({ w: ref.current.clientWidth, h: ref.current.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  // Convert client (mouse) coords to the layout's world coords, accounting
  // for the current pan + zoom + viewport-centre offset.
  const clientToWorld = (clientX, clientY) => {
    if (!svgRef.current || !layout) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const offX = (dim.w - layout.w * zoom) / 2 + pan.x;
    const offY = (dim.h - layout.h * zoom) / 2 + pan.y;
    return {
      x: (clientX - rect.left - offX) / zoom,
      y: (clientY - rect.top - offY) / zoom,
    };
  };

  // Move a single node's position in layout state.
  const moveNode = (id, x, y) => {
    setLayout((prev) => ({
      ...prev,
      nodes: { ...prev.nodes, [id]: { ...prev.nodes[id], x, y } },
    }));
  };

  // ── Wheel zoom ────────────────────────────────────────────────────────
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((z) => Math.min(2.5, Math.max(0.4, z + delta)));
  };

  // ── Mouse handlers (canvas pan + node drag) ───────────────────────────
  const onMouseDown = (e) => {
    const target = e.target.closest("[data-node]");
    if (target) {
      // Begin a node drag. We still track the start position so a
      // tiny movement counts as a click (selection) rather than a drag.
      nodeDrag.current = {
        id: target.getAttribute("data-id"),
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
    } else {
      panDrag.current = { x: e.clientX, y: e.clientY, pan };
    }
  };

  const onMouseMove = (e) => {
    if (nodeDrag.current) {
      const dx = e.clientX - nodeDrag.current.startX;
      const dy = e.clientY - nodeDrag.current.startY;
      if (!nodeDrag.current.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        nodeDrag.current.moved = true;
      }
      if (nodeDrag.current.moved) {
        const { x, y } = clientToWorld(e.clientX, e.clientY);
        moveNode(nodeDrag.current.id, x, y);
      }
      return;
    }
    if (panDrag.current) {
      setPan({
        x: panDrag.current.pan.x + (e.clientX - panDrag.current.x),
        y: panDrag.current.pan.y + (e.clientY - panDrag.current.y),
      });
    }
  };

  const onMouseUp = () => {
    // Suppress the click->select that would normally fire after a drag.
    if (nodeDrag.current?.moved) {
      // schedule a flag clear after the click event is processed
      const id = nodeDrag.current.id;
      suppressClickRef.current = id;
      setTimeout(() => {
        if (suppressClickRef.current === id) suppressClickRef.current = null;
      }, 0);
    }
    nodeDrag.current = null;
    panDrag.current = null;
  };

  // Used to swallow the synthetic click that follows a drag.
  const suppressClickRef = useRef(null);

  const handleNodeClick = (p) => {
    if (suppressClickRef.current === p.id) {
      suppressClickRef.current = null;
      return;
    }
    onSelectPaper(p);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!layout) return <div ref={ref} style={{ flex: 1 }} />;
  const { edges, nodes, w: vw, h: vh } = layout;
  const offX = (dim.w - vw * zoom) / 2 + pan.x;
  const offY = (dim.h - vh * zoom) / 2 + pan.y;
  const isDragging = Boolean(panDrag.current || nodeDrag.current?.moved);

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
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
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

      <svg
        ref={svgRef}
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
            const isCurrentlyDragged = nodeDrag.current?.id === p.id && nodeDrag.current?.moved;

            return (
              <g
                key={p.id}
                data-node="1"
                data-id={p.id}
                transform={`translate(${n.x},${n.y})`}
                style={{
                  cursor: isCurrentlyDragged ? "grabbing" : "grab",
                  transition: isCurrentlyDragged ? "none" : "opacity .2s",
                  opacity: isDim ? 0.2 : 1,
                }}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleNodeClick(p)}
              >
                {isHov && <circle r={r + 12} fill={color} opacity={0.18} />}
                <circle
                  r={r}
                  fill={color}
                  stroke={isHov || isCurrentlyDragged ? theme.textBright : color + "cc"}
                  strokeWidth={isHov || isCurrentlyDragged ? 2.5 : 1.5}
                />
                <circle r={r * 0.45} fill={theme.bg} opacity={0.35} />

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

                {isHov && !isCurrentlyDragged && (
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
                          <rect x={cardX} y={cardY} width={cardW} height={cardH} rx="6"
                            fill={theme.panel} stroke={theme.accent + "55"} strokeWidth="1" />
                          {titleLines.map((line, i) => (
                            <text key={i} x={cardX + padding}
                              y={cardY + padding + 12 + i * lineHeight}
                              fill={theme.textBright} fontSize="12"
                              fontFamily="'Instrument Serif', serif" fontStyle="italic">
                              {line}
                            </text>
                          ))}
                          <text x={cardX + padding}
                            y={cardY + padding + titleLines.length * lineHeight + 14}
                            fill={theme.textSubtle} fontSize="10">
                            {p.authors.length > 50 ? p.authors.slice(0, 48) + "…" : p.authors}
                          </text>
                          {p.tags?.length > 0 &&
                            p.tags.slice(0, 4).map((t, i) => {
                              const tx = cardX + padding + i * 70;
                              const ty = cardY + cardH - padding - 12;
                              return (
                                <g key={t}>
                                  <rect x={tx} y={ty - 9}
                                    width={Math.min(t.length * 6 + 10, 65)} height={14} rx="3"
                                    fill={tagColor(t) + "33"} stroke={tagColor(t) + "55"} />
                                  <text x={tx + 5} y={ty + 1} fill={tagColor(t) + "ee"} fontSize="9">
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
      <div style={{
        position: "absolute", bottom: 16, left: 16,
        background: theme.panel + "e8", border: `1px solid ${theme.panelBorder}`,
        borderRadius: 8, padding: "0.7rem 0.95rem", fontSize: "0.7rem", backdropFilter: "blur(8px)",
      }}>
        <div style={{ color: theme.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.6rem", marginBottom: "0.5rem" }}>Network</div>
        <div style={{ color: theme.textSubtle, lineHeight: 1.7 }}>
          <div>● Paper (size = connections)</div>
          <div>— Shared tags</div>
          <div style={{ color: theme.textMuted, fontSize: "0.65rem", marginTop: "0.4rem" }}>
            scroll = zoom · drag empty = pan · drag node = move
          </div>
        </div>
      </div>

      {/* Stats + zoom */}
      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
        <div style={{
          background: theme.panel + "e8", border: `1px solid ${theme.panelBorder}`,
          borderRadius: 8, padding: "0.55rem 0.85rem", fontSize: "0.7rem",
          backdropFilter: "blur(8px)", display: "flex", gap: "1rem",
        }}>
          <div><span style={{ color: theme.textMuted }}>papers</span> <span style={{ color: theme.accent, fontWeight: 500, marginLeft: "0.3rem" }}>{papers.length}</span></div>
          <div><span style={{ color: theme.textMuted }}>edges</span> <span style={{ color: theme.accent, fontWeight: 500, marginLeft: "0.3rem" }}>{edges.length}</span></div>
        </div>
        <div style={{
          background: theme.panel + "e8", border: `1px solid ${theme.panelBorder}`,
          borderRadius: 8, padding: "0.3rem", backdropFilter: "blur(8px)",
          display: "flex", gap: "0.3rem",
        }}>
          <ZoomBtn theme={theme} onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}>−</ZoomBtn>
          <button onClick={resetView} style={{
            background: "transparent", border: "none", color: theme.textSubtle,
            fontSize: "0.65rem", padding: "0.25rem 0.55rem", cursor: "pointer",
            letterSpacing: "0.04em",
          }} title="Reset view">{Math.round(zoom * 100)}%</button>
          <ZoomBtn theme={theme} onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}>+</ZoomBtn>
        </div>
      </div>
    </div>
  );
}

function ZoomBtn({ children, onClick, theme }) {
  return (
    <button onClick={onClick} style={{
      background: theme.chip, border: `1px solid ${theme.chipBorder}`,
      color: theme.accent, borderRadius: 5, width: 26, height: 22,
      cursor: "pointer", fontSize: "0.85rem", lineHeight: 1,
    }}>{children}</button>
  );
}

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
  return lines.slice(0, 3);
}
