/**
 * provider.ts — Code actions provider for the LSP server.
 */

import type { Connection, TextDocuments } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { CodeAction, CodeActionKind, WorkspaceEdit } from "vscode-languageserver/node";
import { parseEventBindingChain } from "../modifiers/parser.js";
import { createModifierQuickFixes } from "./fixes.js";

export function registerCodeActions(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onCodeAction((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const actions: CodeAction[] = [];

    for (const diagnostic of params.context.diagnostics) {
      if (diagnostic.source !== "elur") continue;

      const chainText = document.getText(diagnostic.range);
      const parsed = parseEventBindingChain(chainText);
      if (!parsed) continue;

      const fixes = createModifierQuickFixes(parsed.eventName, parsed.modifiers);

      for (const fix of fixes) {
        const action: CodeAction = {
          title: fix.title,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
          edit: {
            changes: {
              [document.uri]: [
                {
                  range: diagnostic.range,
                  newText: fix.chain,
                },
              ],
            },
          } as WorkspaceEdit,
          isPreferred:
            fix.id === "remove-duplicate-modifiers" ||
            fix.id === "drop-prevent" ||
            fix.id === "normalize-modifier-order",
        };
        actions.push(action);
      }
    }

    return actions;
  });
}
