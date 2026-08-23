/**
 * printer.ts — Format a template AST into JSX/Lit-style output.
 *
 * Philosophy:
 * 1. Sibling elements → each on its own line (like JSX/Prettier)
 * 2. Text + inline elements mixed → keep on one line if they fit
 * 3. Element with only simple children that fits → single line
 * 4. Element with element children → multi-line (open, indented children, close)
 * 5. When open tag + attrs exceeds MAX_WIDTH → wrap attributes
 * 6. Simple expressions (${value}, ${() => x}) → inline
 * 7. Multi-line expressions / nested html`` → block (own indented line)
 * 8. <pre>, <script>, <style> → preserve content as-is
 * 9. If the entire template fits on one line → keep it inline
 */

import type { Node, ElementNode } from "./ast.js";
import { buildTree } from "./ast.js";
import {
  INLINE_ELEMENTS,
  VOID_ELEMENTS,
  PRE_ELEMENTS,
  parseAttributes,
  collapseWhitespace,
} from "../template/parser.js";

const MAX_WIDTH = 100;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isBlockExpr(raw: string): boolean {
  if (raw.includes("\n")) return true;
  if (/\bhtml\s*`/.test(raw)) return true;
  return false;
}

function isSimpleNode(node: Node): boolean {
  if (node.type === "text") return true;
  if (node.type === "expr") return !isBlockExpr(node.raw);
  return false;
}

function hasOnlySimpleChildren(element: ElementNode): boolean {
  return element.children.every(isSimpleNode);
}

function hasElementChildren(element: ElementNode): boolean {
  return element.children.some((c) => c.type === "element");
}

/**
 * Renders inline content (text + simple expressions) as a single string.
 */
function renderInlineContent(children: Node[]): string {
  let result = "";
  for (const child of children) {
    if (child.type === "text") {
      result += collapseWhitespace(child.text);
    } else if (child.type === "expr") {
      result += child.raw;
    }
  }
  return result.trim();
}

/**
 * Renders a single node as an inline string (no indent).
 */
function renderNodeInline(node: Node): string {
  if (node.type === "text") {
    return collapseWhitespace(node.text);
  }
  if (node.type === "expr") {
    return node.raw;
  }
  if (node.type === "element") {
    if (node.selfClose) {
      const attrs = node.attrs.trim();
      return `<${node.tag}${attrs ? " " + attrs : ""} />`;
    }
    const attrs = node.attrs.trim();
    const open = `<${node.tag}${attrs ? " " + attrs : ""}>`;
    const content = renderInlineContent(node.children);
    const close = `</${node.tag}>`;
    return `${open}${content}${close}`;
  }
  return "";
}

// ── Open tag formatting ──────────────────────────────────────────────────────

/**
 * Formats an open tag with attributes.
 * Returns array of strings (without indent prefix).
 */
function formatOpenTag(element: ElementNode, indent: string): string[] {
  const tag = element.tag;
  const close = element.selfClose ? " />" : ">";
  const attrs = parseAttributes(element.attrs);

  if (attrs.length === 0) {
    return [`<${tag}${close}`];
  }

  const singleLine = `<${tag} ${attrs.join(" ")}${close}`;
  if (indent.length + singleLine.length <= MAX_WIDTH) {
    return [singleLine];
  }

  // Wrap attributes
  const attrIndent = indent + "  ";
  const lines = [`<${tag}`];
  for (const attr of attrs) {
    lines.push(`${attrIndent}${attr}`);
  }
  lines.push(`${indent}${element.selfClose ? "/>" : ">"}`);
  return lines;
}

// ── Single-line attempt ──────────────────────────────────────────────────────

/**
 * Tries to render an element as a single inline line.
 * Returns the line string (with indent) or null if it doesn't fit.
 */
function trySingleLine(element: ElementNode, indent: string): string | null {
  if (element.selfClose) {
    const tagParts = formatOpenTag(element, indent);
    if (tagParts.length === 1) {
      return `${indent}${tagParts[0]}`;
    }
    return null;
  }

  if (!hasOnlySimpleChildren(element)) return null;

  const attrs = element.attrs.trim();
  const open = `<${element.tag}${attrs ? " " + attrs : ""}>`;
  const content = renderInlineContent(element.children);
  const close = `</${element.tag}>`;
  const line = `${indent}${open}${content}${close}`;

  if (line.length <= MAX_WIDTH) {
    return line;
  }

  return null;
}

// ── Main formatting ──────────────────────────────────────────────────────────

/**
 * Checks if a node is an inline element (inline HTML tag with only simple children).
 * These can be part of a text run instead of going on their own line.
 */
function isInlineSimpleElement(node: Node): boolean {
  if (node.type !== "element") return false;
  if (node.selfClose) {
    return INLINE_ELEMENTS.has(node.tag.toLowerCase()) || VOID_ELEMENTS.has(node.tag.toLowerCase());
  }
  return INLINE_ELEMENTS.has(node.tag.toLowerCase()) && hasOnlySimpleChildren(node);
}

/**
 * Checks if a node can be rendered inline (recursively).
 * - Text/expr → yes (if not block expr)
 * - Self-closing elements → yes
 * - Inline elements with only simple children → yes
 * - Block elements (div, section, p, etc.) → NO (always multi-line)
 */
function canBeInline(node: Node): boolean {
  if (node.type === "text") return true;
  if (node.type === "expr") return !isBlockExpr(node.raw);
  if (node.type === "comment" || node.type === "doctype") return false;
  if (node.type === "element") {
    if (node.selfClose) return true;
    // Block elements must always be multi-line
    if (!INLINE_ELEMENTS.has(node.tag.toLowerCase())) return false;
    // Inline elements can be inline only if children are also inline
    return node.children.every(canBeInline);
  }
  return false;
}

/**
 * Formats a list of nodes at a given indent depth.
 *
 * Rules:
 * - Block elements → each on its own line
 * - Inline elements mixed with text/expr → grouped on one line (greedy packing)
 * - Sibling inline elements with only whitespace between them → each on its own line
 * - Block expressions → own line
 */
export function formatNodes(
  nodes: Node[],
  depth: number,
  indentChar: string,
): string[] {
  const lines: string[] = [];
  const indent = indentChar.repeat(depth);

  // Collect text/expr/inline-element nodes into a text run (as strings)
  let textRun: string[] = [];

  function textRunHasContent(): boolean {
    return textRun.join("").trim().length > 0;
  }

  function flushTextRun(): void {
    if (textRun.length === 0) return;
    const joined = textRun.join("").trim();
    if (!joined) {
      textRun = [];
      return;
    }

    const fullLine = `${indent}${joined}`;
    if (fullLine.length <= MAX_WIDTH) {
      lines.push(fullLine);
    } else {
      // Line too long — greedily pack into multiple lines
      let current = indent;
      for (const part of textRun) {
        const trimmedPart = current === indent ? part.trimStart() : part;
        if (current === indent && trimmedPart.trim() === "") continue;

        if (current.length + trimmedPart.length > MAX_WIDTH && current.trim().length > indent.length) {
          lines.push(current.trimEnd());
          current = indent + trimmedPart.trimStart();
        } else {
          current += trimmedPart;
        }
      }
      if (current.trim().length > indent.length) {
        lines.push(current.trimEnd());
      }
    }
    textRun = [];
  }

  for (const node of nodes) {
    // Comments and doctypes on their own lines
    if (node.type === "comment") {
      flushTextRun();
      lines.push(`${indent}${node.raw.trim()}`);
      continue;
    }
    if (node.type === "doctype") {
      flushTextRun();
      lines.push(`${indent}${node.raw.trim()}`);
      continue;
    }

    // Block expressions on their own line
    if (node.type === "expr" && isBlockExpr(node.raw)) {
      flushTextRun();
      lines.push(`${indent}${node.raw.trim()}`);
      continue;
    }

    // Inline elements with simple children
    if (isInlineSimpleElement(node)) {
      if (textRunHasContent()) {
        // There's text/expr before this inline element → add to text run
        textRun.push(renderNodeInline(node));
      } else {
        // No text before → this is a sibling element, put on its own line
        const single = trySingleLine(node as ElementNode, indent);
        if (single) {
          flushTextRun();
          lines.push(single);
        } else {
          flushTextRun();
          lines.push(...formatElement(node as ElementNode, depth, indentChar));
        }
      }
      continue;
    }

    // Block elements — flush text run, then format on own line(s)
    if (node.type === "element") {
      flushTextRun();
      lines.push(...formatElement(node, depth, indentChar));
      continue;
    }

    // Text and simple expressions — collect into text run
    if (node.type === "text") {
      const collapsed = collapseWhitespace(node.text);
      textRun.push(collapsed);
    } else if (node.type === "expr") {
      textRun.push(node.raw);
    }
  }
  flushTextRun();

  return lines;
}

// ── Element formatting ───────────────────────────────────────────────────────

/**
 * Formats an element as a single line (if possible) or multi-line block.
 */
function formatElement(
  element: ElementNode,
  depth: number,
  indentChar: string,
): string[] {
  const indent = indentChar.repeat(depth);

  // Self-closing / void element
  if (element.selfClose) {
    const tagParts = formatOpenTag(element, indent);
    if (tagParts.length === 1) {
      return [`${indent}${tagParts[0]}`];
    }
    // Multi-line self-closing tag
    const lines = [`${indent}${tagParts[0]}`];
    for (let j = 1; j < tagParts.length; j++) {
      lines.push(tagParts[j]);
    }
    return lines;
  }

  // Try single line first
  const single = trySingleLine(element, indent);
  if (single) return [single];

  // Block formatting
  const openParts = formatOpenTag(element, indent);
  const lines: string[] = [];

  // Opening tag
  for (let j = 0; j < openParts.length; j++) {
    lines.push(j === 0 ? `${indent}${openParts[j]}` : openParts[j]);
  }

  // Children
  const childLines = formatElementChildren(element, depth + 1, indentChar);
  lines.push(...childLines);

  // Closing tag
  lines.push(`${indent}</${element.tag}>`);

  return lines;
}

/**
 * Formats an element's children.
 */
function formatElementChildren(
  element: ElementNode,
  depth: number,
  indentChar: string,
): string[] {
  // <pre>, <script>, <style>, <textarea> — preserve content as-is
  if (PRE_ELEMENTS.has(element.tag.toLowerCase())) {
    const indent = indentChar.repeat(depth);
    const content = element.children
      .map((c) => (c.type === "text" ? c.text : c.type === "expr" ? c.raw : ""))
      .join("");
    const trimmed = content.trim();
    if (trimmed) {
      return trimmed.split("\n").map((l) => `${indent}${l}`);
    }
    return [];
  }

  // Empty element
  if (element.children.length === 0) {
    return [];
  }

  // If all children are simple (text/expr), try to fit on one line
  if (hasOnlySimpleChildren(element)) {
    const content = renderInlineContent(element.children);
    if (content.length > 0) {
      const indent = indentChar.repeat(depth);
      const line = `${indent}${content}`;
      if (line.length <= MAX_WIDTH) {
        return [line];
      }
    }
  }

  // Check if children are a mix of text + inline elements (no block elements)
  // If so, try to render them as a single text run
  if (!hasElementChildren(element)) {
    // All text/expr — already handled above
  }

  // Multi-line children
  return formatNodes(element.children, depth, indentChar);
}

// ── Top-level template formatting ────────────────────────────────────────────

/**
 * Formats the inner content of a html`` template.
 * Returns the formatted string (without surrounding backticks).
 *
 * If the entire template fits on one line, keeps it inline.
 * Otherwise, formats with proper indentation.
 */
export function formatTemplateInner(
  inner: string,
  baseIndent: number,
  indentChar: string,
): string {
  if (inner.trim() === "") return inner;

  // Build tree
  const tree: Node[] = buildTree(inner);

  // Try single-line: if all nodes can be rendered inline and fit
  if (tree.every((n) => canBeInline(n))) {
    let flat = "";
    for (const n of tree) {
      flat += renderNodeInline(n);
    }
    flat = flat.trim();
    const indentWidth = baseIndent * indentChar.length;
    if (flat.length > 0 && indentWidth + flat.length <= MAX_WIDTH) {
      return flat;
    }
  }

  // Multi-line
  const contentIndent = baseIndent + 1;
  const lines = formatNodes(tree, contentIndent, indentChar);
  if (lines.length === 0) return inner;

  const body = lines.join("\n");
  return `\n${body}\n${indentChar.repeat(baseIndent)}`;
}
