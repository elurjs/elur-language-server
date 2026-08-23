import { describe, it, expect } from "vitest";
import { getModifierSuggestions, suggestClosestModifier, levenshtein } from "../src/modifiers/suggestions.js";

describe("getModifierSuggestions", () => {
  it("returns all event modifiers for non-key event", () => {
    const suggestions = getModifierSuggestions("click", [], "");
    expect(suggestions).toContain("prevent");
    expect(suggestions).toContain("stop");
    expect(suggestions).not.toContain("enter");
  });

  it("includes key modifiers for key event", () => {
    const suggestions = getModifierSuggestions("keydown", [], "");
    expect(suggestions).toContain("enter");
    expect(suggestions).toContain("prevent");
  });

  it("filters by prefix", () => {
    const suggestions = getModifierSuggestions("click", [], "pr");
    expect(suggestions).toEqual(["prevent"]);
  });

  it("excludes used modifiers", () => {
    const suggestions = getModifierSuggestions("click", ["prevent"], "");
    expect(suggestions).not.toContain("prevent");
  });
});

describe("suggestClosestModifier", () => {
  it("suggests prevent for prevnt", () => {
    expect(suggestClosestModifier("prevnt", "click")).toBe("prevent");
  });

  it("suggests stop for stap", () => {
    expect(suggestClosestModifier("stap", "click")).toBe("stop");
  });

  it("returns null for very different input", () => {
    expect(suggestClosestModifier("xyz", "click")).toBeNull();
  });
});

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("prevent", "prevent")).toBe(0);
  });

  it("returns 1 for single edit", () => {
    expect(levenshtein("prevent", "prevnt")).toBe(1);
  });
});
