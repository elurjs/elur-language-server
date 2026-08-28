/**
 * normalizer.ts — Normalize modifier order.
 *
 * Ported from elur-vscode/event-modifiers.js.
 */

import { EVENT_MODIFIER_ORDER, KEY_MODIFIER_ORDER, EVENT_MODIFIERS, KEY_MODIFIERS } from "./constants.js";
import { isKeyEventName } from "./analyzer.js";

function modifierRank(modifier: string, isKeyEvent: boolean): number {
  if (modifier in EVENT_MODIFIER_ORDER) {
    return EVENT_MODIFIER_ORDER[modifier];
  }

  if (modifier in KEY_MODIFIER_ORDER) {
    const base = EVENT_MODIFIERS.length;
    return isKeyEvent
      ? base + KEY_MODIFIER_ORDER[modifier]
      : base + KEY_MODIFIERS.length;
  }

  return Number.POSITIVE_INFINITY;
}

/**
 * Sorts modifiers into canonical order: event modifiers first (in their
 * declared order), then key modifiers (in their declared order), then
 * unknown modifiers (stable — preserve original relative order).
 */
export function normalizeModifierOrder(eventName: string, modifiers: string[]): string[] {
  const lowerEvent = (eventName || "").toLowerCase();
  const isKey = isKeyEventName(lowerEvent);

  return (modifiers || [])
    .map((mod, index) => ({ value: (mod || "").toLowerCase(), index }))
    .filter((entry) => entry.value.length > 0)
    .sort((a, b) => {
      const rankA = modifierRank(a.value, isKey);
      const rankB = modifierRank(b.value, isKey);
      if (rankA !== rankB) return rankA - rankB;
      return a.index - b.index;
    })
    .map((entry) => entry.value);
}

/**
 * Deduplicates modifiers, preserving first occurrence order.
 */
export function uniqueModifiers(modifiers: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const mod of modifiers || []) {
    const value = (mod || "").toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/**
 * Removes all occurrences of a modifier from the list.
 */
export function removeModifier(modifiers: string[], modifierToRemove: string): string[] {
  const target = (modifierToRemove || "").toLowerCase();
  return (modifiers || []).filter((mod) => (mod || "").toLowerCase() !== target);
}
