/**
 * provider.ts — Diagnostics provider for the LSP server.
 */

import type { Connection, TextDocuments } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver/node";
import { scanDiagnostics, type TextDiagnostic } from "./rules.js";
import { getConfig } from "../utils/config.js";

const SUPPORTED_LANGUAGES = new Set([
  "javascript", "typescript", "javascriptreact", "typescriptreact",
]);

export function registerDiagnostics(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): () => void {
  function validate(document: TextDocument): void {
    if (!SUPPORTED_LANGUAGES.has(document.languageId)) return;
    const scheme = document.uri.startsWith("file:") ? "file"
      : document.uri.startsWith("untitled:") ? "untitled"
        : "other";
    if (scheme !== "file" && scheme !== "untitled") return;

    const config = getConfig();

    if (!config.enableDiagnostics) {
      connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
      return;
    }

    const text = document.getText();
    if (!text.includes("@")) {
      connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
      return;
    }

    const rawDiags = scanDiagnostics(text, config.enableStyleHints);

    const diagnostics: Diagnostic[] = rawDiags.map((d: TextDiagnostic) => {
      const severity = d.severity === "information"
        ? DiagnosticSeverity.Information
        : DiagnosticSeverity.Warning;

      return {
        severity,
        code: d.code,
        message: d.message,
        source: "elur",
        range: {
          start: document.positionAt(d.range.start),
          end: document.positionAt(d.range.end),
        },
        data: d.data,
      };
    });

    connection.sendDiagnostics({ uri: document.uri, diagnostics });
  }

  documents.onDidOpen((e) => validate(e.document));
  documents.onDidChangeContent((e) => validate(e.document));
  documents.onDidClose((e) => {
    connection.sendDiagnostics({ uri: e.document.uri, diagnostics: [] });
  });

  // Return a revalidation function for the server to call when
  // configuration changes (e.g. enableDiagnostics toggled).
  return () => {
    documents.all().forEach(validate);
  };
}
