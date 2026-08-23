import { describe, it, expect } from "vitest";
import { tokenize, TOKEN } from "../src/template/parser.js";

describe("tokenize", () => {
  it("tokenizes a simple element", () => {
    const tokens = tokenize("<div>Hello</div>");
    expect(tokens[0].type).toBe(TOKEN.OPEN_TAG);
    expect(tokens[0].tag).toBe("div");
    expect(tokens[1].type).toBe(TOKEN.TEXT);
    expect(tokens[1].raw).toBe("Hello");
    expect(tokens[2].type).toBe(TOKEN.CLOSE_TAG);
  });

  it("tokenizes void elements as self-closing", () => {
    const tokens = tokenize("<br />");
    expect(tokens[0].type).toBe(TOKEN.SELF_CLOSE);
    expect(tokens[0].tag).toBe("br");
  });

  it("tokenizes expressions", () => {
    const tokens = tokenize("<p>${x}</p>");
    expect(tokens[1].type).toBe(TOKEN.EXPR);
    expect(tokens[1].raw).toBe("${x}");
  });

  it("tokenizes comments", () => {
    const tokens = tokenize("<!-- hi -->");
    expect(tokens[0].type).toBe(TOKEN.COMMENT);
  });

  it("tokenizes attributes with expressions", () => {
    const tokens = tokenize('<div class=${x}>y</div>');
    expect(tokens[0].type).toBe(TOKEN.OPEN_TAG);
    expect(tokens[0].tag).toBe("div");
  });
});
