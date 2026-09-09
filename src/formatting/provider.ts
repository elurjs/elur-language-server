/**
 * provider.ts — Formatting provider for the LSP server.
 *
 * Formats html`` tagged template regions in JS/TS documents.
 * Uses a tree-based formatter that produces JSX/Lit-style output.
 */

import type { Connection, TextDocuments } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver/node";
import { findTemplateRegions, type TemplateRegion } from "../template/detector.js";
import { getConfig } from "../utils/config.js";
import { formatTemplateInner } from "./printer.js";

function formatTemplateRegion(
  region: TemplateRegion,
  indentChar: string,
): string | null {
  const { inner, baseIndent } = region;
  if (inner.trim() === "") return null;

  const formatted = formatTemplateInner(inner, baseIndent, indentChar);
  if (formatted === inner) return null;
  return formatted;
}

export function registerFormatting(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onDocumentFormatting((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const config = getConfig();
    if (!config.enableFormatting) return null;

    const text = document.getText();
    const tabSize = params.options.tabSize ?? 2;
    const insertSpaces = params.options.insertSpaces ?? true;
    const indentChar = insertSpaces ? " ".repeat(tabSize) : "\t";

    const regions = findTemplateRegions(text, tabSize, config.templateTags);
    const edits: TextEdit[] = [];

    for (const region of regions) {
      const isContained = regions.some(
        (other) =>
          other !== region &&
          region.innerStart >= other.innerStart &&
          region.innerEnd <= other.innerEnd,
      );

      if (isContained) continue;

      const formatted = formatTemplateRegion(region, indentChar);
      if (formatted !== null) {
        edits.push({
          range: {
            start: document.positionAt(region.innerStart),
            end: document.positionAt(region.innerEnd),
          },
          newText: formatted,
        });
      }
    }

    return edits;
  });

  connection.onDocumentRangeFormatting((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const config = getConfig();
    if (!config.enableFormatting) return null;

    const text = document.getText();
    const tabSize = params.options.tabSize ?? 2;
    const insertSpaces = params.options.insertSpaces ?? true;
    const indentChar = insertSpaces ? " ".repeat(tabSize) : "\t";

    const rangeStart = document.offsetAt(params.range.start);
    const rangeEnd = document.offsetAt(params.range.end);

    const regions = findTemplateRegions(text, tabSize, config.templateTags);
    const edits: TextEdit[] = [];

    for (const region of regions) {
      if (region.innerEnd < rangeStart || region.innerStart > rangeEnd) continue;

      const isContained = regions.some(
        (other) =>
          other !== region &&
          region.innerStart >= other.innerStart &&
          region.innerEnd <= other.innerEnd,
      );
      if (isContained) continue;

      const formatted = formatTemplateRegion(region, indentChar);
      if (formatted !== null) {
        edits.push({
          range: {
            start: document.positionAt(region.innerStart),
            end: document.positionAt(region.innerEnd),
          },
          newText: formatted,
        });
      }
    }

    return edits;
  });
}
