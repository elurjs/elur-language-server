import { describe, it, expect } from "vitest";
import {
  parseEventContextFromPrefix,
  parseEventBindingChain,
  buildEventBindingChain,
} from "../src/modifiers/parser.js";

describe("parseEventContextFromPrefix", () => {
  it("returns null when no @ token", () => {
    expect(parseEventContextFromPrefix("<div>")).toBeNull();
  });

  it("detects event mode at bare @", () => {
    const ctx = parseEventContextFromPrefix("<button @");
    expect(ctx?.mode).toBe("event");
    expect(ctx?.eventPrefix).toBe("");
  });

  it("detects event mode with prefix", () => {
    const ctx = parseEventContextFromPrefix("<button @cli");
    expect(ctx?.mode).toBe("event");
    expect(ctx?.eventPrefix).toBe("cli");
  });

  it("detects modifier mode", () => {
    const ctx = parseEventContextFromPrefix("<button @click.pre");
    expect(ctx?.mode).toBe("modifier");
    expect(ctx?.eventName).toBe("click");
    expect(ctx?.modifierPrefix).toBe("pre");
  });

  it("detects modifier mode with trailing dot", () => {
    const ctx = parseEventContextFromPrefix("<button @click.");
    expect(ctx?.mode).toBe("modifier");
    expect(ctx?.eventName).toBe("click");
    expect(ctx?.modifierPrefix).toBe("");
    expect(ctx?.trailingDot).toBe(true);
  });
});

describe("parseEventBindingChain", () => {
  it("parses @click.prevent.stop", () => {
    const result = parseEventBindingChain("@click.prevent.stop");
    expect(result?.eventName).toBe("click");
    expect(result?.modifiers).toEqual(["prevent", "stop"]);
  });

  it("parses @keydown.enter with trailing =", () => {
    const result = parseEventBindingChain("@keydown.enter=");
    expect(result?.eventName).toBe("keydown");
    expect(result?.modifiers).toEqual(["enter"]);
  });

  it("returns null for non-@ input", () => {
    expect(parseEventBindingChain("click")).toBeNull();
  });
});

describe("buildEventBindingChain", () => {
  it("builds chain from parts", () => {
    expect(buildEventBindingChain("click", ["prevent", "stop"])).toBe("@click.prevent.stop");
  });

  it("builds chain without modifiers", () => {
    expect(buildEventBindingChain("click", [])).toBe("@click");
  });
});
