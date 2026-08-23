/**
 * config.ts — Read settings from the LSP client.
 */

import type { Connection } from "vscode-languageserver/node.js";

export interface NixLspConfig {
  enableDiagnostics: boolean;
  enableStyleHints: boolean;
  enableCompletions: boolean;
  enableModifierSuggestions: boolean;
  enableFormatting: boolean;
  formatOnSave: boolean;
  templateTags: string[];
}

const DEFAULT_CONFIG: NixLspConfig = {
  enableDiagnostics: true,
  enableStyleHints: true,
  enableCompletions: true,
  enableModifierSuggestions: true,
  enableFormatting: true,
  formatOnSave: true,
  templateTags: ["html"],
};

export function readConfig(connection: Connection): NixLspConfig {
  try {
    const raw = connection.workspace
      ? null // getConfiguration is async; handled in onInitialized
      : null;
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export { DEFAULT_CONFIG };
