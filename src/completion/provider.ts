/**
 * provider.ts — Completion provider for the LSP server.
 */

import type { Connection, TextDocuments } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { CompletionItem, CompletionList, Position } from "vscode-languageserver/node";
import { parseEventContextFromPrefix } from "../modifiers/parser.js";
import { isInsideTaggedTemplate } from "../template/detector.js";
import { getConfig } from "../utils/config.js";
import { buildEventCompletions } from "./events.js";
import { buildModifierCompletions } from "./modifiers.js";
import { buildDirectiveCompletions } from "./directives.js";

const SUPPORTED_LANGUAGES = new Set([
  "javascript", "typescript", "javascriptreact", "typescriptreact",
]);

export function registerCompletion(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onCompletion((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document || !SUPPORTED_LANGUAGES.has(document.languageId)) {
      return null;
    }

    const config = getConfig();

    if (!config.enableCompletions) return null;

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    if (!isInsideTaggedTemplate(text, offset, config.templateTags)) {
      return null;
    }

    const linePrefix = document.getText({
      start: Position.create(params.position.line, 0),
      end: params.position,
    });

    const eventContext = parseEventContextFromPrefix(linePrefix);

    if (eventContext?.mode === "modifier") {
      if (!config.enableModifierSuggestions) return null;
      const items = buildModifierCompletions(
        eventContext.eventName || "",
        eventContext.usedModifiers || [],
        eventContext.modifierPrefix || "",
      );
      return { items, isIncomplete: false } as CompletionList;
    }

    if (eventContext?.mode === "event") {
      const items = buildEventCompletions(eventContext.eventPrefix || "");
      return { items, isIncomplete: false } as CompletionList;
    }

    // Default: offer events + directives
    const items: CompletionItem[] = [
      ...buildEventCompletions(""),
      ...buildDirectiveCompletions(),
    ];
    return { items, isIncomplete: false } as CompletionList;
  });

  connection.onCompletionResolve((item) => item);
}
