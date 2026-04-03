import * as vscode from "vscode";

/**
 * Shape of a design issue from the devsigner package.
 * Duplicated here to avoid import-time coupling when the package
 * is resolved lazily at runtime.
 */
export interface DesignIssue {
  severity: "error" | "warning" | "info";
  category: "spacing" | "color" | "typography" | "layout";
  message: string;
  suggestion: string;
  line?: number;
}

const SEVERITY_MAP: Record<DesignIssue["severity"], vscode.DiagnosticSeverity> = {
  error: vscode.DiagnosticSeverity.Error,
  warning: vscode.DiagnosticSeverity.Warning,
  info: vscode.DiagnosticSeverity.Information,
};

/**
 * Convert an array of devsigner DesignIssue objects into VS Code
 * Diagnostic objects that can be pushed to a DiagnosticCollection.
 */
export function issuesToDiagnostics(
  issues: DesignIssue[],
  document: vscode.TextDocument
): vscode.Diagnostic[] {
  return issues.map((issue) => {
    // If the issue has a line number, use it (1-based from devsigner).
    // Otherwise fall back to line 0.
    const lineIndex = issue.line != null ? Math.max(0, issue.line - 1) : 0;

    // Clamp to document length so we never go out of bounds.
    const safeLine = Math.min(lineIndex, document.lineCount - 1);
    const lineText = document.lineAt(safeLine);

    const range = new vscode.Range(
      safeLine,
      lineText.firstNonWhitespaceCharacterIndex,
      safeLine,
      lineText.text.length
    );

    const diagnostic = new vscode.Diagnostic(
      range,
      `${issue.message}\n${issue.suggestion}`,
      SEVERITY_MAP[issue.severity]
    );

    diagnostic.source = "devsigner";
    diagnostic.code = issue.category;

    return diagnostic;
  });
}
