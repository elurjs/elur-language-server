/**
 * config.ts — Read settings from the LSP client.
 */

export interface NixJsLspConfig {
  enableDiagnostics: boolean;
  enableStyleHints: boolean;
  enableCompletions: boolean;
  enableModifierSuggestions: boolean;
  enableFormatting: boolean;
  formatOnSave: boolean;
  templateTags: string[];
}

export const DEFAULT_CONFIG: NixJsLspConfig = {
  enableDiagnostics: true,
  enableStyleHints: true,
  enableCompletions: true,
  enableModifierSuggestions: true,
  enableFormatting: true,
  formatOnSave: true,
  templateTags: ["html", "raw"],
};
