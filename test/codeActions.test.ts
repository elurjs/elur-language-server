import { describe, it, expect } from "vitest";
import { createModifierQuickFixes } from "../src/codeActions/fixes.js";

describe("createModifierQuickFixes", () => {
  it("creates dedupe fix for duplicates", () => {
    const fixes = createModifierQuickFixes("click", ["prevent", "prevent"]);
    expect(fixes.some((f) => f.id === "remove-duplicate-modifiers")).toBe(true);
  });

  it("creates normalize fix for bad order", () => {
    const fixes = createModifierQuickFixes("click", ["stop", "prevent"]);
    expect(fixes.some((f) => f.id === "normalize-modifier-order")).toBe(true);
  });

  it("creates drop-prevent and drop-passive fixes", () => {
    const fixes = createModifierQuickFixes("click", ["passive", "prevent"]);
    expect(fixes.some((f) => f.id === "drop-prevent")).toBe(true);
    expect(fixes.some((f) => f.id === "drop-passive")).toBe(true);
  });

  it("creates replace fix for close unknown modifier", () => {
    const fixes = createModifierQuickFixes("click", ["prevnt"]);
    expect(fixes.some((f) => f.id === "replace-prevnt-with-prevent")).toBe(true);
  });

  it("creates remove fix for very different unknown modifier", () => {
    const fixes = createModifierQuickFixes("click", ["xyz"]);
    expect(fixes.some((f) => f.id === "remove-unknown-xyz")).toBe(true);
  });

  it("creates remove-key-modifiers fix for key mods on non-key event", () => {
    const fixes = createModifierQuickFixes("click", ["enter"]);
    expect(fixes.some((f) => f.id === "remove-key-modifiers")).toBe(true);
  });

  it("generates correct chain strings", () => {
    const fixes = createModifierQuickFixes("click", ["prevent", "prevent"]);
    const dedupe = fixes.find((f) => f.id === "remove-duplicate-modifiers");
    expect(dedupe?.chain).toBe("@click.prevent");
  });
});
