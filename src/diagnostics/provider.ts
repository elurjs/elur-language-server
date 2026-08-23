/**
 * provider.ts — Diagnostics provider for the LSP server.
 */

import type { Connection, TextDocuments } from "vscode-languageserver/node.js";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver/node.js";
import { scanDiagnostics, type TextDiagnostic } from "./rules.js";
import { isInsideTaggedTemplate } from "../template/detector.js";

const SUPPORTED_LANGUAGES = new Set([
  "javascript", "typescript", "javascriptreact", "typescriptreact",
]);

export function registerDiagnostics(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  function validate(document: TextDocument): void {
    if (!SUPPORTED_LANGUAGES.has(document.languageId)) return;
    const scheme = document.uri.startsWith("file:") ? "file"
      : document.uri.startsWith("untitled:") ? "untitled"
        : "other";
    if (scheme !== "file" && scheme !== "untitled") return;

    const text = document.getText();
    if (!text.includes("@")) {
      connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
      return;
    }

    const enableStyleHints = true; // TODO: read from client config
    const rawDiags = scanDiagnostics(text, enableStyleHints);

    const diagnostics: Diagnostic[] = rawDiags.map((d: TextDiagnostic) => {
      const severity = d.severity === "information"
        ? DiagnosticSeverity.Information
        : DiagnosticSeverity.Warning;

      return {
        severity,
        code: d.code,
        message: d.message,
        source: "nixjs",
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
}
