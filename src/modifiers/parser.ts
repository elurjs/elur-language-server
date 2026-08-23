/**
 * parser.ts — Parse @event.modifier chains from text.
 *
 * Ported from nix-js-vscode/event-modifiers.js.
 */

export interface EventContext {
  mode: "event" | "modifier";
  tokenStart: number;
  eventPrefix?: string;
  eventName?: string;
  modifierPrefix?: string;
  usedModifiers?: string[];
  trailingDot?: boolean;
}

export interface ParsedEventChain {
  eventName: string;
  modifiers: string[];
}

/**
 * Parses the @event.modifier context from the line prefix before the cursor.
 * Returns null if no @ token is found.
 */
export function parseEventContextFromPrefix(linePrefix: string): EventContext | null {
  const tokenMatch = linePrefix.match(/@[a-zA-Z0-9.:-]*$/);
  if (!tokenMatch) return null;

  const token = tokenMatch[0];
  const tokenStart = linePrefix.length - token.length;

  if (token === "@") {
    return { mode: "event", tokenStart, eventPrefix: "" };
  }

  const withoutAt = token.slice(1);
  if (!withoutAt.includes(".")) {
    return { mode: "event", tokenStart, eventPrefix: withoutAt.toLowerCase() };
  }

  const parts = withoutAt.split(".");
  const eventName = (parts[0] || "").toLowerCase();
  const trailingDot = token.endsWith(".");
  const modifierPrefix = trailingDot
    ? ""
    : (parts[parts.length - 1] || "").toLowerCase();

  const usedModifiers = (trailingDot ? parts.slice(1) : parts.slice(1, -1))
    .map((mod) => mod.toLowerCase())
    .filter(Boolean);

  return {
    mode: "modifier",
    tokenStart,
    eventName,
    modifierPrefix,
    usedModifiers,
    trailingDot,
  };
}

/**
 * Parses a full @event.modifier chain string like "@click.prevent.stop".
 * Returns null if the input doesn't start with @.
 */
export function parseEventBindingChain(chainText: string): ParsedEventChain | null {
  const raw = (chainText || "").trim();
  if (!raw.startsWith("@")) return null;

  const noEq = raw.split("=")[0].trim();
  const body = noEq.slice(1);
  if (!body) return null;

  const parts = body.split(".").filter(Boolean);
  if (parts.length === 0) return null;

  const eventName = (parts[0] || "").toLowerCase();
  if (!eventName) return null;

  const modifiers = parts.slice(1).map((mod) => mod.toLowerCase());
  return { eventName, modifiers };
}

/**
 * Builds an @event.modifier chain string from parts.
 */
export function buildEventBindingChain(eventName: string, modifiers: string[]): string {
  const safeEvent = (eventName || "").toLowerCase();
  const safeModifiers = (modifiers || [])
    .map((mod) => (mod || "").toLowerCase())
    .filter(Boolean);

  const suffix = safeModifiers.map((mod) => `.${mod}`).join("");
  return `@${safeEvent}${suffix}`;
}
