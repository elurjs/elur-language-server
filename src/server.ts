/**
 * server.ts — LSP server entry point.
 *
 * Wires up all providers: completion, diagnostics, hover, code actions, formatting.
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  type InitializeParams,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getCapabilities } from "./capabilities.js";
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

connection.onInitialized(() => {
  registerCompletion(connection, documents);
  registerDiagnostics(connection, documents);
  registerHover(connection, documents);
  registerCodeActions(connection, documents);
  registerFormatting(connection, documents);
});

documents.listen(connection);
connection.listen();

export { connection as startServer };
