/**
 * directives.ts — Directive attribute completion items (ref, show, hide).
 */

import { DIRECTIVE_ATTRIBUTES } from "../modifiers/constants.js";
import type { CompletionItem } from "vscode-languageserver/node";
import { CompletionItemKind } from "vscode-languageserver/node";

export function buildDirectiveCompletions(): CompletionItem[] {
  return DIRECTIVE_ATTRIBUTES.map((directive) => ({
    label: directive,
    kind: CompletionItemKind.Property,
    insertText: `${directive}=\${1}`,
    insertTextFormat: 2,
    detail: "Elur directive",
    documentation: `Elur directive attribute: ${directive}.`,
  }));
}
