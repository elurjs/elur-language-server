/**
 * config.ts — Read settings from the LSP client.
 *
 * The VS Code extension declares settings under the "elur" namespace
 * (see elur-vscode/package.json `contributes.configuration`). The client
 * syncs them via `configurationSection: "elur"`.
 *
 * On init and on every `workspace/didChangeConfiguration` notification the
 * server calls `refreshConfig(connection)` to update the module-level
 * config. Providers read it via `getConfig()`.
 */

import type { Connection } from "vscode-languageserver/node";

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

/** Raw shape returned by `connection.workspace.getConfiguration("elur")`. */
interface RawElurConfig {
  tags?: string[];
  completions?: {
    enableEventBindings?: boolean;
    enableModifierSuggestions?: boolean;
  };
  diagnostics?: {
    enable?: boolean;
    enableStyleHints?: boolean;
  };
  format?: {
    enable?: boolean;
    formatOnSave?: boolean;
  };
}

let currentConfig: ElurLspConfig = DEFAULT_CONFIG;

/** Returns the current config (updated by `refreshConfig`). */
export function getConfig(): ElurLspConfig {
  return currentConfig;
}

/** Reads the "elur" configuration section from the LSP client. */
export async function readConfig(connection: Connection): Promise<ElurLspConfig> {
  try {
    const raw = (await connection.workspace.getConfiguration("elur")) as RawElurConfig | null;
    if (!raw) return DEFAULT_CONFIG;

    return {
      enableDiagnostics: raw.diagnostics?.enable ?? DEFAULT_CONFIG.enableDiagnostics,
      enableStyleHints: raw.diagnostics?.enableStyleHints ?? DEFAULT_CONFIG.enableStyleHints,
      enableCompletions: raw.completions?.enableEventBindings ?? DEFAULT_CONFIG.enableCompletions,
      enableModifierSuggestions: raw.completions?.enableModifierSuggestions ?? DEFAULT_CONFIG.enableModifierSuggestions,
      enableFormatting: raw.format?.enable ?? DEFAULT_CONFIG.enableFormatting,
      formatOnSave: raw.format?.formatOnSave ?? DEFAULT_CONFIG.formatOnSave,
      templateTags: raw.tags ?? DEFAULT_CONFIG.templateTags,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Reads config from the client and updates the module-level state. */
export async function refreshConfig(connection: Connection): Promise<ElurLspConfig> {
  currentConfig = await readConfig(connection);
  return currentConfig;
}
