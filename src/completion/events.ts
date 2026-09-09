/**
 * events.ts — Event name completion items.
 */

import { EVENT_BINDINGS } from "../modifiers/constants.js";
import type { CompletionItem } from "vscode-languageserver/node";
import { CompletionItemKind } from "vscode-languageserver/node";

export function buildEventCompletions(prefix: string): CompletionItem[] {
  const p = (prefix || "").toLowerCase();
  return EVENT_BINDINGS
    .filter((eventName) => eventName.startsWith(p))
    .map((eventName) => ({
      label: `@${eventName}`,
      kind: CompletionItemKind.Event,
      filterText: `@${eventName}`,
      insertText: `@${eventName}=\${1}`,
      insertTextFormat: 2,
      detail: "Elur event binding",
      documentation: `Bind ${eventName} inside html tagged templates.`,
    }));
}
