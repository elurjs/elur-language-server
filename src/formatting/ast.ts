/**
 * ast.ts — Tree node types for html`` template formatting.
 *
 * A proper tree structure allows making informed inline/block decisions
 * based on children, line width, and nesting — similar to how Prettier
 * formats JSX.
 */

export type Node =
  | ElementNode
  | TextNode
  | ExprNode
  | CommentNode
  | DoctypeNode;

export interface ElementNode {
  type: "element";
  tag: string;
  attrs: string;
  selfClose: boolean;
  children: Node[];
  /** Raw open tag text including <tag attrs> */
  openRaw: string;
  /** Raw close tag text including </tag> */
  closeRaw: string;
}

export interface TextNode {
  type: "text";
  text: string;
}

export interface ExprNode {
  type: "expr";
  raw: string;
}

export interface CommentNode {
  type: "comment";
  raw: string;
}

export interface DoctypeNode {
  type: "doctype";
  raw: string;
}

/**
 * Builds a tree from a token list.
 * Tokens are produced by tokenize() from template/parser.ts.
 */
import { tokenize, TOKEN, VOID_ELEMENTS, type Token } from "../template/parser.js";

export function buildTree(html: string): Node[] {
  const tokens = tokenize(html);
  const parser = new TreeParser(tokens);
  return parser.parseNodes();
}

class TreeParser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parseNodes(stopAtTag?: string): Node[] {
    const nodes: Node[] = [];

    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];

      if (token.type === TOKEN.CLOSE_TAG) {
        if (stopAtTag && token.tag === stopAtTag) {
          return nodes;
        }
        // Stray close tag — emit as text
        this.pos++;
        nodes.push({ type: "text", text: token.raw });
        continue;
      }

      if (token.type === TOKEN.OPEN_TAG) {
        const tag = token.tag || "";
        const selfClose = VOID_ELEMENTS.has(tag.toLowerCase()) || token.selfClose === true;

        if (selfClose) {
          this.pos++;
          nodes.push({
            type: "element",
            tag,
            attrs: token.attrs || "",
            selfClose: true,
            children: [],
            openRaw: token.raw,
            closeRaw: "",
          });
          continue;
        }

        this.pos++;
        const children = this.parseNodes(tag);
        const closeToken = this.tokens[this.pos];
        const closeRaw = closeToken && closeToken.type === TOKEN.CLOSE_TAG
          ? closeToken.raw
          : "";
        if (closeToken && closeToken.type === TOKEN.CLOSE_TAG) {
          this.pos++;
        }

        nodes.push({
          type: "element",
          tag,
          attrs: token.attrs || "",
          selfClose: false,
          children,
          openRaw: token.raw,
          closeRaw,
        });
        continue;
      }

      if (token.type === TOKEN.SELF_CLOSE) {
        this.pos++;
        nodes.push({
          type: "element",
          tag: token.tag || "",
          attrs: token.attrs || "",
          selfClose: true,
          children: [],
          openRaw: token.raw,
          closeRaw: "",
        });
        continue;
      }

      if (token.type === TOKEN.EXPR) {
        this.pos++;
        nodes.push({ type: "expr", raw: token.raw });
        continue;
      }

      if (token.type === TOKEN.TEXT) {
        this.pos++;
        nodes.push({ type: "text", text: token.raw });
        continue;
      }

      if (token.type === TOKEN.COMMENT) {
        this.pos++;
        nodes.push({ type: "comment", raw: token.raw });
        continue;
      }

      if (token.type === TOKEN.DOCTYPE) {
        this.pos++;
        nodes.push({ type: "doctype", raw: token.raw });
        continue;
      }

      // Unknown token — skip
      this.pos++;
    }

    return nodes;
  }
}
