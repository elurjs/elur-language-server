/**
 * fixes.ts — Generate quick fixes for modifier issues.
 *
 * Ported from elur-vscode/event-modifiers.js createModifierQuickFixes().
 */

import { analyzeEventModifiers, isKeyEventName } from "../modifiers/analyzer.js";
import { uniqueModifiers, removeModifier, normalizeModifierOrder } from "../modifiers/normalizer.js";
import { suggestClosestModifier } from "../modifiers/suggestions.js";
import { buildEventBindingChain } from "../modifiers/parser.js";
import { KEY_MODIFIERS } from "../modifiers/constants.js";

interface RawFix {
  id: string;
  title: string;
  modifiers: string[];
}

export interface QuickFix extends RawFix {
  chain: string;
}

export function createModifierQuickFixes(
  eventName: string,
  modifiers: string[],
): QuickFix[] {
  const fixes: RawFix[] = [];
  const issues = analyzeEventModifiers(eventName, modifiers);

  // Dedupe
  const deduped = uniqueModifiers(modifiers);
  if (deduped.length !== modifiers.length) {
    fixes.push({
      id: "remove-duplicate-modifiers",
      title: "Remove duplicate modifiers",
      modifiers: deduped,
    });
  }

  // Normalize order
  const normalizedOrder = normalizeModifierOrder(eventName, modifiers);
  if (normalizedOrder.join(".") !== (modifiers || []).join(".")) {
    fixes.push({
      id: "normalize-modifier-order",
      title: "Normalize modifier order",
      modifiers: normalizedOrder,
    });
  }

  // passive + prevent conflict
  const hasPassive = modifiers.includes("passive");
  const hasPrevent = modifiers.includes("prevent");
  if (hasPassive && hasPrevent) {
    fixes.push({
      id: "drop-prevent",
      title: "Remove .prevent (keep .passive)",
      modifiers: removeModifier(modifiers, "prevent"),
    });
    fixes.push({
      id: "drop-passive",
      title: "Remove .passive (keep .prevent)",
      modifiers: removeModifier(modifiers, "passive"),
    });
  }

  // Unknown modifiers
  const seenUnknown = new Set<string>();
  for (const issue of issues) {
    if (issue.code !== "unknown-modifier") continue;

    const unknown = issue.message.replace("Unknown modifier .", "").trim().toLowerCase();
    if (!unknown || seenUnknown.has(unknown)) continue;
    seenUnknown.add(unknown);

    const suggestion = suggestClosestModifier(unknown, eventName);
    if (!suggestion) {
      fixes.push({
        id: `remove-unknown-${unknown}`,
        title: `Remove unknown modifier .${unknown}`,
        modifiers: removeModifier(modifiers, unknown),
      });
      continue;
    }

    fixes.push({
      id: `replace-${unknown}-with-${suggestion}`,
      title: `Replace .${unknown} with .${suggestion}`,
      modifiers: modifiers.map((mod) => (mod === unknown ? suggestion : mod)),
    });
  }

  // Key modifiers on non-key event
  if (!isKeyEventName(eventName)) {
    const keyMods = modifiers.filter((mod) => (KEY_MODIFIERS as readonly string[]).includes(mod));
    if (keyMods.length > 0) {
      fixes.push({
        id: "remove-key-modifiers",
        title: "Remove key-only modifiers",
        modifiers: modifiers.filter((mod) => !(KEY_MODIFIERS as readonly string[]).includes(mod)),
      });
    }
  }

  // Deduplicate by chain
  const uniqueFixes: QuickFix[] = [];
  const seenChains = new Set<string>();
  for (const fix of fixes) {
    const chain = buildEventBindingChain(eventName, fix.modifiers);
    if (seenChains.has(chain)) continue;
    seenChains.add(chain);
    uniqueFixes.push({ ...fix, chain });
  }

  return uniqueFixes;
}
