import * as vscode from "vscode";
import { issuesToDiagnostics, type DesignIssue } from "./diagnostics.js";
import { DesignIssuesProvider } from "./sidebar.js";

// These imports are resolved at build time by esbuild, which bundles
// the devsigner ESM dist into the extension's CJS output.
import { parseCode, runDesignRules, calculateScore } from "devsigner/dist/review.js";
import { generatePalette } from "devsigner/src/palettes/generator.js";

// ── Supported languages ─────────────────────────────────────────────

const SUPPORTED_LANGUAGES = new Set([
  "typescriptreact",
  "javascriptreact",
  "vue",
  "svelte",
  "css",
]);

function isSupportedDocument(doc: vscode.TextDocument): boolean {
  return SUPPORTED_LANGUAGES.has(doc.languageId);
}

// ── Activation ──────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  // Diagnostic collection for inline squigglies
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("devsigner");
  context.subscriptions.push(diagnosticCollection);

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "devsigner.reviewFile";
  statusBarItem.tooltip = "devsigner design score (click to review)";
  context.subscriptions.push(statusBarItem);

  // Sidebar tree view
  const issuesProvider = new DesignIssuesProvider();
  const treeView = vscode.window.createTreeView("devsigner.issuesView", {
    treeDataProvider: issuesProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // ── Core review logic ───────────────────────────────────────────

  function reviewDocument(document: vscode.TextDocument): void {
    const config = vscode.workspace.getConfiguration("devsigner");
    if (!config.get<boolean>("enabled", true)) return;
    if (!isSupportedDocument(document)) return;

    try {
      const code = document.getText();
      const parsed = parseCode(code);
      const issues: DesignIssue[] = runDesignRules(
        parsed.declarations,
        ["all"],
        parsed.blocks
      );
      const score = calculateScore(issues);

      // Update diagnostics
      const diagnostics = issuesToDiagnostics(issues, document);
      diagnosticCollection.set(document.uri, diagnostics);

      // Update status bar
      const threshold = config.get<number>("scoreThreshold", 70);
      statusBarItem.text = score >= threshold
        ? `\uD83C\uDFA8 ${score}/100`
        : `\u26A0\uFE0F ${score}/100`;
      statusBarItem.show();

      // Update sidebar
      issuesProvider.refresh(issues, score);
    } catch (err) {
      console.error("devsigner: review failed", err);
    }
  }

  // ── Auto-review on save ─────────────────────────────────────────

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      const config = vscode.workspace.getConfiguration("devsigner");
      if (config.get<boolean>("reviewOnSave", true)) {
        reviewDocument(document);
      }
    })
  );

  // ── Review when active editor changes ───────────────────────────

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        reviewDocument(editor.document);
      } else {
        statusBarItem.hide();
      }
    })
  );

  // Review current file on activation
  if (vscode.window.activeTextEditor) {
    reviewDocument(vscode.window.activeTextEditor.document);
  }

  // ── Commands ────────────────────────────────────────────────────

  // Review Current File
  context.subscriptions.push(
    vscode.commands.registerCommand("devsigner.reviewFile", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage(
          "devsigner: No active file to review."
        );
        return;
      }
      reviewDocument(editor.document);
      vscode.window.showInformationMessage(
        `devsigner: Review complete. ${statusBarItem.text}`
      );
    })
  );

  // Fix Current File
  context.subscriptions.push(
    vscode.commands.registerCommand("devsigner.fixFile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage(
          "devsigner: No active file to fix."
        );
        return;
      }

      if (!isSupportedDocument(editor.document)) {
        vscode.window.showInformationMessage(
          "devsigner: This file type is not supported."
        );
        return;
      }

      const code = editor.document.getText();
      const parsed = parseCode(code);
      const issues: DesignIssue[] = runDesignRules(
        parsed.declarations,
        ["all"],
        parsed.blocks
      );

      if (issues.length === 0) {
        vscode.window.showInformationMessage(
          "devsigner: No design issues found!"
        );
        return;
      }

      // MVP: present suggestions in a quick-pick so the user can
      // navigate to the relevant line. A full auto-fix engine is
      // a future enhancement.
      const items: vscode.QuickPickItem[] = issues.map((issue) => ({
        label: `$(${severityToIcon(issue.severity)}) ${issue.message}`,
        description: `[${issue.category}]${issue.line != null ? ` line ${issue.line}` : ""}`,
        detail: issue.suggestion,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        title: `devsigner: ${issues.length} issue(s) found`,
        placeHolder: "Select an issue to jump to it",
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (picked) {
        const issueIndex = items.indexOf(picked);
        const issue = issues[issueIndex];
        if (issue.line != null) {
          const line = Math.max(0, issue.line - 1);
          const safeLine = Math.min(line, editor.document.lineCount - 1);
          const range = editor.document.lineAt(safeLine).range;
          editor.selection = new vscode.Selection(range.start, range.end);
          editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        }
      }
    })
  );

  // Generate Color Palette
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devsigner.generatePalette",
      async () => {
        const description = await vscode.window.showInputBox({
          title: "devsigner: Generate Color Palette",
          prompt:
            "Describe the palette (e.g., 'modern SaaS', 'warm and cozy')",
          placeHolder: "modern and clean",
        });

        if (!description) return;

        const baseColor = await vscode.window.showInputBox({
          title: "devsigner: Base Color (optional)",
          prompt: "Enter a hex color or leave blank for auto-selection",
          placeHolder: "#3B82F6",
        });

        try {
          const result = generatePalette(
            description,
            baseColor || undefined
          ) as {
            palette: Record<string, unknown>;
            contrastReport: Array<{
              pair: [string, string];
              ratio: number;
              wcagAA: boolean;
              wcagAAA: boolean;
            }>;
            presetUsed: string;
          };

          const content = JSON.stringify(result, null, 2);
          const doc = await vscode.workspace.openTextDocument({
            content,
            language: "json",
          });
          await vscode.window.showTextDocument(doc);

          vscode.window.showInformationMessage(
            `devsigner: Palette generated using "${result.presetUsed}" preset.`
          );
        } catch (err) {
          vscode.window.showErrorMessage(
            `devsigner: Failed to generate palette. ${err}`
          );
        }
      }
    )
  );

  // ── Clean up diagnostics when files are closed ──────────────────

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      diagnosticCollection.delete(document.uri);
    })
  );
}

export function deactivate(): void {
  // Nothing to clean up; VS Code disposes subscriptions automatically.
}

// ── Helpers ─────────────────────────────────────────────────────────

function severityToIcon(severity: DesignIssue["severity"]): string {
  switch (severity) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "info":
      return "info";
  }
}
