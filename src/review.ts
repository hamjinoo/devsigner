/**
 * Standalone review entry point for the GitHub Action.
 * Exports core design-review functions without starting the MCP server.
 */
export { parseCode } from "./parsers/index.js";
export { runDesignRules, calculateScore } from "./rules/index.js";
export type { FocusArea } from "./rules/index.js";
export type { DesignIssue, Severity, Category } from "./rules/types.js";
export type { ParsedStyles } from "./parsers/index.js";
export type { StyleDeclaration, StyleBlock } from "./parsers/css-extractor.js";
