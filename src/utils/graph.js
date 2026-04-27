// ── Graph helpers ─────────────────────────────────────────────────────────────
// Build edges between papers from shared tags, then run a force-directed
// layout to position nodes for the GraphView.

export const buildEdges = (papers) => {
  const edges = [];
  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const shared = papers[i].tags.filter((t) => papers[j].tags.includes(t));
      if (shared.length > 0) {
        edges.push({
          source: papers[i].id,
          target: papers[j].id,
          weight: shared.length,
          sharedTags: shared,
        });
      }
    }
  }
  return edges;
};

// Simple repulsion + spring force layout. Iterations is tuned for ~6-30 papers;
// scale down for larger libraries if it ever feels sluggish.
export const layoutGraph = (papers, edges, width, height, iterations = 250) => {
  const nodes = papers.map((p, i) => ({
    id: p.id,
    x: width / 2 + Math.cos((i / papers.length) * 2 * Math.PI) * 120,
    y: height / 2 + Math.sin((i / papers.length) * 2 * Math.PI) * 120,
    vx: 0,
    vy: 0,
  }));
  const map = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const k = 75;
  const repulsion = 5500;
  const stiffness = 0.045;
  const damping = 0.85;
  const cx = width / 2;
  const cy = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    // Pairwise repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = repulsion / (d * d);
        nodes[i].vx -= (dx / d) * f;
        nodes[i].vy -= (dy / d) * f;
        nodes[j].vx += (dx / d) * f;
        nodes[j].vy += (dy / d) * f;
      }
    }
    // Edge springs
    for (const e of edges) {
      const a = map[e.source];
      const b = map[e.target];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = stiffness * (d - k) * e.weight;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f;
      b.vy -= (dy / d) * f;
    }
    // Centering pull + damping + integrate
    for (const n of nodes) {
      n.vx += (cx - n.x) * 0.005;
      n.vy += (cy - n.y) * 0.005;
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(50, Math.min(width - 50, n.x));
      n.y = Math.max(50, Math.min(height - 50, n.y));
    }
  }
  return map;
};
