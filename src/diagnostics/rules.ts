/**
 * rules.ts — Diagnostic rules for event modifiers.
 *
 * Ported from nix-js-vscode/extension.js validateDocument().
 */

import { analyzeEventModifiers } from "../modifiers/analyzer.js";

export interface DiagnosticData {
  code: string;
  eventName: string;
  modifiers: string[];
  range: { start: number; end: number };
}

export interface TextDiagnostic {
  code: string;
  severity: "warning" | "information";
  message: string;
  range: { start: number; end: number };
  data: DiagnosticData;
}

const EVENT_CHAIN_RE = /@([a-zA-Z][a-zA-Z0-9:-]*)((?:\.[a-zA-Z0-9-]+)*)\s*=/g;

/**
 * Scans text for @event.modifier chains and returns diagnostics for all issues.
 */
export function scanDiagnostics(
  text: string,
  enableStyleHints: boolean,
): TextDiagnostic[] {
  if (!text.includes("@")) return [];

  const diagnostics: TextDiagnostic[] = [];
  let match: RegExpExecArray | null;

  while ((match = EVENT_CHAIN_RE.exec(text)) !== null) {
    const eventName = (match[1] || "").toLowerCase();
    const modifiers = (match[2] || "")
      .split(".")
      .map((mod) => mod.toLowerCase())
      .filter(Boolean);

    let issues = analyzeEventModifiers(eventName, modifiers, enableStyleHints);
    if (!enableStyleHints) {
      issues = issues.filter((issue) => issue.code !== "modifier-order-noncanonical");
    }

    if (issues.length === 0) continue;

    const eqIndex = match[0].indexOf("=");
    const highlightLength = eqIndex >= 0 ? eqIndex : match[0].length;
    const start = match.index;
    const end = match.index + highlightLength;

    for (const issue of issues) {
      diagnostics.push({
        code: issue.code,
        severity: issue.severity,
        message: issue.message,
        range: { start, end },
        data: { code: issue.code, eventName, modifiers, range: { start, end } },
      });
    }
  }

  return diagnostics;
}
