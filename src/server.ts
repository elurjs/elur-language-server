/**
 * server.ts — LSP server entry point.
 *
 * Wires up all providers: completion, diagnostics, hover, code actions, formatting.
 * Reads client configuration on init and on every `workspace/didChangeConfiguration`
 * notification, then re-validates all open documents.
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  type InitializeParams,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getCapabilities } from "./capabilities.js";
import { refreshConfig } from "./utils/config.js";
import { registerCompletion } from "./completion/provider.js";
import { registerDiagnostics } from "./diagnostics/provider.js";
import { registerHover } from "./hover/provider.js";
import { registerCodeActions } from "./codeActions/provider.js";
import { registerFormatting } from "./formatting/provider.js";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize((_params: InitializeParams) => {
  return getCapabilities();
});

let revalidateAll: (() => void) | null = null;

connection.onInitialized(async () => {
  await refreshConfig(connection);

  registerCompletion(connection, documents);
  revalidateAll = registerDiagnostics(connection, documents);
  registerHover(connection, documents);
  registerCodeActions(connection, documents);
  registerFormatting(connection, documents);
});

connection.onDidChangeConfiguration(async () => {
  await refreshConfig(connection);
  revalidateAll?.();
});

documents.listen(connection);
connection.listen();

export { connection as startServer };
