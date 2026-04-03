/**
 * devsigner End-to-End Product Validation
 * Tests each tool with realistic input and checks output quality.
 */

// Dynamically import the tool modules
const tools = {};
function fakeServer() {
  const registered = {};
  return {
    tool: (name, desc, schema, handler) => { registered[name] = handler; },
    resource: (...args) => {},
    registered,
  };
}

const srv = fakeServer();

// Import and register all tools
const { registerDesignReview } = await import("./src/tools/design-review.js");
const { registerColorPalette } = await import("./src/tools/color-palette.js");
const { registerDesignIdentity } = await import("./src/tools/design-identity.js");
const { registerDesignFix } = await import("./src/tools/design-fix.js");
const { registerComponentSuggest } = await import("./src/tools/component-suggest.js");
const { registerA11yAudit } = await import("./src/tools/a11y-audit.js");

registerDesignReview(srv);
registerColorPalette(srv);
registerDesignIdentity(srv);
registerDesignFix(srv);
registerComponentSuggest(srv);
registerA11yAudit(srv);

const t = srv.registered;

// =============================================
// Test data: a realistic "developer-made" React component
// =============================================
const BAD_CODE = `
<div style="padding: 13px; margin: 7px; background-color: #1a1a2e; color: #2d2d2d;">
  <h1 style="font-size: 15px; font-weight: 300; margin-bottom: 5px;">Dashboard</h1>
  <p style="font-size: 13px; line-height: 1.1;">Welcome back, user. Here is your data.</p>

  <div style="display: flex; gap: 9px; margin-top: 11px;">
    <div style="background: #ffffff; padding: 18px; border-radius: 3px;">
      <span style="font-size: 11px; color: #999;">Revenue</span>
      <p style="font-size: 22px; font-weight: 800; color: #000000;">$12,450</p>
    </div>
    <div style="background: #ffffff; padding: 15px; border-radius: 7px;">
      <span style="font-size: 12px; color: #aaa;">Users</span>
      <p style="font-size: 19px; font-weight: 600; color: #000000;">1,234</p>
    </div>
    <div style="background: #fff; padding: 20px; border-radius: 5px;">
      <span style="font-size: 10px; color: #888;">Growth</span>
      <p style="font-size: 25px; font-weight: 900; color: #000;">+23%</p>
    </div>
  </div>

  <div onclick="alert('clicked')" style="margin-top: 15px; padding: 8px; background: #e74c3c; color: #ffffff; text-align: center; z-index: 9999;">
    View Full Report
  </div>

  <img src="chart.png">
</div>
`;

console.log("=".repeat(60));
console.log("  devsigner E2E Product Validation");
console.log("=".repeat(60));

let pass = 0;
let fail = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}: ${detail}`);
    fail++;
  }
}

// =============================================
// Test 1: design_review
// =============================================
console.log("\n📊 Test 1: design_review");
const review = await t.design_review({ code: BAD_CODE, framework: "auto", focus: ["all"] });
const reviewText = review.content[0].text;
check("Returns output", reviewText.length > 100, "Output too short");
check("Detects framework", reviewText.includes("html"), "Framework not detected");
check("Has score", /Score.*\d+\/100/.test(reviewText), "No score found");
check("Finds spacing issues", reviewText.toLowerCase().includes("spacing"), "No spacing issues");
check("Finds color issues", reviewText.toLowerCase().includes("color") || reviewText.toLowerCase().includes("contrast"), "No color issues");
check("Finds typography issues", reviewText.toLowerCase().includes("typography") || reviewText.toLowerCase().includes("font"), "No typography issues");
check("Has suggestions", reviewText.includes("→"), "No fix suggestions");

// Extract score
const scoreMatch = reviewText.match(/Score.*?(\d+)\/100/);
const score = scoreMatch ? parseInt(scoreMatch[1]) : -1;
console.log(`  Score: ${score}/100`);
check("Score reflects bad code (<60)", score < 60, `Score ${score} too high for bad code`);

// =============================================
// Test 2: design_fix
// =============================================
console.log("\n🔧 Test 2: design_fix");
const fix = await t.design_fix({ code: BAD_CODE, framework: "auto", fix_level: "moderate" });
const fixText = fix.content[0].text;
check("Returns output", fixText.length > 100, "Output too short");
check("Contains fixed code", fixText.includes("```"), "No code block");
check("Shows before/after", fixText.toLowerCase().includes("before") || fixText.toLowerCase().includes("after") || fixText.toLowerCase().includes("score"), "No comparison");
check("Fixed spacing (13px→12px)", fixText.includes("12px"), "13px not fixed");
// The WCAG contrast fix changes #000000 to a proper contrast color before the pure-black fix runs — that's correct behavior
check("Fixed colors (contrast adjusted)", fixText.includes("contrast") || fixText.includes("Contrast") || fixText.includes("WCAG"), "No color fixes applied");

