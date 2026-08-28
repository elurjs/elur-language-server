# @elurjs/language-server

LSP (Language Server Protocol) server for [Elur](https://elur.dev/) `html\`\`` tagged templates.

Provides diagnostics, autocompletion, hover help, quick fixes, and formatting —
works in **any** editor that supports LSP.

## Features

- **Diagnostics**: unknown modifiers, duplicate modifiers, passive+prevent conflict,
  key modifiers on non-key events, non-canonical modifier order
- **Completion**: `@event` names, `.modifier` suggestions, `ref`/`show`/`hide` directives
- **Hover**: help text for each modifier (`.prevent`, `.stop`, `.enter`, etc.)
- **Quick fixes**: dedupe modifiers, normalize order, resolve conflicts, replace unknowns
- **Formatting**: indents and wraps `html\`\`` template content

## Install

```bash
npm install @elurjs/language-server
```

## Editor setup

### VS Code

The `vscode-elur` extension launches this server automatically.

### Neovim

```lua
require("lspconfig").elur = {
  cmd = { "elur-language-server", "--stdio" },
  filetypes = { "typescript", "javascript", "typescriptreact", "javascriptreact" },
}
```

### Helix

```toml
# ~/.config/helix/languages.toml
[[language]]
name = "typescript"
language-servers = ["elur-language-server"]
```

### Zed

```json
"language_servers": ["elur-language-server"]
```

### Emacs (eglot)

```elisp
(add-to-list 'eglot-server-programs
  '((typescript-mode) . ("elur-language-server" "--stdio")))
```

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## License

MIT
