/**
 * server-browser.ts — Browser-compatible entry (no Node-specific imports).
 *
 * Exports the core analysis functions for use in browser-based editors
 * (e.g. Monaco-based web editors) that don't need the full LSP connection.
 */

export { analyzeEventModifiers, isKeyEventName, type ModifierIssue } from "./modifiers/analyzer.js";
export { normalizeModifierOrder, uniqueModifiers, removeModifier } from "./modifiers/normalizer.js";
export { getModifierSuggestions, suggestClosestModifier, levenshtein } from "./modifiers/suggestions.js";
export { parseEventContextFromPrefix, parseEventBindingChain, buildEventBindingChain } from "./modifiers/parser.js";
export { createModifierQuickFixes, type QuickFix } from "./codeActions/fixes.js";
export { scanDiagnostics, type TextDiagnostic } from "./diagnostics/rules.js";
export { findTemplateRegions, isInsideTaggedTemplate } from "./template/detector.js";
export { tokenize, parseAttributes, type Token } from "./template/parser.js";
export {
  EVENT_MODIFIERS, KEY_MODIFIERS, KEY_EVENTS, EVENT_BINDINGS,
  DIRECTIVE_ATTRIBUTES, TEMPLATE_TAGS, MODIFIER_HELP,
} from "./modifiers/constants.js";
