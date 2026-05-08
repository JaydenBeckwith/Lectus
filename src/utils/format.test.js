import { describe, it, expect } from "vitest";
import { fmt } from "./format";

describe("fmt", () => {
  it("converts **bold** runs to <strong>", () => {
    expect(fmt("hello **world**")).toBe("hello <strong>world</strong>");
  });

  it("converts leading '- ' bullets to <li>", () => {
    expect(fmt("- one\n- two")).toBe("<li>one</li><br/><li>two</li>");
  });

  it("turns newlines into <br/>", () => {
    expect(fmt("a\nb")).toBe("a<br/>b");
  });

  it("handles plain text untouched (other than newline → br)", () => {
    expect(fmt("plain text")).toBe("plain text");
  });
});
