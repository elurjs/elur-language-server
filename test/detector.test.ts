import { describe, it, expect } from "vitest";
import { findTemplateRegions, isInsideTaggedTemplate } from "../src/template/detector.js";

describe("findTemplateRegions", () => {
  it("finds a simple html template", () => {
    const text = 'const t = html`<div>Hello</div>`;';
    const regions = findTemplateRegions(text);
    expect(regions.length).toBe(1);
    expect(regions[0].inner.trim()).toBe("<div>Hello</div>");
  });

  it("finds nested templates", () => {
    const text = "const t = html`<div>${html`<span>inner</span>`}</div>`;";
    const regions = findTemplateRegions(text);
    expect(regions.length).toBe(2);
  });

  it("ignores html in strings", () => {
    const text = 'const s = "html`not a template`";';
    const regions = findTemplateRegions(text);
    expect(regions.length).toBe(0);
  });

  it("handles expressions with nested braces", () => {
    const text = "const t = html`<p>${() => { return x }}</p>`;";
    const regions = findTemplateRegions(text);
    expect(regions.length).toBe(1);
  });
});

describe("isInsideTaggedTemplate", () => {
  it("returns true inside html template", () => {
    const text = "const t = html`<div>Hello</div>`;";
    const offset = text.indexOf("Hello");
    expect(isInsideTaggedTemplate(text, offset)).toBe(true);
  });

  it("returns false outside html template", () => {
    const text = "const t = html`<div>Hello</div>`;";
    const offset = text.indexOf("const");
    expect(isInsideTaggedTemplate(text, offset)).toBe(false);
  });
});
