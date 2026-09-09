/**
 * modifiers.ts — Modifier completion items.
 */

import { getModifierSuggestions } from "../modifiers/suggestions.js";
import { MODIFIER_HELP } from "../modifiers/constants.js";
import { isKeyEventName } from "../modifiers/analyzer.js";
import type { CompletionItem } from "vscode-languageserver/node";
import { CompletionItemKind } from "vscode-languageserver/node";

export function buildModifierCompletions(
  eventName: string,
  usedModifiers: string[],
  modifierPrefix: string,
): CompletionItem[] {
  const suggestions = getModifierSuggestions(eventName, usedModifiers, modifierPrefix);
  const isKey = isKeyEventName(eventName);

  return suggestions.map((modifier) => ({
    label: `.${modifier}`,
    kind: CompletionItemKind.EnumMember,
    insertText: modifier,
    detail: isKey ? "Elur key/event modifier" : "Elur event modifier",
    documentation: MODIFIER_HELP[modifier] || "Elur event modifier",
  }));
}
