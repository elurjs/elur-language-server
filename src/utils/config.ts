/**
 * config.ts — Read settings from the LSP client.
 */

export interface ElurLspConfig {
  enableDiagnostics: boolean;
  enableStyleHints: boolean;
  enableCompletions: boolean;
  enableModifierSuggestions: boolean;
  enableFormatting: boolean;
  formatOnSave: boolean;
  templateTags: string[];
}

export const DEFAULT_CONFIG: ElurLspConfig = {
  enableDiagnostics: true,
  enableStyleHints: true,
  enableCompletions: true,
  enableModifierSuggestions: true,
  enableFormatting: true,
  formatOnSave: true,
  templateTags: ["html", "raw"],
};
