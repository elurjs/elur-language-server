/**
 * events.ts — Event name completion items.
 */

import { EVENT_BINDINGS } from "../modifiers/constants.js";
import type { CompletionItem } from "vscode-languageserver/node.js";
import { CompletionItemKind } from "vscode-languageserver/node.js";

export function buildEventCompletions(prefix: string): CompletionItem[] {
  const p = (prefix || "").toLowerCase();
  return EVENT_BINDINGS
    .filter((eventName) => eventName.startsWith(p))
    .map((eventName) => ({
      label: `@${eventName}`,
      kind: CompletionItemKind.Event,
      insertText: `@${eventName}=\${1}`,
      insertTextFormat: 2,
      detail: "Nix event binding",
      documentation: `Bind ${eventName} inside html tagged templates.`,
    }));
}
