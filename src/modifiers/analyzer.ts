/**
 * analyzer.ts — Analyze event modifiers for issues.
 *
 * Ported from elur-vscode/event-modifiers.js analyzeEventModifiers().
 */

import { KEY_MODIFIERS, KEY_EVENTS, KNOWN_MODIFIERS } from "./constants.js";
import { normalizeModifierOrder } from "./normalizer.js";

export type ModifierIssueType =
  | "unknown-modifier"
  | "duplicate-modifier"
  | "passive-prevent-conflict"
  | "key-modifier-on-non-key-event"
  | "modifier-order-noncanonical";

export interface ModifierIssue {
  code: ModifierIssueType;
  severity: "warning" | "information";
  modifier: string;
  message: string;
}

export function isKeyEventName(eventName: string): boolean {
  return (KEY_EVENTS as readonly string[]).includes((eventName || "").toLowerCase());
}

/**
 * Analyzes a list of modifiers on an event and returns all issues found.
 */
export function analyzeEventModifiers(
  eventName: string,
  modifiers: string[],
  enableStyleHints = true,
): ModifierIssue[] {
  const lowerEvent = (eventName || "").toLowerCase();
  const mods = (modifiers || []).map((mod) => mod.toLowerCase());
  const issues: ModifierIssue[] = [];

  const seen = new Set<string>();
  for (const mod of mods) {
    if (!KNOWN_MODIFIERS.has(mod)) {
      issues.push({
        code: "unknown-modifier",
        severity: "warning",
        modifier: mod,
        message: `Unknown modifier .${mod}`,
      });
      continue;
    }

    if (seen.has(mod)) {
      issues.push({
        code: "duplicate-modifier",
        severity: "warning",
        modifier: mod,
        message: `Duplicate modifier .${mod}`,
      });
    }
    seen.add(mod);
  }

  // passive + prevent conflict
  if (seen.has("passive") && seen.has("prevent")) {
    issues.push({
      code: "passive-prevent-conflict",
      severity: "warning",
      modifier: "passive",
      message: "Avoid combining .passive with .prevent",
    });
  }

  // Key modifier on non-key event
  if (!isKeyEventName(lowerEvent)) {
    for (const keyMod of KEY_MODIFIERS) {
      if (seen.has(keyMod)) {
        issues.push({
          code: "key-modifier-on-non-key-event",
          severity: "information",
          modifier: keyMod,
          message: `Modifier .${keyMod} is typically used with keydown/keyup`,
        });
      }
    }
  }

  // Non-canonical order (style hint)
  if (enableStyleHints) {
    const normalized = normalizeModifierOrder(lowerEvent, mods);
    if (normalized.join(".") !== mods.join(".")) {
      issues.push({
        code: "modifier-order-noncanonical",
        severity: "information",
        modifier: mods.join("."),
        message: `Consider normalizing modifier order: .${normalized.join(".")}`,
      });
    }
  }

  return issues;
}
