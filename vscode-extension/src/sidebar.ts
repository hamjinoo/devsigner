import * as vscode from "vscode";
import type { DesignIssue } from "./diagnostics.js";

// ── Tree items ──────────────────────────────────────────────────────

class CategoryItem extends vscode.TreeItem {
  constructor(
    public readonly category: string,
    public readonly issues: DesignIssue[],
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(categoryLabel(category, issues.length), collapsibleState);
    this.iconPath = categoryIcon(category);
    this.contextValue = "category";
  }
}

class IssueItem extends vscode.TreeItem {
  constructor(public readonly issue: DesignIssue) {
    super(issue.message, vscode.TreeItemCollapsibleState.None);
    this.description = issue.suggestion;
    this.tooltip = `[${issue.severity}] ${issue.message}\n${issue.suggestion}`;
    this.iconPath = severityIcon(issue.severity);
    this.contextValue = "issue";

    if (issue.line != null) {
      this.command = {
        command: "revealLine",
        title: "Go to line",
        arguments: [{ lineNumber: issue.line - 1, at: "center" }],
      };
    }
  }
}

// ── Provider ────────────────────────────────────────────────────────

export class DesignIssuesProvider
  implements vscode.TreeDataProvider<CategoryItem | IssueItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    CategoryItem | IssueItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private issues: DesignIssue[] = [];
  private score = 100;

  refresh(issues: DesignIssue[], score: number): void {
    this.issues = issues;
    this.score = score;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CategoryItem | IssueItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: CategoryItem | IssueItem
  ): (CategoryItem | IssueItem)[] {
    if (!element) {
      // Root level: group by category
      const grouped = new Map<string, DesignIssue[]>();
      for (const issue of this.issues) {
        const list = grouped.get(issue.category) ?? [];
        list.push(issue);
        grouped.set(issue.category, list);
      }

      if (grouped.size === 0) {
        // Show a friendly "all clear" item
        const allClear = new vscode.TreeItem(
          `Score: ${this.score}/100 - No issues found`,
          vscode.TreeItemCollapsibleState.None
        );
        allClear.iconPath = new vscode.ThemeIcon("pass");
        return [allClear as unknown as IssueItem];
      }

      return Array.from(grouped.entries()).map(
        ([cat, issues]) =>
          new CategoryItem(
            cat,
            issues,
            vscode.TreeItemCollapsibleState.Expanded
          )
      );
    }

    if (element instanceof CategoryItem) {
      return element.issues.map((i) => new IssueItem(i));
    }

    return [];
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function categoryLabel(category: string, count: number): string {
  const name = category.charAt(0).toUpperCase() + category.slice(1);
  return `${name} (${count})`;
}

function categoryIcon(category: string): vscode.ThemeIcon {
  switch (category) {
    case "spacing":
      return new vscode.ThemeIcon("whitespace");
    case "color":
      return new vscode.ThemeIcon("symbol-color");
    case "typography":
      return new vscode.ThemeIcon("text-size");
    case "layout":
      return new vscode.ThemeIcon("layout");
    default:
      return new vscode.ThemeIcon("circle-outline");
  }
}

function severityIcon(
  severity: DesignIssue["severity"]
): vscode.ThemeIcon {
  switch (severity) {
    case "error":
      return new vscode.ThemeIcon("error");
    case "warning":
      return new vscode.ThemeIcon("warning");
    case "info":
      return new vscode.ThemeIcon("info");
  }
}