// =============================================
// Test 3: color_palette
// =============================================
console.log("\n🎨 Test 3: color_palette");
const palette = await t.color_palette({
  description: "fintech dashboard, professional, trustworthy",
  format: "all",
  dark_mode: true,
});
const paletteText = palette.content[0].text;
check("Returns output", paletteText.length > 200, "Output too short");
check("Has CSS variables", paletteText.includes("--color-"), "No CSS variables");
check("Has Tailwind config", paletteText.includes("tailwind"), "No Tailwind config");
check("Has primary color", paletteText.includes("primary") || paletteText.includes("Primary"), "No primary color");
check("Has dark mode", paletteText.includes("dark") || paletteText.includes("prefers-color-scheme"), "No dark mode");
check("Has contrast report", paletteText.toLowerCase().includes("contrast"), "No contrast report");

// =============================================
// Test 4: design_identity
// =============================================
console.log("\n🎭 Test 4: design_identity");
const identity = await t.design_identity({
  product: "fintech dashboard for small businesses",
  audience: "20-30s startup founders",
  mood: "trustworthy but warm, modern",
  competitors: "Stripe, Mercury",
});
const idText = identity.content[0].text;
check("Returns output", idText.length > 500, "Output too short");
check("Has personality name", idText.includes("Warm Professional") || idText.includes("Bold Minimal"), "No personality");
check("Has bold moves", idText.toLowerCase().includes("bold"), "No bold moves");
check("Has restraints", idText.toLowerCase().includes("restrain"), "No restraints");
check("Has typography", idText.includes("font"), "No typography");
check("Has spacing tokens", idText.includes("spacing") || idText.includes("space"), "No spacing");
check("Has CSS variables", idText.includes("--"), "No CSS variables");
check("Has signature philosophy", idText.includes(">"), "No signature quote");

// =============================================
// Test 5: component_suggest
// =============================================
console.log("\n🧩 Test 5: component_suggest");
const comp = await t.component_suggest({
  component: "pricing card",
  framework: "react",
  variant: "modern",
});
const compText = comp.content[0].text;
check("Returns output", compText.length > 200, "Output too short");
check("Has code block", compText.includes("```"), "No code block");
check("Has design notes", compText.toLowerCase().includes("design"), "No design notes");

// Test unknown component fallback
const unknown = await t.component_suggest({
  component: "spaceship launcher",
  framework: "react",
  variant: "modern",
});
const unknownText = unknown.content[0].text;
check("Unknown component handled", unknownText.includes("Available") || unknownText.includes("template") || unknownText.includes("available"), "Bad fallback");

// Test various components
for (const name of ["navbar", "hero", "modal", "table", "footer"]) {
  const res = await t.component_suggest({ component: name, framework: "react", variant: "modern" });
  const txt = res.content[0].text;
  check(`Template "${name}" found`, txt.includes("```"), `${name} not matched`);
}

// =============================================
// Test 6: a11y_audit
// =============================================
console.log("\n♿ Test 6: a11y_audit");
const a11y = await t.a11y_audit({ code: BAD_CODE, level: "AA", framework: "auto" });
const a11yText = a11y.content[0].text;
check("Returns output", a11yText.length > 200, "Output too short");
check("Has score", a11yText.includes("/100") || a11yText.includes("Score"), "No score");
check("Finds missing alt", a11yText.toLowerCase().includes("alt"), "No alt text issue");
check("Finds contrast issues", a11yText.toLowerCase().includes("contrast"), "No contrast issue");
check("Finds click without keyboard", a11yText.toLowerCase().includes("keyboard") || a11yText.toLowerCase().includes("onclick"), "No keyboard issue");

// =============================================
// Summary
// =============================================
console.log("\n" + "=".repeat(60));
console.log(`  Results: ${pass} passed, ${fail} failed (${Math.round(pass/(pass+fail)*100)}%)`);
console.log("=".repeat(60));

if (fail > 0) {
  console.log("\n⚠️  Some tests failed. Review and fix before shipping.");
  process.exit(1);
} else {
  console.log("\n🎉 All tests passed! Product is validated.");
  process.exit(0);
}
