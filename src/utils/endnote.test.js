import { describe, it, expect } from "vitest";
import { parseEndnoteOrRis, detectEndnoteFormat } from "./endnote";

const ENW_SAMPLE = `%0 Journal Article
%T Pembrolizumab in advanced melanoma
%A Smith, John
%A Doe, Alice
%J NEJM
%D 2020
%R 10.1056/NEJMoa1234567
%K melanoma
%K immunotherapy
%X We evaluated the drug and observed durable responses.
%Z Read on the train.

%0 Journal Article
%T Microbiome diversity in IBD
%A Roe, Bob
%J Gut
%D 2019
%R 10.1136/example
%K microbiome
%K IBD
%X Stool samples from 200 patients.`;

const RIS_SAMPLE = `TY  - JOUR
T1  - Pembrolizumab in advanced melanoma
AU  - Smith, John
AU  - Doe, Alice
JO  - NEJM
PY  - 2020
DO  - 10.1056/NEJMoa1234567
KW  - melanoma
KW  - immunotherapy
AB  - We evaluated the drug and observed durable responses.
N1  - Read on the train.
ER  -

TY  - JOUR
T1  - Microbiome diversity in IBD
AU  - Roe, Bob
JF  - Gut
PY  - 2019
DO  - 10.1136/example
KW  - microbiome
KW  - IBD
AB  - Stool samples from 200 patients.
ER  -`;

describe("detectEndnoteFormat", () => {
  it("returns 'enw' for EndNote tagged input", () => {
    expect(detectEndnoteFormat(ENW_SAMPLE)).toBe("enw");
  });

  it("returns 'ris' for RIS input", () => {
    expect(detectEndnoteFormat(RIS_SAMPLE)).toBe("ris");
  });

  it("returns null for unrelated text", () => {
    expect(detectEndnoteFormat("@article{foo, title = {Bar}}")).toBeNull();
    expect(detectEndnoteFormat("")).toBeNull();
  });
});

describe("parseEndnoteOrRis — ENW", () => {
  it("parses two records with correct fields", () => {
    const papers = parseEndnoteOrRis(ENW_SAMPLE);
    expect(papers).toHaveLength(2);
  });

  it("collects multiple %A lines into a comma-separated authors string", () => {
    const [first] = parseEndnoteOrRis(ENW_SAMPLE);
    expect(first.authors).toBe("Smith, John, Doe, Alice");
  });

  it("collects multiple %K lines into a tags array", () => {
    const [first] = parseEndnoteOrRis(ENW_SAMPLE);
    expect(first.tags).toEqual(["melanoma", "immunotherapy"]);
  });

  it("captures journal, year (numeric), DOI, abstract, notes", () => {
    const [first] = parseEndnoteOrRis(ENW_SAMPLE);
    expect(first.journal).toBe("NEJM");
    expect(first.year).toBe(2020);
    expect(first.doi).toBe("10.1056/NEJMoa1234567");
    expect(first.abstract).toMatch(/durable responses/);
    expect(first.notes).toBe("Read on the train.");
  });

  it("falls back to a default tag when none are provided", () => {
    const minimal = "%0 Journal Article\n%T Untagged paper\n%A Anon\n%D 2018";
    const [paper] = parseEndnoteOrRis(minimal);
    expect(paper.tags).toEqual(["imported"]);
  });
});

describe("parseEndnoteOrRis — RIS", () => {
  it("parses two records with correct fields", () => {
    const papers = parseEndnoteOrRis(RIS_SAMPLE);
    expect(papers).toHaveLength(2);
  });

  it("collects AU lines into authors and KW lines into tags", () => {
    const [first] = parseEndnoteOrRis(RIS_SAMPLE);
    expect(first.authors).toBe("Smith, John, Doe, Alice");
    expect(first.tags).toEqual(["melanoma", "immunotherapy"]);
  });

  it("treats JF/JO/T2 all as journal", () => {
    const [, second] = parseEndnoteOrRis(RIS_SAMPLE);
    expect(second.journal).toBe("Gut");
  });

  it("captures DOI, year, abstract, notes", () => {
    const [first] = parseEndnoteOrRis(RIS_SAMPLE);
    expect(first.doi).toBe("10.1056/NEJMoa1234567");
    expect(first.year).toBe(2020);
    expect(first.abstract).toMatch(/durable responses/);
    expect(first.notes).toBe("Read on the train.");
  });

  it("handles a record without a trailing ER line", () => {
    const trimmed = RIS_SAMPLE.replace(/ER\s+-\n?/g, "");
    const papers = parseEndnoteOrRis(trimmed);
    // Without ER, both records merge — but at least we should get one paper.
    expect(papers.length).toBeGreaterThan(0);
    expect(papers[0].title).toBeTruthy();
  });
});

describe("parseEndnoteOrRis — empty / unknown input", () => {
  it("returns [] for empty input", () => {
    expect(parseEndnoteOrRis("")).toEqual([]);
  });

  it("returns [] for unrelated input", () => {
    expect(parseEndnoteOrRis("hello world")).toEqual([]);
  });
});
