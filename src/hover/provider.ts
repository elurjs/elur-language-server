/**
 * provider.ts — Hover provider for modifier help.
 */

import type { Connection, TextDocuments } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { Hover, MarkupKind } from "vscode-languageserver/node";
import { MODIFIER_HELP } from "../modifiers/constants.js";
import { isInsideTaggedTemplate } from "../template/detector.js";
import { getConfig } from "../utils/config.js";

const SUPPORTED_LANGUAGES = new Set([
  "javascript", "typescript", "javascriptreact", "typescriptreact",
]);

export function registerHover(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document || !SUPPORTED_LANGUAGES.has(document.languageId)) {
      return null;
    }

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    if (!isInsideTaggedTemplate(text, offset, getConfig().templateTags)) {
      return null;
    }

    const line = document.getText({
      start: { line: params.position.line, character: 0 },
      end: { line: params.position.line, character: Number.MAX_SAFE_INTEGER },
    });

    const wordRangeMatch = line.slice(0, params.position.character).match(/[a-zA-Z][a-zA-Z0-9-]*$/);
    if (!wordRangeMatch) return null;

    const startChar = params.position.character - wordRangeMatch[0].length;
    const prevChar = startChar > 0 ? line[startChar - 1] : "";
    if (prevChar !== ".") return null;

    const modifier = wordRangeMatch[0].toLowerCase();
    const help = MODIFIER_HELP[modifier];
    if (!help) return null;

    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `**.${modifier}**\n\n${help}`,
      },
      range: {
        start: { line: params.position.line, character: startChar },
        end: { line: params.position.line, character: params.position.character },
      },
    } as Hover;
  });
}
