import { describe, it, expect, vi, afterEach } from "vitest";
import { lookupOpenAlex } from "./openalex";

const ok = (json) => ({ ok: true, status: 200, json: async () => json });
const fail = (status) => ({ ok: false, status, json: async () => ({}) });

afterEach(() => vi.restoreAllMocks());

describe("lookupOpenAlex", () => {
  it("rejects empty DOIs", async () => {
    await expect(lookupOpenAlex("")).rejects.toThrow(/empty/i);
  });

  it("reconstructs the abstract from an inverted index", async () => {
    // OpenAlex's format: { word: [positions...] }. Words placed at their
    // positions and joined with single spaces.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        ok({
          abstract_inverted_index: {
            Hello: [0],
            world: [1],
            from: [2],
            OpenAlex: [3],
          },
          concepts: [],
        })
      )
    );
    const result = await lookupOpenAlex("10.1/example");
    expect(result.abstract).toBe("Hello world from OpenAlex");
  });

  it("returns concepts above 0.4 score, lowercased, max 6", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        ok({
          abstract_inverted_index: null,
          concepts: [
            { display_name: "Oncology", score: 0.9 },
            { display_name: "Genomics", score: 0.55 },
            { display_name: "Boring", score: 0.1 },
            { display_name: "Pharmacology", score: 0.42 },
          ],
        })
      )
    );
    const result = await lookupOpenAlex("10.1/example");
    expect(result.concepts).toEqual(["oncology", "genomics", "pharmacology"]);
  });

  it("strips the doi.org prefix before calling the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ abstract_inverted_index: {}, concepts: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await lookupOpenAlex("https://doi.org/10.1/example");
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("10.1%2Fexample");
    expect(url).not.toContain("doi.org/10.1");
  });

  it("throws a useful error on 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fail(404)));
    await expect(lookupOpenAlex("10.1/missing")).rejects.toThrow(/not indexed/i);
  });
});
