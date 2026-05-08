import { describe, it, expect } from "vitest";
import {
  SYSTEM_PROMPT,
  PDF_EXTRACT_PROMPT,
  reviewPrompt,
  structuredReviewPrompt,
  contradictionPrompt,
  enrichFromCitationPrompt,
  sectionDeepenPrompt,
  tagSuggestionPrompt,
} from "./prompts";

const paper = (overrides = {}) => ({
  id: "p1",
  title: "A title",
  authors: "Smith, J",
  journal: "Cell",
  year: 2024,
  tags: ["onc"],
  abstract: "An abstract.",
  keyFindings: ["finding 1"],
  ...overrides,
});

describe("SYSTEM_PROMPT", () => {
  it("includes the methods/results/discussion text when present", () => {
    const p = paper({
      methods: "We did methods.",
      results: "We got results.",
      discussion: "We argued.",
    });
    const out = SYSTEM_PROMPT([p]);
    expect(out).toContain("Methods: We did methods.");
    expect(out).toContain("Results: We got results.");
    expect(out).toContain("Discussion: We argued.");
  });

  it("omits sections that are empty rather than emitting blank labels", () => {
    const out = SYSTEM_PROMPT([paper()]);
    expect(out).not.toMatch(/Methods:\s*\n/);
    expect(out).not.toMatch(/Results:\s*\n/);
    expect(out).not.toMatch(/Discussion:\s*\n/);
  });
});

describe("PDF_EXTRACT_PROMPT", () => {
  it("asks for methods, results, and discussion in the JSON schema", () => {
    expect(PDF_EXTRACT_PROMPT).toMatch(/"methods":/);
    expect(PDF_EXTRACT_PROMPT).toMatch(/"results":/);
    expect(PDF_EXTRACT_PROMPT).toMatch(/"discussion":/);
  });
});

describe("reviewPrompt", () => {
  it("threads the topic through and includes the paper count", () => {
    const out = reviewPrompt([paper(), paper({ id: "p2" })], "splicing");
    expect(out).toContain('focused on: "splicing"');
    expect(out).toContain("synthesising the following 2 papers");
  });

  it("works without a topic", () => {
    const out = reviewPrompt([paper()]);
    expect(out).not.toMatch(/focused on/);
  });
});

describe("structuredReviewPrompt", () => {
  it("emits the JSON schema keys the parser expects", () => {
    const out = structuredReviewPrompt([paper()]);
    for (const key of ["summary", "agreements", "contradictions", "gaps", "future_directions", "per_paper"]) {
      expect(out).toContain(`"${key}"`);
    }
  });
});

describe("contradictionPrompt", () => {
  it("lists every paper input and asks for a strict JSON shape", () => {
    const out = contradictionPrompt([paper(), paper({ id: "p2", title: "B" })]);
    expect(out).toContain("comparing 2 papers");
    expect(out).toContain('"contradictions"');
    expect(out).toContain('"agreements"');
  });
});

describe("enrichFromCitationPrompt", () => {
  it("includes title, DOI, and abstract", () => {
    const p = paper({ doi: "10.1/x", abstract: "Crisp summary." });
    const out = enrichFromCitationPrompt(p);
    expect(out).toContain("Title: A title");
    expect(out).toContain("DOI: 10.1/x");
    expect(out).toContain("Abstract: Crisp summary.");
  });

  it("flags a missing abstract with a placeholder", () => {
    const out = enrichFromCitationPrompt(paper({ abstract: "" }));
    expect(out).toContain("(no abstract available)");
  });
});

describe("sectionDeepenPrompt", () => {
  it("asks specifically for the requested section", () => {
    const out = sectionDeepenPrompt(paper(), "results");
    expect(out).toContain("RESULTS");
    expect(out).toMatch(/effect sizes/i);
  });

  it("includes the existing section text so the model can improve on it", () => {
    const out = sectionDeepenPrompt(paper({ methods: "Old methods." }), "methods");
    expect(out).toContain("Old methods.");
  });
});

describe("tagSuggestionPrompt", () => {
  it("lists existing tags so the model can avoid repeating them", () => {
    const out = tagSuggestionPrompt(paper(), ["existing"]);
    expect(out).toMatch(/existing/);
  });
});
