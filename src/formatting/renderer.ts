/**
 * renderer.ts — Render tokens to formatted lines.
 *
 * Ported from elur-vscode/formatter.js renderTokens() and formatOpenTag().
 */

import {
  TOKEN,
  INLINE_ELEMENTS,
  PRE_ELEMENTS,
  parseAttributes,
  isBlockExpr,
  collapseWhitespace,
  type Token,
} from "./tokenizer.js";

const MAX_LINE_WIDTH = 80;

/**
 * Re-indents a multiline expression so lines after the first align to `depth`.
 */
function reindentExpr(raw: string, depth: number, indentChar: string): string {
  const lines = raw.split("\n");
  if (lines.length === 1) return raw.trimStart();

  const first = lines[0].trimStart();
  const rest = lines.slice(1);

  let minIndent = Infinity;
  for (const l of rest) {
    if (l.trim().length === 0) continue;
    const match = l.match(/^([ \t]*)/);
    const cols = match ? match[1].length : 0;
    if (cols < minIndent) minIndent = cols;
  }
  const safeMin = isFinite(minIndent) ? minIndent : 0;
  const baseStr = indentChar.repeat(depth);

  const reindented = rest.map((l) => {
    if (l.trim().length === 0) return "";
    return baseStr + l.slice(safeMin);
  });

  return [first, ...reindented].join("\n");
}

function formatOpenTag(
  raw: string,
  tag: string,
  attrsRaw: string,
  selfClose: boolean,
  depth: number,
  indentChar: string,
): string[] {
  const indent = indentChar.repeat(depth);
  const attrIndent = indentChar.repeat(depth + 1);
  const attrs = parseAttributes(attrsRaw);
  const close = selfClose ? " />" : ">";

  const tagInline = `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
  const singleLine = `${indent}${tagInline}`;

  if (attrs.length <= 1) return [singleLine];
  if (attrs.length === 2 && tagInline.length <= MAX_LINE_WIDTH) return [singleLine];

  const result = [`${indent}<${tag}`];
  for (const attr of attrs) {
    result.push(`${attrIndent}${attr}`);
  }
  if (selfClose) {
    result.push(`${indent}/>`);
  } else {
    result.push(`${indent}>`);
  }
  return result;
}

/**
 * Renders a token list into formatted lines at the given base depth.
 */
export function renderTokens(
  tokens: Token[],
  baseDepth: number,
  indentChar: string,
): string[] {
  const lines: string[] = [];
  let depth = baseDepth;
  let pendingText = "";
  let inPre = false;
  const promotedInline: string[] = [];

  function flushText(): void {
    if (pendingText.trim() === "") {
      pendingText = "";
      return;
    }
    lines.push(indentChar.repeat(depth) + pendingText.trim());
    pendingText = "";
  }

  for (const token of tokens) {
    if (inPre) {
      if (token.type === TOKEN.CLOSE_TAG && PRE_ELEMENTS.has(token.tag || "")) {
        flushText();
        depth--;
        lines.push(indentChar.repeat(depth) + token.raw.trim());
        inPre = false;
      } else {
        pendingText += token.raw;
      }
      continue;
    }

    switch (token.type) {
      case TOKEN.DOCTYPE:
      case TOKEN.COMMENT: {
        flushText();
        lines.push(indentChar.repeat(depth) + token.raw.trim());
        break;
      }
      case TOKEN.SELF_CLOSE: {
        flushText();
        const formatted = formatOpenTag(token.raw, token.tag || "", token.attrs || "", true, depth, indentChar);
        lines.push(...formatted);
        break;
      }
      case TOKEN.OPEN_TAG: {
        const isBlock = !INLINE_ELEMENTS.has(token.tag || "");
        if (isBlock) {
          flushText();
          const formatted = formatOpenTag(token.raw, token.tag || "", token.attrs || "", false, depth, indentChar);
          lines.push(...formatted);
          depth++;
          if (PRE_ELEMENTS.has(token.tag || "")) inPre = true;
        } else {
          const formatted = formatOpenTag(token.raw, token.tag || "", token.attrs || "", false, depth, indentChar);
          if (formatted.length === 1) {
            pendingText += formatted[0].trimStart();
          } else {
            flushText();
            lines.push(...formatted);
            depth++;
            promotedInline.push(token.tag || "");
          }
        }
        break;
      }
      case TOKEN.CLOSE_TAG: {
        const isBlock = !INLINE_ELEMENTS.has(token.tag || "");
        const wasPromoted =
          !isBlock &&
          promotedInline.length > 0 &&
          promotedInline[promotedInline.length - 1] === token.tag;

        if (isBlock || wasPromoted) {
          flushText();
          depth = Math.max(baseDepth, depth - 1);
          lines.push(indentChar.repeat(depth) + token.raw.trim());
          if (wasPromoted) promotedInline.pop();
        } else {
          pendingText += token.raw.trim();
        }
        break;
      }
      case TOKEN.EXPR: {
        if (isBlockExpr(token.raw)) {
          flushText();
          const reindented = reindentExpr(token.raw, depth, indentChar);
          const exprLines = reindented.split("\n");
          lines.push(indentChar.repeat(depth) + exprLines[0]);
          for (let i = 1; i < exprLines.length; i++) {
            lines.push(exprLines[i]);
          }
        } else {
          pendingText += token.raw;
        }
        break;
      }
      case TOKEN.TEXT: {
        const collapsed = collapseWhitespace(token.raw);
        if (collapsed.trim() === "") {
          if ((token.raw.match(/\n/g) || []).length > 1) {
            flushText();
            lines.push("");
          }
        } else {
          pendingText += collapsed;
        }
        break;
      }
    }
  }
  flushText();
  return lines;
}
