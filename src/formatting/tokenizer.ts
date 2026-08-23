/**
 * tokenizer.ts — Tokenize html`` template content.
 *
 * Re-exports from template/parser.ts for the formatting module.
 */

export {
  tokenize,
  parseAttributes,
  isBlockExpr,
  collapseWhitespace,
  TOKEN,
  VOID_ELEMENTS,
  INLINE_ELEMENTS,
  PRE_ELEMENTS,
  type Token,
  type TokenType,
} from "../template/parser.js";
