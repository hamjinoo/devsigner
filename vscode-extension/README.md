# devsigner - Design Review (VS Code Extension)

Design sense for your code. Automatic design review with scoring, inline diagnostics, and a sidebar panel.

## Features

- **Auto-review on save** -- runs design analysis on `.tsx`, `.jsx`, `.vue`, `.svelte`, and `.css` files every time you save.
- **Inline diagnostics** -- design issues appear as warnings and errors in the editor (squiggly underlines), just like ESLint.
- **Status bar score** -- see your file's design score at a glance in the bottom-right corner.
- **Sidebar panel** -- browse all design issues grouped by category (spacing, color, typography, layout).
- **Command palette** -- "Review Current File", "Fix Current File", and "Generate Color Palette".

## Requirements

This extension requires the `devsigner` npm package to be installed as a dependency (it is listed in `package.json` and bundled with the extension).

## Extension Settings

| Setting                     | Default | Description                                        |
| --------------------------- | ------- | -------------------------------------------------- |
| `devsigner.enabled`         | `true`  | Enable or disable design review.                   |
| `devsigner.scoreThreshold`  | `70`    | Score below which the status bar shows a warning.  |
| `devsigner.reviewOnSave`    | `true`  | Automatically run review when a file is saved.     |

## Commands

| Command                              | Description                          |
| ------------------------------------ | ------------------------------------ |
| `devsigner: Review Current File`     | Run design review on the active file |
| `devsigner: Fix Current File`        | Show issues as a quick-pick list     |
| `devsigner: Generate Color Palette`  | Generate a palette from a prompt     |

## Development

```bash
cd vscode-extension
npm install
npm run build
```

To package as a VSIX:

```bash
npm run package
```

Then install via `code --install-extension devsigner-vscode-0.1.0.vsix`.
