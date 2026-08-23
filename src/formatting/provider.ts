/**
 * provider.ts — Formatting provider for the LSP server.
 *
 * Formats html`` tagged template regions in JS/TS documents.
 * Ported from nix-js-vscode/formatter.js provideFormattingEdits().
 */

import type { Connection, TextDocuments } from "vscode-languageserver/node.js";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver/node.js";
import { findTemplateRegions, type TemplateRegion } from "../template/detector.js";
import { tokenize, TOKEN, INLINE_ELEMENTS, type Token } from "./tokenizer.js";
import { renderTokens } from "./renderer.js";

const MAX_LINE_WIDTH = 80;

function isSingleLineCandidate(tokens: Token[]): boolean {
  for (const t of tokens) {
    if (t.type === TOKEN.OPEN_TAG && !INLINE_ELEMENTS.has(t.tag || "")) return false;
    if (t.type === TOKEN.CLOSE_TAG && !INLINE_ELEMENTS.has(t.tag || "")) return false;
    if (t.type === TOKEN.COMMENT) return false;
    if (t.type === TOKEN.DOCTYPE) return false;
  }
  return true;
}

function formatTemplateRegion(
  region: TemplateRegion,
  indentChar: string,
  tabSize: number,
): string | null {
  const { inner, baseIndent } = region;
  if (inner.trim() === "") return null;

  const contentIndent = baseIndent + 1;
  const tokens = tokenize(inner);

  if (isSingleLineCandidate(tokens)) {
    const flat = tokens.map((t) => collapseWhitespace(t.raw)).join("").trim();
    if (!flat.includes("\n") && flat.length <= MAX_LINE_WIDTH) {
      return `\n${indentChar.repeat(contentIndent)}${flat}\n${indentChar.repeat(baseIndent)}`;
    }
  }

  const lines = renderTokens(tokens, contentIndent, indentChar);
  if (lines.length === 0) return null;

  const body = lines.join("\n");
  return `\n${body}\n${indentChar.repeat(baseIndent)}`;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ");
}

export function registerFormatting(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onDocumentFormatting((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const text = document.getText();
    const tabSize = params.options.tabSize ?? 2;
    const insertSpaces = params.options.insertSpaces ?? true;
    const indentChar = insertSpaces ? " ".repeat(tabSize) : "\t";

    const regions = findTemplateRegions(text, tabSize);
    const edits: TextEdit[] = [];

    for (const region of regions) {
      const isContained = regions.some(
        (other) =>
          other !== region &&
          region.innerStart >= other.innerStart &&
          region.innerEnd <= other.innerEnd,
      );

      if (isContained) continue;

      const formatted = formatTemplateRegion(region, indentChar, tabSize);
      if (formatted !== null && formatted !== region.inner) {
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
    // Range formatting: only format regions that overlap the range
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const text = document.getText();
    const tabSize = params.options.tabSize ?? 2;
    const insertSpaces = params.options.insertSpaces ?? true;
    const indentChar = insertSpaces ? " ".repeat(tabSize) : "\t";

    const rangeStart = document.offsetAt(params.range.start);
    const rangeEnd = document.offsetAt(params.range.end);

    const regions = findTemplateRegions(text, tabSize);
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

      const formatted = formatTemplateRegion(region, indentChar, tabSize);
      if (formatted !== null && formatted !== region.inner) {
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
