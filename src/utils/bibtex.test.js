import { describe, it, expect } from "vitest";
import { papersToBibtex, parseBibtex } from "./bibtex";

const seedPaper = () => ({
  id: "p1",
  title: "Pembrolizumab in advanced melanoma",
  authors: "Smith J, Doe A, et al.",
  journal: "NEJM",
  year: 2020,
  doi: "10.1056/NEJMoa1234567",
  tags: ["melanoma", "immunotherapy", "PD1"],
  abstract: "We evaluated the drug & found a 30% response.",
  notes: "Read in 2024 — relevant for thesis.",
});

describe("papersToBibtex", () => {
  it("emits an @article block with the expected fields", () => {
    const out = papersToBibtex([seedPaper()]);
    expect(out).toMatch(/^@article\{/);
    expect(out).toContain("title = {Pembrolizumab in advanced melanoma}");
    expect(out).toContain("year = {2020}");
    expect(out).toContain("doi = {10.1056/NEJMoa1234567}");
    expect(out).toContain("keywords = {melanoma, immunotherapy, PD1}");
  });

  it("escapes BibTeX-special characters in values", () => {
    const out = papersToBibtex([seedPaper()]);
    // `&` in the abstract should be escaped to `\&`
    expect(out).toContain("\\&");
  });

  it("derives a deterministic citekey from author surname + year", () => {
    const out = papersToBibtex([seedPaper()]);
    expect(out).toMatch(/@article\{smith2020_/);
  });

  it("skips empty optional fields rather than emitting blanks", () => {
    const p = seedPaper();
    p.notes = "";
    p.abstract = "";
    const out = papersToBibtex([p]);
    expect(out).not.toContain("note = {}");
    expect(out).not.toContain("abstract = {}");
  });
});

describe("parseBibtex", () => {
  it("parses a single @article entry into a paper-shaped object", () => {
    const input = `@article{smith2020,
      title    = {Pembrolizumab in advanced melanoma},
      author   = {Smith, John and Doe, Alice},
      journal  = {NEJM},
      year     = 2020,
      doi      = {10.1056/NEJMoa1234567},
      keywords = {melanoma, immunotherapy},
      abstract = {We evaluated the drug.}
    }`;
    const [paper] = parseBibtex(input);
    expect(paper.title).toBe("Pembrolizumab in advanced melanoma");
    expect(paper.authors).toBe("John Smith, Alice Doe");
    expect(paper.journal).toBe("NEJM");
    expect(paper.year).toBe(2020);
    expect(paper.doi).toBe("10.1056/NEJMoa1234567");
    expect(paper.tags).toEqual(["melanoma", "immunotherapy"]);
    expect(paper.abstract).toBe("We evaluated the drug.");
    expect(paper.status).toBe("to-read");
  });

  it("falls back to a default `imported` tag when keywords are missing", () => {
    const input = `@article{anon2018, title = {Untagged}, year = 2018}`;
    const [paper] = parseBibtex(input);
    expect(paper.tags).toEqual(["imported"]);
  });

  it("ignores @string and @comment entries", () => {
    const input = `
      @string{nejm = "NEJM"}
      @comment{this is a note}
      @article{a2020, title = {Real}, year = 2020}
    `;
    const papers = parseBibtex(input);
    expect(papers).toHaveLength(1);
    expect(papers[0].title).toBe("Real");
  });

  it("handles quoted values as well as braces", () => {
    const input = `@article{a, title = "Quoted Title", year = 2020}`;
    const [paper] = parseBibtex(input);
    expect(paper.title).toBe("Quoted Title");
  });

  it("survives a serialise → parse round-trip", () => {
    const original = seedPaper();
    const bib = papersToBibtex([original]);
    const [round] = parseBibtex(bib);
    expect(round.title).toBe(original.title);
    expect(round.year).toBe(original.year);
    expect(round.doi).toBe(original.doi);
    expect(round.tags).toEqual(original.tags);
    // abstract should round-trip with escaped & decoded back
    expect(round.abstract).toContain("30% response");
  });
});
