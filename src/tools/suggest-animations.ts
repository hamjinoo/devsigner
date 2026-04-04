import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// --- Intensity presets ---

interface IntensityPreset {
  durationShort: string;
  durationMed: string;
  durationLong: string;
  easing: string;
  easingBounce: string;
  transformScale: string;
  transformLift: string;
  opacityStart: string;
  shadowBoost: boolean;
  colorShift: boolean;
}

const INTENSITY_PRESETS: Record<string, IntensityPreset> = {
  subtle: {
    durationShort: "150ms",
    durationMed: "175ms",
    durationLong: "200ms",
    easing: "ease-out",
    easingBounce: "ease-out",
    transformScale: "1.02",
    transformLift: "-2px",
    opacityStart: "0",
    shadowBoost: false,
    colorShift: false,
  },
  moderate: {
    durationShort: "200ms",
    durationMed: "250ms",
    durationLong: "300ms",
    easing: "ease",
    easingBounce: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    transformScale: "1.03",
    transformLift: "-4px",
    opacityStart: "0",
    shadowBoost: true,
    colorShift: false,
  },
  expressive: {
    durationShort: "300ms",
    durationMed: "400ms",
    durationLong: "500ms",
    easing: "ease",
    easingBounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    transformScale: "1.05",
    transformLift: "-8px",
    opacityStart: "0",
    shadowBoost: true,
    colorShift: true,
  },
};

// --- Element detection ---

interface DetectedElement {
  type: string;
  label: string;
  matchSnippet: string;
  lineNumber: number;
}

