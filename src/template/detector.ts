/**
 * detector.ts — Detect html`` tagged template regions in source text.
 *
 * Ported from nix-js-vscode/template-tags.js.
 */

const TEMPLATE_TAG = "html";

export interface TemplateRegion {
  /** Absolute offset of the opening backtick + 1 (start of inner content). */
  innerStart: number;
  /** Absolute offset of the closing backtick. */
  innerEnd: number;
  /** The inner content string. */
  inner: string;
  /** Base indentation depth (in indent units) of the tag line. */
  baseIndent: number;
}

/**
 * Extracts the template tag name immediately before a backtick.
 * Returns null if no valid tag is found.
 */
export function extractTemplateTagBeforeBacktick(textBeforeCursor: string): string | null {
  const lastBacktick = textBeforeCursor.lastIndexOf("`");
  if (lastBacktick < 0) return null;

  const beforeBacktick = textBeforeCursor.slice(0, lastBacktick);
  let i = beforeBacktick.length - 1;

  while (i >= 0 && /\s/.test(beforeBacktick[i])) i--;

  const end = i;
  while (i >= 0 && /[\w$]/.test(beforeBacktick[i])) i--;

  const tagName = beforeBacktick.slice(i + 1, end + 1).toLowerCase();
  return tagName || null;
}

/**
 * Returns true if the cursor at `cursorOffset` is inside a html`` tagged template.
 */
export function isInsideTaggedTemplate(
  documentText: string,
  cursorOffset: number,
  allowedTags: readonly string[] = [TEMPLATE_TAG],
): boolean {
  const before = documentText.slice(0, cursorOffset);
  const tagName = extractTemplateTagBeforeBacktick(before);
  if (!tagName || !allowedTags.includes(tagName)) return false;

  const nextBacktick = documentText.indexOf("`", cursorOffset);
  return nextBacktick !== -1;
}

/**
 * Finds the closing backtick of a template starting at `from` (position after
 * the opening backtick). Handles nested ${...} and nested template literals.
 * Returns -1 if not found.
 */
export function findTemplateClose(text: string, from: number): number {
  let i = from;
  const len = text.length;

  while (i < len) {
    if (text[i] === "`") return i;

    if (text[i] === "$" && text[i + 1] === "{") {
      i += 2;
      let depth = 1;
      while (i < len && depth > 0) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}") depth--;
        else if (text[i] === "`") {
          i++;
          const nestedClose = findTemplateClose(text, i);
          if (nestedClose === -1) return -1;
          i = nestedClose;
        } else if (text[i] === '"' || text[i] === "'") {
          const q = text[i];
          i++;
          while (i < len && text[i] !== q) {
            if (text[i] === "\\") i++;
            i++;
          }
        }
        i++;
      }
      continue;
    }
    i++;
  }
  return -1;
}

/**
 * Scans the document text and returns all html`` template regions.
 * Regions are returned in order of appearance. Nested templates are included.
 */
export function findTemplateRegions(text: string, tabSize = 2): TemplateRegion[] {
  const regions: TemplateRegion[] = [];
  scanRegions(text, 0, regions, tabSize);
  return regions;
}

function scanRegions(
  text: string,
  baseOffset: number,
  regions: TemplateRegion[],
  tabSize: number,
): void {
  const len = text.length;
  let i = 0;

  while (i < len) {
    // Skip line comments
    if (text[i] === "/" && text[i + 1] === "/") {
      while (i < len && text[i] !== "\n") i++;
      continue;
    }
    // Skip block comments
    if (text[i] === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < len - 1 && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    // Skip strings
    if (text[i] === '"' || text[i] === "'") {
      const q = text[i];
      i++;
      while (i < len && text[i] !== q) {
        if (text[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }

    if (/[a-zA-Z_$]/.test(text[i])) {
      const tagStart = i;
      while (i < len && /[\w$]/.test(text[i])) i++;
      const tag = text.slice(tagStart, i).toLowerCase();

      if (tag === TEMPLATE_TAG) {
        let j = i;
        while (j < len && (text[j] === " " || text[j] === "\t")) j++;

        if (j < len && text[j] === "`") {
          const openBacktick = j;
          const innerStart = openBacktick + 1;

          // Compute base indent
          let lineStart = tagStart;
          while (lineStart > 0 && text[lineStart - 1] !== "\n") lineStart--;

          let spaceCount = 0;
          let k = lineStart;
          while (k < tagStart && (text[k] === " " || text[k] === "\t")) {
            spaceCount += text[k] === "\t" ? tabSize : 1;
            k++;
          }
          const baseIndent = Math.round(spaceCount / tabSize);

          const closeBacktick = findTemplateClose(text, innerStart);
          if (closeBacktick === -1) {
            i = j + 1;
            continue;
          }

          const inner = text.slice(innerStart, closeBacktick);
          const innerStartAbs = baseOffset + innerStart;
          const innerEndAbs = baseOffset + closeBacktick;

          scanRegions(inner, innerStartAbs, regions, tabSize);

          regions.push({
            innerStart: innerStartAbs,
            innerEnd: innerEndAbs,
            inner,
            baseIndent,
          });

          i = closeBacktick + 1;
          continue;
        }
      }
    }
    i++;
  }
}
