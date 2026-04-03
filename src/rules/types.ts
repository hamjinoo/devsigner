export type Severity = "error" | "warning" | "info";

export type Category = "spacing" | "color" | "typography" | "layout";

export interface DesignIssue {
  severity: Severity;
  category: Category;
  message: string;
  suggestion: string;
  line?: number;
}