function detectElements(code: string): DetectedElement[] {
  const elements: DetectedElement[] = [];
  const lines = code.split("\n");

  const patterns: { type: string; label: string; regex: RegExp }[] = [
    { type: "button", label: "Button", regex: /<button\b|role=["']button["']/i },
    { type: "card", label: "Card", regex: /class(?:Name)?=["'][^"']*\bcard\b/i },
    { type: "link", label: "Link/Navigation", regex: /<a\s|<Link\b/i },
    { type: "modal", label: "Modal/Dialog", regex: /modal|dialog/i },
    { type: "list", label: "List/Grid", regex: /<ul\b|<ol\b|class(?:Name)?=["'][^"']*\bgrid\b/i },
    { type: "input", label: "Input", regex: /<input\b|<textarea\b|<select\b/i },
    { type: "image", label: "Image", regex: /<img\b/i },
    { type: "section", label: "Section", regex: /<section\b|<main\b|class(?:Name)?=["'][^"']*\bsection\b/i },
    { type: "tabs", label: "Tabs/Toggle", regex: /tab|toggle|switch/i },
    { type: "toast", label: "Toast/Notification", regex: /toast|notification|alert|snackbar/i },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of patterns) {
      if (pat.regex.test(line)) {
        // Avoid duplicate types on the same line
        if (!elements.find((e) => e.type === pat.type && e.lineNumber === i + 1)) {
          elements.push({
            type: pat.type,
            label: pat.label,
            matchSnippet: line.trim().slice(0, 120),
            lineNumber: i + 1,
          });
        }
      }
    }
  }

  return elements;
}

// --- Animation suggestion generators ---

interface AnimationSuggestion {
  element: string;
  lineNumber: number;
  matchSnippet: string;
  animation: string;
  description: string;
  css: string;
  tailwind: string;
  timing: string;
}

function suggestButton(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  const suggestions: AnimationSuggestion[] = [];

  // Hover scale + shadow
  suggestions.push({
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Hover scale + shadow",
    description: "Subtle lift and shadow on hover to indicate interactivity.",
    css: `/* Button hover animation */
.btn {
  transition: transform ${preset.durationShort} ${preset.easing},
              box-shadow ${preset.durationShort} ${preset.easing};
}
.btn:hover {
  transform: scale(${preset.transformScale});${preset.shadowBoost ? `\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);` : ""}
}`,
    tailwind: `transition-all duration-${parseInt(preset.durationShort)} hover:scale-[${preset.transformScale}]${preset.shadowBoost ? " hover:shadow-lg" : ""}`,
    timing: `Duration: ${preset.durationShort}, Easing: ${preset.easing}`,
  });

  // Click feedback
  suggestions.push({
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Click feedback (press down)",
    description: "Brief scale-down on active state to give tactile feedback.",
    css: `/* Button click feedback */
.btn {
  transition: transform ${preset.durationShort} ${preset.easing};
}
.btn:active {
  transform: scale(0.97);
}`,
    tailwind: `transition-transform duration-${parseInt(preset.durationShort)} active:scale-[0.97]`,
    timing: `Duration: ${preset.durationShort}, Easing: ${preset.easing}`,
  });

  // Loading spinner state
  suggestions.push({
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Loading state spinner",
    description: "Replace button text with a spinner during async operations.",
    css: `/* Button loading state */
@keyframes btn-spin {
  to { transform: rotate(360deg); }
}
.btn--loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}
.btn--loading::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin: -8px 0 0 -8px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 600ms linear infinite;
  color: inherit;
  opacity: 0.7;
}`,
    tailwind: `/* Add 'animate-spin' on a nested spinner element when loading */`,
    timing: `Spinner: 600ms linear infinite`,
  });

  return suggestions;
}

function suggestCard(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  const suggestions: AnimationSuggestion[] = [];

  suggestions.push({
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Hover lift",
    description: "Card lifts up with increased shadow on hover, suggesting interactivity.",
    css: `/* Card hover lift */
.card {
  transition: transform ${preset.durationMed} ${preset.easing},
              box-shadow ${preset.durationMed} ${preset.easing};
}
.card:hover {
  transform: translateY(${preset.transformLift});${preset.shadowBoost ? `\n  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);` : ""}
}`,
    tailwind: `transition-all duration-${parseInt(preset.durationMed)} hover:-translate-y-1${preset.shadowBoost ? " hover:shadow-xl" : ""}`,
    timing: `Duration: ${preset.durationMed}, Easing: ${preset.easing}`,
  });

  suggestions.push({
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Focus ring",
    description: "Visible ring on keyboard focus for accessibility and polish.",
    css: `/* Card focus ring */
.card {
  transition: box-shadow ${preset.durationShort} ${preset.easing};
  outline: none;
}
.card:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}`,
    tailwind: `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none transition-shadow duration-${parseInt(preset.durationShort)}`,
    timing: `Duration: ${preset.durationShort}, Easing: ${preset.easing}`,
  });

  return suggestions;
}

function suggestLink(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  return [{
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Underline slide-in on hover",
    description: "Animated underline that slides in from left on hover.",
    css: `/* Link underline slide-in */
.link {
  position: relative;
  text-decoration: none;
}
.link::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width ${preset.durationMed} ${preset.easing};
}
.link:hover::after {
  width: 100%;
}`,
    tailwind: `relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-${parseInt(preset.durationMed)} hover:after:w-full`,
    timing: `Duration: ${preset.durationMed}, Easing: ${preset.easing}`,
  }];
}

function suggestModal(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  const suggestions: AnimationSuggestion[] = [];

  suggestions.push({
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Fade-in + scale-up entry",
    description: "Modal fades in while scaling up from 95% for a smooth, focused entrance.",
    css: `/* Modal entry animation */
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes overlay-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-overlay {
  animation: overlay-enter ${preset.durationMed} ${preset.easing};
}
.modal-content {
  animation: modal-enter ${preset.durationMed} ${preset.easingBounce};
}`,
    tailwind: `animate-in fade-in-0 zoom-in-95 duration-${parseInt(preset.durationMed)}`,
    timing: `Duration: ${preset.durationMed}, Easing: ${preset.easingBounce}`,
  });

  suggestions.push({
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Fade-out exit",
    description: "Modal fades out and scales down slightly on close.",
    css: `/* Modal exit animation */
@keyframes modal-exit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
.modal-content--closing {
  animation: modal-exit ${preset.durationShort} ${preset.easing} forwards;
}`,
    tailwind: `animate-out fade-out-0 zoom-out-95 duration-${parseInt(preset.durationShort)}`,
    timing: `Duration: ${preset.durationShort}, Easing: ${preset.easing}`,
  });

  return suggestions;
}

function suggestList(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  return [{
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Staggered fade-in on mount",
    description: "Each list/grid item fades in sequentially for a polished load experience.",
    css: `/* Staggered list fade-in */
@keyframes list-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.list-item {
  opacity: 0;
  animation: list-fade-in ${preset.durationMed} ${preset.easing} forwards;
}
/* Apply stagger via inline style or nth-child */
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
.list-item:nth-child(4) { animation-delay: 150ms; }
.list-item:nth-child(5) { animation-delay: 200ms; }
/* ...or use JS: style={{ animationDelay: \`\${index * 50}ms\` }} */`,
    tailwind: `animate-in fade-in-0 slide-in-from-bottom-2 duration-${parseInt(preset.durationMed)} fill-mode-forwards
/* Per-item: style={{ animationDelay: \`\${index * 50}ms\` }} */`,
    timing: `Duration: ${preset.durationMed}, Stagger: 50ms per item, Easing: ${preset.easing}`,
  }];
}

function suggestInput(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  const suggestions: AnimationSuggestion[] = [];

  suggestions.push({
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Focus border transition",
    description: "Smooth border color change on focus to guide the user's eye.",
    css: `/* Input focus border transition */
.input {
  border: 1px solid #d1d5db;
  transition: border-color ${preset.durationShort} ${preset.easing},
              box-shadow ${preset.durationShort} ${preset.easing};
  outline: none;
}
.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}`,
    tailwind: `border border-gray-300 transition-all duration-${parseInt(preset.durationShort)} outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`,
    timing: `Duration: ${preset.durationShort}, Easing: ${preset.easing}`,
  });

  suggestions.push({
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Floating label",
    description: "Label floats above the input on focus/fill, saving space and looking polished.",
    css: `/* Floating label */
.input-group {
  position: relative;
}
.input-group label {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #9ca3af;
  pointer-events: none;
  transition: all ${preset.durationMed} ${preset.easing};
  background: white;
  padding: 0 4px;
}
.input-group input:focus ~ label,
.input-group input:not(:placeholder-shown) ~ label {
  top: 0;
  font-size: 12px;
  color: #3b82f6;
}`,
    tailwind: `/* Use peer utilities: peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 transition-all duration-${parseInt(preset.durationMed)} */`,
    timing: `Duration: ${preset.durationMed}, Easing: ${preset.easing}`,
  });

  return suggestions;
}

function suggestImage(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  return [{
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Lazy-load fade-in",
    description: "Image fades in when loaded to avoid the jarring pop-in effect.",
    css: `/* Image lazy-load fade-in */
.img-lazy {
  opacity: 0;
  transition: opacity ${preset.durationLong} ${preset.easing};
}
.img-lazy.loaded {
  opacity: 1;
}
/* JS: img.onload = () => img.classList.add('loaded') */`,
    tailwind: `opacity-0 transition-opacity duration-${parseInt(preset.durationLong)} [&.loaded]:opacity-100
/* JS: onLoad={(e) => e.currentTarget.classList.add('loaded')} */`,
    timing: `Duration: ${preset.durationLong}, Easing: ${preset.easing}`,
  }];
}

function suggestSection(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  return [{
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Scroll-triggered fade-in-up",
    description: "Section content fades in and slides up when scrolled into view.",
    css: `/* Scroll-triggered fade-in-up */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.section-reveal {
  opacity: 0;
}
.section-reveal.visible {
  animation: fade-in-up ${preset.durationLong} ${preset.easing} forwards;
}
/* JS: Use IntersectionObserver to add 'visible' class */
/*
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.section-reveal').forEach(el => observer.observe(el));
*/`,
    tailwind: `opacity-0 translate-y-5 transition-all duration-${parseInt(preset.durationLong)}
/* When visible: opacity-100 translate-y-0 */
/* Use IntersectionObserver or framer-motion whileInView */`,
    timing: `Duration: ${preset.durationLong}, Easing: ${preset.easing}, Trigger: scroll into view (threshold 10%)`,
  }];
}

function suggestTabs(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  return [{
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Slide transition between states",
    description: "Active indicator slides smoothly between tabs; content cross-fades.",
    css: `/* Tab indicator slide */
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: #3b82f6;
  transition: left ${preset.durationMed} ${preset.easingBounce},
              width ${preset.durationMed} ${preset.easingBounce};
}

/* Tab content cross-fade */
.tab-panel {
  animation: tab-fade-in ${preset.durationMed} ${preset.easing};
}
@keyframes tab-fade-in {
  from { opacity: 0; transform: translateX(8px); }
  to { opacity: 1; transform: translateX(0); }
}`,
    tailwind: `transition-all duration-${parseInt(preset.durationMed)}
/* Indicator: use absolute positioning + left/width transitions */
/* Panel: animate-in fade-in-0 slide-in-from-right-2 */`,
    timing: `Duration: ${preset.durationMed}, Easing: ${preset.easingBounce}`,
  }];
}

function suggestToast(el: DetectedElement, preset: IntensityPreset): AnimationSuggestion[] {
  return [{
    element: el.label,
    lineNumber: el.lineNumber,
    matchSnippet: el.matchSnippet,
    animation: "Slide-in from edge + auto-dismiss",
    description: "Toast slides in from the right edge, then auto-dismisses with a fade-out.",
    css: `/* Toast slide-in + auto-dismiss */
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
.toast {
  animation: toast-in ${preset.durationMed} ${preset.easingBounce};
}
.toast--dismissing {
  animation: toast-out ${preset.durationShort} ${preset.easing} forwards;
}
/* Auto-dismiss: setTimeout(() => el.classList.add('toast--dismissing'), 4000) */`,
    tailwind: `animate-in slide-in-from-right-full fade-in-0 duration-${parseInt(preset.durationMed)}
/* On dismiss: animate-out slide-out-to-right-full fade-out-0 */`,
    timing: `Entry: ${preset.durationMed} ${preset.easingBounce}, Exit: ${preset.durationShort} ${preset.easing}, Auto-dismiss: 4s delay`,
  }];
}

// --- Framework detection ---

function detectFramework(code: string): string {
  if (/import\s.*\bfrom\s+['"]react['"]|import\s.*\bfrom\s+['"]next/i.test(code)) return "react";
  if (/import\s.*\bfrom\s+['"]vue['"]|<template>/i.test(code)) return "vue";
  if (/<script\b[^>]*\blang=["']ts["'][^>]*>|export\s+let\s|{\s*#each/i.test(code) && /<\/script>/.test(code)) return "svelte";
  return "html";
}

// --- Main suggestion engine ---

function generateSuggestions(code: string, intensity: string): AnimationSuggestion[] {
  const preset = INTENSITY_PRESETS[intensity] || INTENSITY_PRESETS.moderate;
  const elements = detectElements(code);
  const suggestions: AnimationSuggestion[] = [];

  const generators: Record<string, (el: DetectedElement, p: IntensityPreset) => AnimationSuggestion[]> = {
    button: suggestButton,
    card: suggestCard,
    link: suggestLink,
    modal: suggestModal,
    list: suggestList,
    input: suggestInput,
    image: suggestImage,
    section: suggestSection,
    tabs: suggestTabs,
    toast: suggestToast,
  };

  for (const el of elements) {
    const gen = generators[el.type];
    if (gen) {
      suggestions.push(...gen(el, preset));
    }
  }

  return suggestions;
}

function formatOutput(
  suggestions: AnimationSuggestion[],
  framework: string,
  intensity: string,
  code: string,
): string {
  if (suggestions.length === 0) {
    return [
      "# Animation Suggestions",
      "",
      "No animatable UI elements were detected in the provided code.",
      "",
      "**Tip:** This tool looks for `<button`, `<a`, `<input`, `<img`, `<ul`, `<ol`,",
      "`<section`, and className patterns like `card`, `modal`, `dialog`, `toast`, `tab`, `toggle`, etc.",
      "",
      "Try providing code that contains interactive UI elements.",
    ].join("\n");
  }

  const lines: string[] = [
    `# Animation Suggestions`,
    ``,
    `**Framework detected:** ${framework}`,
    `**Intensity:** ${intensity}`,
    `**Elements found:** ${new Set(suggestions.map((s) => s.element)).size}`,
    `**Suggestions:** ${suggestions.length}`,
    ``,
    `---`,
    ``,
  ];

  // Group by element type
  const grouped = new Map<string, AnimationSuggestion[]>();
  for (const s of suggestions) {
    const key = `${s.element} (line ${s.lineNumber})`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  for (const [elementKey, group] of grouped) {
    lines.push(`## ${elementKey}`);
    lines.push(`> \`${group[0].matchSnippet}\``);
    lines.push(``);

    for (const s of group) {
      lines.push(`### ${s.animation}`);
      lines.push(``);
      lines.push(s.description);
      lines.push(``);
      lines.push(`**Timing:** ${s.timing}`);
      lines.push(``);
      lines.push(`#### CSS`);
      lines.push("```css");
      lines.push(s.css);
      lines.push("```");
      lines.push(``);
      lines.push(`#### Tailwind`);
      lines.push("```");
      lines.push(s.tailwind);
      lines.push("```");
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(``);
  }

  // Summary section
  lines.push(`## Quick-Start: All Transitions in One Block`);
  lines.push(``);
  lines.push(`Add this to your global CSS for a quick animation foundation:`);
  lines.push(``);
  lines.push("```css");
  lines.push(`/* Base transition utilities */`);

  const preset = INTENSITY_PRESETS[intensity] || INTENSITY_PRESETS.moderate;
  lines.push(`button, [role="button"] {`);
  lines.push(`  transition: transform ${preset.durationShort} ${preset.easing}, box-shadow ${preset.durationShort} ${preset.easing};`);
  lines.push(`}`);
  lines.push(`a {`);
  lines.push(`  transition: color ${preset.durationShort} ${preset.easing};`);
  lines.push(`}`);
  lines.push(`input, textarea, select {`);
  lines.push(`  transition: border-color ${preset.durationShort} ${preset.easing}, box-shadow ${preset.durationShort} ${preset.easing};`);
  lines.push(`}`);
  lines.push(`img {`);
  lines.push(`  transition: opacity ${preset.durationLong} ${preset.easing};`);
  lines.push(`}`);
  lines.push("```");

  return lines.join("\n");
}

// --- Register tool ---

export function registerSuggestAnimations(server: McpServer): void {
  server.tool(
    "suggest_animations",
    "Analyze UI code and suggest specific micro-interactions and animations with copy-pasteable CSS and Tailwind classes. Detects buttons, cards, links, modals, lists, inputs, images, sections, tabs, and toasts — then recommends hover effects, transitions, scroll reveals, and loading states at your chosen intensity level.",
    {
      code: z.string().describe("The UI code to analyze for animation opportunities"),
      framework: z
        .enum(["react", "vue", "svelte", "html", "auto"])
        .default("auto")
        .describe("UI framework (auto-detected if not specified)"),
      intensity: z
        .enum(["subtle", "moderate", "expressive"])
        .default("moderate")
        .describe("Animation intensity: subtle (150-200ms, small), moderate (200-300ms, balanced), expressive (300-500ms, spring/bounce)"),
    },
    async ({ code, framework, intensity }) => {
      const detectedFramework = framework === "auto" ? detectFramework(code) : framework;
      const suggestions = generateSuggestions(code, intensity);
      const output = formatOutput(suggestions, detectedFramework, intensity, code);

      return {
        content: [{ type: "text" as const, text: output }],
      };
    },
  );
}
