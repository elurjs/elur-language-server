/**
 * parser.ts — Tokenize and parse html`` template inner content.
 *
 * Ported from nix-js-vscode/formatter.js tokenize() and consumeOpenTag().
 * Produces a token stream that the formatter can render.
 */

export const TOKEN = {
  OPEN_TAG: "OPEN_TAG",
  CLOSE_TAG: "CLOSE_TAG",
  SELF_CLOSE: "SELF_CLOSE",
  EXPR: "EXPR",
  TEXT: "TEXT",
  COMMENT: "COMMENT",
  DOCTYPE: "DOCTYPE",
} as const;

export type TokenType = (typeof TOKEN)[keyof typeof TOKEN];

export interface Token {
  type: TokenType;
  raw: string;
  tag?: string;
  attrs?: string;
  selfClose?: boolean;
}

export const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

export const INLINE_ELEMENTS = new Set([
  "a", "abbr", "acronym", "b", "bdo", "big", "br", "button", "cite",
  "code", "dfn", "em", "i", "img", "input", "kbd", "label", "map",
  "object", "output", "q", "samp", "select", "small", "span", "strong",
  "sub", "sup", "textarea", "time", "tt", "u", "var",
]);

export const PRE_ELEMENTS = new Set(["pre", "script", "style", "textarea"]);

/**
 * Tokenizes the inner HTML content of a html`` template.
 */
export function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = html.length;

  while (i < len) {
    // Expression ${...}
    if (html[i] === "$" && html[i + 1] === "{") {
      const start = i;
      i += 2;
      let depth = 1;
      while (i < len && depth > 0) {
        if (html[i] === "{") depth++;
        else if (html[i] === "}") depth--;
        i++;
      }
      tokens.push({ type: TOKEN.EXPR, raw: html.slice(start, i) });
      continue;
    }

    if (html[i] === "<") {
      // Comment
      if (html.slice(i, i + 4) === "<!--") {
        const end = html.indexOf("-->", i + 4);
        const closeIdx = end === -1 ? len : end + 3;
        tokens.push({ type: TOKEN.COMMENT, raw: html.slice(i, closeIdx) });
        i = closeIdx;
        continue;
      }
      // Doctype
      if (html.slice(i, i + 9).toLowerCase() === "<!doctype") {
        const end = html.indexOf(">", i);
        const closeIdx = end === -1 ? len : end + 1;
        tokens.push({ type: TOKEN.DOCTYPE, raw: html.slice(i, closeIdx) });
        i = closeIdx;
        continue;
      }
      // Close tag
      if (html[i + 1] === "/") {
        const end = html.indexOf(">", i);
        const closeIdx = end === -1 ? len : end + 1;
        const raw = html.slice(i, closeIdx);
        const tagMatch = raw.match(/^<\/([a-zA-Z][a-zA-Z0-9-]*)/);
        const tag = tagMatch ? tagMatch[1] : "";
        tokens.push({ type: TOKEN.CLOSE_TAG, raw, tag });
        i = closeIdx;
        continue;
      }
      // Open tag
      const tagResult = consumeOpenTag(html, i);
      if (tagResult) {
        tokens.push(tagResult);
        i += tagResult.raw.length;
        continue;
      }
      tokens.push({ type: TOKEN.TEXT, raw: "<" });
      i++;
      continue;
    }

    // Text
    const start = i;
    while (i < len && html[i] !== "<" && !(html[i] === "$" && html[i + 1] === "{")) {
      i++;
    }
    if (i > start) {
      tokens.push({ type: TOKEN.TEXT, raw: html.slice(start, i) });
    }
  }
  return tokens;
}

function consumeOpenTag(html: string, from: number): Token | null {
  let i = from + 1;
  const len = html.length;
  const tagNameStart = i;

  while (i < len && /[a-zA-Z0-9-]/.test(html[i])) i++;
  if (i === tagNameStart) return null;

  const tag = html.slice(tagNameStart, i);
  const attrsStart = i;

  while (i < len && html[i] !== ">") {
    if (html[i] === "$" && html[i + 1] === "{") {
      i += 2;
      let depth = 1;
      while (i < len && depth > 0) {
        if (html[i] === "{") depth++;
        else if (html[i] === "}") depth--;
        i++;
      }
      continue;
    }
    if (html[i] === '"') {
      i++;
      while (i < len && html[i] !== '"') i++;
      i++;
      continue;
    }
    if (html[i] === "'") {
      i++;
      while (i < len && html[i] !== "'") i++;
      i++;
      continue;
    }
    i++;
  }

  if (i >= len) return null;
  i++;

  const raw = html.slice(from, i);
  let attrsRaw = html.slice(attrsStart, i - 1).trimEnd();

  let selfClose = VOID_ELEMENTS.has(tag.toLowerCase());
  while (/(?:^|\s)\/\s*$/.test(attrsRaw)) {
    selfClose = true;
    attrsRaw = attrsRaw.replace(/\s*\/\s*$/, "").trimEnd();
  }

  const type = selfClose ? TOKEN.SELF_CLOSE : TOKEN.OPEN_TAG;

  return { type, raw, tag, attrs: attrsRaw, selfClose };
}

/**
 * Parses attributes from an attrs raw string into individual attr tokens.
 */
export function parseAttributes(attrsRaw: string): string[] {
  const attrs: string[] = [];
  let i = 0;
  const len = attrsRaw.length;
  let current = "";

  const push = () => {
    const v = current.trim();
    if (v && v !== "/") attrs.push(v);
    current = "";
  };

  while (i < len) {
    if (/\s/.test(attrsRaw[i]) && current.trim() === "") {
      i++;
      continue;
    }
    if (attrsRaw[i] === "$" && attrsRaw[i + 1] === "{") {
      const start = i;
      i += 2;
      let depth = 1;
      while (i < len && depth > 0) {
        if (attrsRaw[i] === "{") depth++;
        else if (attrsRaw[i] === "}") depth--;
        i++;
      }
      current += attrsRaw.slice(start, i);
      continue;
    }
    if (attrsRaw[i] === '"' || attrsRaw[i] === "'") {
      const q = attrsRaw[i];
      const start = i;
      i++;
      while (i < len && attrsRaw[i] !== q) i++;
      i++;
      current += attrsRaw.slice(start, i);
      continue;
    }
    if (/\s/.test(attrsRaw[i])) {
      push();
      i++;
      continue;
    }
    current += attrsRaw[i];
    i++;
  }
  push();
  return attrs;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ");
}

/**
 * Returns true when an expression should be treated as block-level
 * (gets its own line) rather than inline.
 */
export function isBlockExpr(raw: string): boolean {
  if (raw.includes("\n")) return true;
  if (/^\$\{[a-zA-Z_$][\w$]*\s*\(/.test(raw)) return true;
  if (/^\$\{\s*(?:async\s+)?\(/.test(raw)) return true;
  if (/\bhtml\s*`/.test(raw)) return true;
  return false;
}

export { collapseWhitespace };
