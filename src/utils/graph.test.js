import { describe, it, expect } from "vitest";
import { buildEdges, layoutGraph } from "./graph";

const paper = (id, ...tags) => ({ id, tags });

describe("buildEdges", () => {
  it("returns no edges when no tags overlap", () => {
    const papers = [paper("a", "x"), paper("b", "y")];
    expect(buildEdges(papers)).toEqual([]);
  });

  it("creates one edge per pair of papers that share at least one tag", () => {
    const papers = [
      paper("a", "x", "y"),
      paper("b", "y", "z"),
      paper("c", "z"),
    ];
    const edges = buildEdges(papers);
    expect(edges).toHaveLength(2);
    const ab = edges.find((e) => e.source === "a" && e.target === "b");
    expect(ab.weight).toBe(1);
    expect(ab.sharedTags).toEqual(["y"]);
  });

  it("weights edges by the number of shared tags", () => {
    const papers = [paper("a", "x", "y", "z"), paper("b", "x", "y")];
    const [edge] = buildEdges(papers);
    expect(edge.weight).toBe(2);
    expect(edge.sharedTags).toEqual(["x", "y"]);
  });

  it("does not produce self-loops", () => {
    const papers = [paper("a", "x")];
    expect(buildEdges(papers)).toEqual([]);
  });
});

describe("layoutGraph", () => {
  it("returns a node map keyed by paper id with positions inside the box", () => {
    const papers = [paper("a", "x"), paper("b", "x"), paper("c", "y")];
    const edges = buildEdges(papers);
    const nodes = layoutGraph(papers, edges, 600, 400, 25);
    expect(Object.keys(nodes).sort()).toEqual(["a", "b", "c"]);
    for (const n of Object.values(nodes)) {
      expect(n.x).toBeGreaterThanOrEqual(50);
      expect(n.x).toBeLessThanOrEqual(550);
      expect(n.y).toBeGreaterThanOrEqual(50);
      expect(n.y).toBeLessThanOrEqual(350);
    }
  });
});
