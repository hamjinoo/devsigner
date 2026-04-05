import puppeteer from "puppeteer-core";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore } from "../rules/index.js";
import { applyFixes, type FixResult, type FixLevel } from "../tools/design-fix.js";
import { findChrome, wrapInHTML } from "../tools/render-and-review.js";
import type { DesignIssue } from "../rules/types.js";

export interface TransformResult {
  beforeScreenshot: string; // base64 PNG
  afterScreenshot: string;  // base64 PNG
  scoreBefore: number;
  scoreAfter: number;
  issuesBefore: DesignIssue[];
  issuesAfter: DesignIssue[];
  fixes: FixResult[];
  fixedCode: string;
}

export async function transformAndRender(
  code: string,
  options: {
    fixLevel?: FixLevel;
    viewportWidth?: number;
    viewportHeight?: number;
  } = {},
): Promise<TransformResult> {
  const {
    fixLevel = "moderate",
    viewportWidth = 1280,
    viewportHeight = 800,
  } = options;

  // 1. Analyze before
  const parsedBefore = parseCode(code, "auto");
  const issuesBefore = runDesignRules(parsedBefore.declarations, ["all"], parsedBefore.blocks);
  const scoreBefore = calculateScore(issuesBefore);

  // 2. Apply fixes
  const { fixedCode, fixes } = applyFixes(code, fixLevel);

  // 3. Analyze after
  const parsedAfter = parseCode(fixedCode, "auto");
  const issuesAfter = runDesignRules(parsedAfter.declarations, ["all"], parsedAfter.blocks);
  const scoreAfter = calculateScore(issuesAfter);

  // 4. Render both
  const chromePath = await findChrome();
  if (!chromePath) {
    throw new Error("Chrome/Edge not found. Install Chrome or Edge to use visual preview.");
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const viewport = { width: viewportWidth, height: viewportHeight };

    const page = await browser.newPage();
    await page.setViewport(viewport);

    // Render before
    const beforeHTML = wrapInHTML(code, viewport);
    await page.setContent(beforeHTML, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 300));
    const beforeScreenshot = (await page.screenshot({ type: "png", encoding: "base64" })) as string;

    // Render after
    const afterHTML = wrapInHTML(fixedCode, viewport);
    await page.setContent(afterHTML, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 300));
    const afterScreenshot = (await page.screenshot({ type: "png", encoding: "base64" })) as string;

    await page.close();

    return {
      beforeScreenshot,
      afterScreenshot,
      scoreBefore,
      scoreAfter,
      issuesBefore,
      issuesAfter,
      fixes,
      fixedCode,
    };
  } finally {
    await browser.close();
  }
}
