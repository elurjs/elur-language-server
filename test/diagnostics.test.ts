import { describe, it, expect } from "vitest";
import { scanDiagnostics } from "../src/diagnostics/rules.js";

describe("scanDiagnostics", () => {
  it("returns no diagnostics for text without @", () => {
    expect(scanDiagnostics("const t = html`<div>Hello</div>`;", true)).toEqual([]);
  });

  it("detects unknown modifier", () => {
    const text = 'html`<button @click.foo="h">x</button>`';
    const diags = scanDiagnostics(text, true);
    expect(diags.some((d) => d.code === "unknown-modifier")).toBe(true);
  });

  it("detects duplicate modifier", () => {
    const text = 'html`<button @click.prevent.prevent="h">x</button>`';
    const diags = scanDiagnostics(text, true);
    expect(diags.some((d) => d.code === "duplicate-modifier")).toBe(true);
  });

  it("detects passive+prevent conflict", () => {
    const text = 'html`<button @click.passive.prevent="h">x</button>`';
    const diags = scanDiagnostics(text, true);
    expect(diags.some((d) => d.code === "passive-prevent-conflict")).toBe(true);
  });

  it("detects key modifier on non-key event", () => {
    const text = 'html`<button @click.enter="h">x</button>`';
    const diags = scanDiagnostics(text, true);
    expect(diags.some((d) => d.code === "key-modifier-on-non-key-event")).toBe(true);
  });

  it("detects non-canonical order", () => {
    const text = 'html`<button @click.stop.prevent="h">x</button>`';
    const diags = scanDiagnostics(text, true);
    expect(diags.some((d) => d.code === "modifier-order-noncanonical")).toBe(true);
  });

  it("skips style hints when disabled", () => {
    const text = 'html`<button @click.stop.prevent="h">x</button>`';
    const diags = scanDiagnostics(text, false);
    expect(diags.some((d) => d.code === "modifier-order-noncanonical")).toBe(false);
  });

  it("returns no diagnostics for valid modifiers", () => {
    const text = 'html`<button @click.prevent.stop="h">x</button>`';
    const diags = scanDiagnostics(text, true);
    expect(diags).toHaveLength(0);
  });
});
