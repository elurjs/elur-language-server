/**
 * scope.ts — Template scope analysis utilities.
 *
 * Helpers for determining what kind of construct the cursor is in.
 */

import { isInsideTaggedTemplate } from "./detector.js";

export type CursorContext =
  | "event-name"
  | "modifier"
  | "attribute-name"
  | "attribute-value"
  | "text"
  | "outside-template";

export interface ScopeInfo {
  context: CursorContext;
  /** The @event.modifier prefix before the cursor, if applicable. */
  eventPrefix?: string;
  /** The modifier prefix before the cursor, if applicable. */
  modifierPrefix?: string;
}

/**
 * Determines the cursor context within a html`` template.
 */
export function getCursorContext(
  documentText: string,
  cursorOffset: number,
  allowedTags: readonly string[] = ["html"],
): ScopeInfo {
  if (!isInsideTaggedTemplate(documentText, cursorOffset, allowedTags)) {
    return { context: "outside-template" };
  }

  // Get the line prefix up to the cursor
  const before = documentText.slice(0, cursorOffset);
  const lastNewline = before.lastIndexOf("\n");
  const linePrefix = lastNewline >= 0 ? before.slice(lastNewline + 1) : before;

  // Check for @event.modifier context
  const tokenMatch = linePrefix.match(/@[a-zA-Z0-9.:-]*$/);
  if (tokenMatch) {
    const token = tokenMatch[0];
    if (token === "@") {
      return { context: "event-name", eventPrefix: "" };
    }
    const withoutAt = token.slice(1);
    if (!withoutAt.includes(".")) {
      return { context: "event-name", eventPrefix: withoutAt.toLowerCase() };
    }
    const parts = withoutAt.split(".");
    const eventName = (parts[0] || "").toLowerCase();
    const trailingDot = token.endsWith(".");
    const modifierPrefix = trailingDot
      ? ""
      : (parts[parts.length - 1] || "").toLowerCase();
    return { context: "modifier", eventPrefix: eventName, modifierPrefix };
  }

  // Check for attribute name context
  const attrMatch = linePrefix.match(/[@a-zA-Z][a-zA-Z0-9.:-]*$/);
  if (attrMatch) {
    return { context: "attribute-name" };
  }

  return { context: "text" };
}
