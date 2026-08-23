/**
 * modifiers.ts — Modifier completion items.
 */

import { getModifierSuggestions } from "../modifiers/suggestions.js";
import { MODIFIER_HELP } from "../modifiers/constants.js";
import { isKeyEventName } from "../modifiers/analyzer.js";
import type { CompletionItem } from "vscode-languageserver/node.js";
import { CompletionItemKind } from "vscode-languageserver/node.js";

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
    detail: isKey ? "Nix key/event modifier" : "Nix event modifier",
    documentation: MODIFIER_HELP[modifier] || "Nix event modifier",
  }));
}
