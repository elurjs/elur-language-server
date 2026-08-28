/**
 * suggestions.ts — Modifier completion suggestions and fuzzy matching.
 *
 * Ported from elur-vscode/event-modifiers.js.
 */

import { EVENT_MODIFIERS, KEY_MODIFIERS } from "./constants.js";
import { isKeyEventName } from "./analyzer.js";

/**
 * Returns the set of valid modifiers for the given event, filtered by
 * prefix and excluding already-used modifiers.
 */
export function getModifierSuggestions(
  eventName: string,
  usedModifiers: string[],
  modifierPrefix: string,
): string[] {
  const used = new Set((usedModifiers || []).map((mod) => mod.toLowerCase()));
  const prefix = (modifierPrefix || "").toLowerCase();

  const candidates = isKeyEventName(eventName)
    ? [...EVENT_MODIFIERS, ...KEY_MODIFIERS]
    : [...EVENT_MODIFIERS];

  return candidates
    .filter((mod) => !used.has(mod))
    .filter((mod) => mod.startsWith(prefix));
}

/**
 * Levenshtein edit distance between two strings (case-insensitive).
 */
export function levenshtein(a: string, b: string): number {
  const x = (a || "").toLowerCase();
  const y = (b || "").toLowerCase();

  const dp = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0));
  for (let i = 0; i <= x.length; i++) dp[i][0] = i;
  for (let j = 0; j <= y.length; j++) dp[0][j] = j;

  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[x.length][y.length];
}

/**
 * Suggests the closest known modifier to an unknown one.
 * Returns null if no close match (distance > 2).
 */
export function suggestClosestModifier(unknownModifier: string, eventName: string): string | null {
  const source = isKeyEventName(eventName)
    ? [...EVENT_MODIFIERS, ...KEY_MODIFIERS]
    : [...EVENT_MODIFIERS];

  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of source) {
    const distance = levenshtein(unknownModifier, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return bestDistance <= 2 ? best : null;
}
