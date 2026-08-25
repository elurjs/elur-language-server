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

  it("finds a raw() function-wrapped template", () => {
    const text = 'const t = raw(`<div>Hello</div>`);';
    const regions = findTemplateRegions(text);
    expect(regions.length).toBe(1);
    expect(regions[0].inner.trim()).toBe("<div>Hello</div>");
  });

  it("finds raw() with whitespace before backtick", () => {
    const text = 'const t = raw(\n  `<div>Hello</div>`\n);';
    const regions = findTemplateRegions(text);
    expect(regions.length).toBe(1);
    expect(regions[0].inner.trim()).toBe("<div>Hello</div>");
  });

  it("finds nested html inside raw()", () => {
    const text = 'const t = raw(`<div>${html`<span>inner</span>`}</div>`);';
    const regions = findTemplateRegions(text);
    expect(regions.length).toBe(2);
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

  it("returns true inside raw() template", () => {
    const text = 'const t = raw(`<div>Hello</div>`);';
    const offset = text.indexOf("Hello");
    expect(isInsideTaggedTemplate(text, offset)).toBe(true);
  });

  it("returns false outside raw() template", () => {
    const text = 'const t = raw(`<div>Hello</div>`);';
    const offset = text.indexOf("const");
    expect(isInsideTaggedTemplate(text, offset)).toBe(false);
  });
});
