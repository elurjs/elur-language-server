/**
 * directives.ts — Directive attribute completion items (ref, show, hide).
 */

import { DIRECTIVE_ATTRIBUTES } from "../modifiers/constants.js";
import type { CompletionItem } from "vscode-languageserver/node.js";
import { CompletionItemKind } from "vscode-languageserver/node.js";

export function buildDirectiveCompletions(): CompletionItem[] {
  return DIRECTIVE_ATTRIBUTES.map((directive) => ({
    label: directive,
    kind: CompletionItemKind.Property,
    insertText: `${directive}=\${1}`,
    insertTextFormat: 2,
    detail: "Nix directive",
    documentation: `Nix directive attribute: ${directive}.`,
  }));
}
