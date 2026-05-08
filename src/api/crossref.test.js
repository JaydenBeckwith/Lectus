import { describe, it, expect, vi, afterEach } from "vitest";
import { lookupDoi } from "./crossref";

const ok = (json) => ({ ok: true, status: 200, json: async () => json });
const fail = (status) => ({ ok: false, status, json: async () => ({}) });

afterEach(() => vi.restoreAllMocks());

describe("lookupDoi", () => {
  it("rejects empty DOIs", async () => {
    await expect(lookupDoi("")).rejects.toThrow(/empty/i);
  });

  it("strips https://doi.org/ prefix before fetching", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      ok({
        message: {
          title: ["A title"],
          author: [{ family: "Smith", given: "John" }],
          "container-title": ["NEJM"],
          DOI: "10.1/x",
          issued: { "date-parts": [[2020]] },
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const meta = await lookupDoi("https://doi.org/10.1/x");
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("10.1%2Fx");
    expect(url).not.toContain("doi.org/10.1");
    expect(meta.title).toBe("A title");
    expect(meta.year).toBe(2020);
  });

  it("formats authors as 'Family Initials' and adds 'et al.' beyond 3", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        ok({
          message: {
            title: ["t"],
            author: [
              { family: "Smith", given: "John David" },
              { family: "Doe", given: "Alice" },
              { family: "Roe", given: "Bob" },
              { family: "Lee", given: "Carl" },
            ],
            DOI: "10.1/y",
          },
        })
      )
    );
    const meta = await lookupDoi("10.1/y");
    expect(meta.authors).toMatch(/et al\.?$/);
    expect(meta.authors).toContain("Smith JD");
  });

  it("throws a useful error on 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fail(404)));
    await expect(lookupDoi("10.1/missing")).rejects.toThrow(/not found/i);
  });

  it("falls back to OpenAlex when CrossRef gives no abstract", async () => {
    let call = 0;
    const fetchMock = vi.fn().mockImplementation((url) => {
      call += 1;
      if (call === 1) {
        // CrossRef — no abstract.
        return Promise.resolve(
          ok({
            message: {
              title: ["t"],
              author: [{ family: "Smith", given: "J" }],
              DOI: "10.1/z",
              issued: { "date-parts": [[2020]] },
              // no abstract, no subject
            },
          })
        );
      }
      // OpenAlex fallback.
      return Promise.resolve(
        ok({
          abstract_inverted_index: { Hello: [0], world: [1] },
          concepts: [{ display_name: "Oncology", score: 0.9 }],
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const meta = await lookupDoi("10.1/z");
    expect(meta.abstract).toBe("Hello world");
    expect(meta.tags).toEqual(["oncology"]);
  });
});
