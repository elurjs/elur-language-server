/**
 * capabilities.ts — LSP capability declarations.
 */

import type { InitializeResult } from "vscode-languageserver/node.js";
import { TextDocumentSyncKind } from "vscode-languageserver/node.js";

export function getCapabilities(): InitializeResult {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: ["@", ".", "="],
        resolveProvider: true,
      },
      hoverProvider: true,
      codeActionProvider: {
        codeActionKinds: ["quickfix"],
      },
      documentFormattingProvider: true,
      documentRangeFormattingProvider: true,
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
    },
  };
}
