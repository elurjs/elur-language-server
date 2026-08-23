import { describe, it, expect } from "vitest";
import { analyzeEventModifiers, isKeyEventName } from "../src/modifiers/analyzer.js";
import { normalizeModifierOrder, uniqueModifiers, removeModifier } from "../src/modifiers/normalizer.js";

describe("analyzeEventModifiers", () => {
  it("detects unknown modifier", () => {
    const issues = analyzeEventModifiers("click", ["foo"], false);
    expect(issues.some((i) => i.code === "unknown-modifier")).toBe(true);
  });

  it("detects duplicate modifier", () => {
    const issues = analyzeEventModifiers("click", ["prevent", "prevent"], false);
    expect(issues.some((i) => i.code === "duplicate-modifier")).toBe(true);
  });

  it("detects passive+prevent conflict", () => {
    const issues = analyzeEventModifiers("click", ["passive", "prevent"], false);
    expect(issues.some((i) => i.code === "passive-prevent-conflict")).toBe(true);
  });

  it("detects key modifier on non-key event", () => {
    const issues = analyzeEventModifiers("click", ["enter"], false);
    expect(issues.some((i) => i.code === "key-modifier-on-non-key-event")).toBe(true);
  });

  it("does NOT flag key modifier on key event", () => {
    const issues = analyzeEventModifiers("keydown", ["enter"], false);
    expect(issues.some((i) => i.code === "key-modifier-on-non-key-event")).toBe(false);
  });

  it("detects non-canonical order", () => {
    const issues = analyzeEventModifiers("click", ["stop", "prevent"], true);
    expect(issues.some((i) => i.code === "modifier-order-noncanonical")).toBe(true);
  });

  it("does NOT report order when style hints disabled", () => {
    const issues = analyzeEventModifiers("click", ["stop", "prevent"], false);
    expect(issues.some((i) => i.code === "modifier-order-noncanonical")).toBe(false);
  });

  it("returns no issues for valid modifiers", () => {
    const issues = analyzeEventModifiers("click", ["prevent", "stop"], false);
    expect(issues).toHaveLength(0);
  });
});

describe("isKeyEventName", () => {
  it("returns true for keydown", () => {
    expect(isKeyEventName("keydown")).toBe(true);
  });

  it("returns false for click", () => {
    expect(isKeyEventName("click")).toBe(false);
  });
});

describe("normalizeModifierOrder", () => {
  it("sorts event modifiers canonically", () => {
    expect(normalizeModifierOrder("click", ["stop", "prevent"])).toEqual(["prevent", "stop"]);
  });

  it("places key modifiers after event modifiers on key events", () => {
    expect(normalizeModifierOrder("keydown", ["enter", "prevent"])).toEqual(["prevent", "enter"]);
  });
});

describe("uniqueModifiers", () => {
  it("removes duplicates", () => {
    expect(uniqueModifiers(["prevent", "stop", "prevent"])).toEqual(["prevent", "stop"]);
  });
});

describe("removeModifier", () => {
  it("removes all occurrences", () => {
    expect(removeModifier(["prevent", "stop", "prevent"], "prevent")).toEqual(["stop"]);
  });
});
