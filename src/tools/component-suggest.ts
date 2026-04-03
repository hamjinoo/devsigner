import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface DesignTokenSet {
  borderRadius: string;
  shadow: string;
  spacing: { sm: string; md: string; lg: string; xl: string };
}

const VARIANT_TOKENS: Record<string, DesignTokenSet> = {
  minimal: {
    borderRadius: "0.375rem",
    shadow: "none",
    spacing: { sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem" },
  },
  modern: {
    borderRadius: "0.75rem",
    shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    spacing: { sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
  },
  corporate: {
    borderRadius: "0.25rem",
    shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    spacing: { sm: "0.5rem", md: "1rem", lg: "2rem", xl: "3rem" },
  },
  playful: {
    borderRadius: "1rem",
    shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    spacing: { sm: "0.75rem", md: "1.25rem", lg: "2rem", xl: "3rem" },
  },
};

const TEMPLATES: Record<string, Record<string, string>> = {
  "pricing-card": {
    react: `interface PricingCardProps {
  plan: string;
  price: string;
  period?: string;
  features: string[];
  cta?: string;
  highlighted?: boolean;
}

export function PricingCard({
  plan,
  price,
  period = "/month",
  features,
  cta = "Get Started",
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      style={{
        borderRadius: "{{borderRadius}}",
        boxShadow: "{{shadow}}",
        padding: "{{spacing.xl}}",
        border: highlighted ? "2px solid #3b82f6" : "1px solid #e5e7eb",
        backgroundColor: highlighted ? "#eff6ff" : "#ffffff",
        maxWidth: "360px",
        display: "flex",
        flexDirection: "column",
        gap: "{{spacing.lg}}",
      }}
    >
      <div>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {plan}
        </p>
        <p style={{ fontSize: "2.25rem", fontWeight: 700, color: "#111827", marginTop: "{{spacing.sm}}" }}>
          {price}<span style={{ fontSize: "1rem", fontWeight: 400, color: "#6b7280" }}>{period}</span>
        </p>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "{{spacing.sm}}" }}>
        {features.map((feature, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#374151" }}>
            <span style={{ color: "#10b981" }}>✓</span> {feature}
          </li>
        ))}
      </ul>
      <button
        style={{
          width: "100%",
          padding: "{{spacing.sm}} {{spacing.md}}",
          borderRadius: "{{borderRadius}}",
          border: "none",
          backgroundColor: highlighted ? "#3b82f6" : "#111827",
          color: "#ffffff",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {cta}
      </button>
    </div>
  );
}`,
    vue: `<script setup lang="ts">
defineProps<{
  plan: string;
  price: string;
  period?: string;
  features: string[];
  cta?: string;
  highlighted?: boolean;
}>();
</script>

<template>
  <div :class="['pricing-card', { highlighted }]">
    <div class="header">
      <p class="plan-name">{{ plan }}</p>
      <p class="price">{{ price }}<span class="period">{{ period || '/month' }}</span></p>
    </div>
    <ul class="features">
      <li v-for="(feature, i) in features" :key="i">
        <span class="check">✓</span> {{ feature }}
      </li>
    </ul>
    <button class="cta">{{ cta || 'Get Started' }}</button>
  </div>
</template>

<style scoped>
.pricing-card {
  border-radius: {{borderRadius}};
  box-shadow: {{shadow}};
  padding: {{spacing.xl}};
  border: 1px solid #e5e7eb;
  background: #ffffff;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: {{spacing.lg}};
}
.pricing-card.highlighted {
  border: 2px solid #3b82f6;
  background: #eff6ff;
}
.plan-name { font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
.price { font-size: 2.25rem; font-weight: 700; color: #111827; margin-top: {{spacing.sm}}; }
.period { font-size: 1rem; font-weight: 400; color: #6b7280; }
.features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: {{spacing.sm}}; }
.features li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; }
.check { color: #10b981; }
.cta {
  width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}};
  border: none; background: #111827; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer;
}
.highlighted .cta { background: #3b82f6; }
</style>`,
    html: `<div class="pricing-card">
  <div class="header">
    <p class="plan-name">Pro</p>
    <p class="price">$29<span class="period">/month</span></p>
  </div>
  <ul class="features">
    <li><span class="check">✓</span> Feature one</li>
    <li><span class="check">✓</span> Feature two</li>
    <li><span class="check">✓</span> Feature three</li>
  </ul>
  <button class="cta">Get Started</button>
</div>

<style>
.pricing-card {
  border-radius: {{borderRadius}};
  box-shadow: {{shadow}};
  padding: {{spacing.xl}};
  border: 1px solid #e5e7eb;
  background: #ffffff;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: {{spacing.lg}};
  font-family: system-ui, -apple-system, sans-serif;
}
.plan-name { font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
.price { font-size: 2.25rem; font-weight: 700; color: #111827; margin: {{spacing.sm}} 0 0; }
.period { font-size: 1rem; font-weight: 400; color: #6b7280; }
.features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: {{spacing.sm}}; }
.features li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; }
.check { color: #10b981; }
.cta {
  width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}};
  border: none; background: #111827; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer;
}
</style>`,
    svelte: `<script lang="ts">
  export let plan: string;
  export let price: string;
  export let period = "/month";
  export let features: string[] = [];
  export let cta = "Get Started";
  export let highlighted = false;
</script>

<div class="pricing-card" class:highlighted>
  <div class="header">
    <p class="plan-name">{plan}</p>
    <p class="price">{price}<span class="period">{period}</span></p>
  </div>
  <ul class="features">
    {#each features as feature}
      <li><span class="check">✓</span> {feature}</li>
    {/each}
  </ul>
  <button class="cta">{cta}</button>
</div>

<style>
.pricing-card {
  border-radius: {{borderRadius}};
  box-shadow: {{shadow}};
  padding: {{spacing.xl}};
  border: 1px solid #e5e7eb;
  background: #ffffff;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: {{spacing.lg}};
}
.highlighted { border: 2px solid #3b82f6; background: #eff6ff; }
.plan-name { font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
.price { font-size: 2.25rem; font-weight: 700; color: #111827; margin-top: {{spacing.sm}}; }
.period { font-size: 1rem; font-weight: 400; color: #6b7280; }
.features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: {{spacing.sm}}; }
.features li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; }
.check { color: #10b981; }
.cta {
  width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}};
  border: none; background: #111827; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer;
}
.highlighted .cta { background: #3b82f6; }
</style>`,
  },
  "login-form": {
    react: `export function LoginForm() {
  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "{{spacing.xl}}" }}>
      <div style={{ textAlign: "center", marginBottom: "{{spacing.xl}}" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Welcome back</h1>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "{{spacing.sm}}" }}>Sign in to your account</p>
      </div>
      <form style={{ display: "flex", flexDirection: "column", gap: "{{spacing.md}}" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "{{spacing.sm}}" }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            style={{
              width: "100%", padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
              border: "1px solid #d1d5db", fontSize: "0.875rem", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "{{spacing.sm}}" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            style={{
              width: "100%", padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
              border: "1px solid #d1d5db", fontSize: "0.875rem", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#374151" }}>
            <input type="checkbox" /> Remember me
          </label>
          <a href="#" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}>Forgot password?</a>
        </div>
        <button
          type="submit"
          style={{
            width: "100%", padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
            border: "none", backgroundColor: "#111827", color: "#ffffff",
            fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </form>
    </div>
  );
}`,
    vue: `<template>
  <div class="login-container">
    <div class="header">
      <h1>Welcome back</h1>
      <p>Sign in to your account</p>
    </div>
    <form class="form" @submit.prevent>
      <div class="field">
        <label>Email</label>
        <input type="email" placeholder="you@example.com" />
      </div>
      <div class="field">
        <label>Password</label>
        <input type="password" placeholder="••••••••" />
      </div>
      <div class="options">
        <label class="remember"><input type="checkbox" /> Remember me</label>
        <a href="#">Forgot password?</a>
      </div>
      <button type="submit">Sign in</button>
    </form>
  </div>
</template>

<style scoped>
.login-container { max-width: 400px; margin: 0 auto; padding: {{spacing.xl}}; }
.header { text-align: center; margin-bottom: {{spacing.xl}}; }
.header h1 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.header p { font-size: 0.875rem; color: #6b7280; margin-top: {{spacing.sm}}; }
.form { display: flex; flex-direction: column; gap: {{spacing.md}}; }
.field label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: {{spacing.sm}}; }
.field input { width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}}; border: 1px solid #d1d5db; font-size: 0.875rem; box-sizing: border-box; }
.options { display: flex; justify-content: space-between; align-items: center; }
.remember { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; }
.options a { font-size: 0.875rem; color: #3b82f6; text-decoration: none; }
button { width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}}; border: none; background: #111827; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
</style>`,
    html: `<div class="login-container">
  <div class="header">
    <h1>Welcome back</h1>
    <p>Sign in to your account</p>
  </div>
  <form class="form">
    <div class="field">
      <label>Email</label>
      <input type="email" placeholder="you@example.com" />
    </div>
    <div class="field">
      <label>Password</label>
      <input type="password" placeholder="••••••••" />
    </div>
    <div class="options">
      <label class="remember"><input type="checkbox" /> Remember me</label>
      <a href="#">Forgot password?</a>
    </div>
    <button type="submit">Sign in</button>
  </form>
</div>

<style>
.login-container { max-width: 400px; margin: 0 auto; padding: {{spacing.xl}}; font-family: system-ui, -apple-system, sans-serif; }
.header { text-align: center; margin-bottom: {{spacing.xl}}; }
.header h1 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.header p { font-size: 0.875rem; color: #6b7280; margin-top: {{spacing.sm}}; }
.form { display: flex; flex-direction: column; gap: {{spacing.md}}; }
.field label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: {{spacing.sm}}; }
.field input { width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}}; border: 1px solid #d1d5db; font-size: 0.875rem; box-sizing: border-box; }
.options { display: flex; justify-content: space-between; align-items: center; }
.remember { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; }
.options a { font-size: 0.875rem; color: #3b82f6; text-decoration: none; }
button { width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}}; border: none; background: #111827; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
</style>`,
    svelte: `<script lang="ts">
  let email = "";
  let password = "";
  let remember = false;
</script>

<div class="login-container">
  <div class="header">
    <h1>Welcome back</h1>
    <p>Sign in to your account</p>
  </div>
  <form class="form" on:submit|preventDefault>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" placeholder="you@example.com" bind:value={email} />
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input id="password" type="password" placeholder="••••••••" bind:value={password} />
    </div>
    <div class="options">
      <label class="remember"><input type="checkbox" bind:checked={remember} /> Remember me</label>
      <a href="/">Forgot password?</a>
    </div>
    <button type="submit">Sign in</button>
  </form>
</div>

<style>
.login-container { max-width: 400px; margin: 0 auto; padding: {{spacing.xl}}; }
.header { text-align: center; margin-bottom: {{spacing.xl}}; }
.header h1 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.header p { font-size: 0.875rem; color: #6b7280; margin-top: {{spacing.sm}}; }
.form { display: flex; flex-direction: column; gap: {{spacing.md}}; }
.field label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: {{spacing.sm}}; }
.field input { width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}}; border: 1px solid #d1d5db; font-size: 0.875rem; box-sizing: border-box; }
.options { display: flex; justify-content: space-between; align-items: center; }
.remember { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; }
.options a { font-size: 0.875rem; color: #3b82f6; text-decoration: none; }
button { width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}}; border: none; background: #111827; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
</style>`,
  },
};

function applyTokens(template: string, tokens: DesignTokenSet): string {
  return template
    .replace(/\{\{borderRadius\}\}/g, tokens.borderRadius)
    .replace(/\{\{shadow\}\}/g, tokens.shadow)
    .replace(/\{\{spacing\.sm\}\}/g, tokens.spacing.sm)
    .replace(/\{\{spacing\.md\}\}/g, tokens.spacing.md)
    .replace(/\{\{spacing\.lg\}\}/g, tokens.spacing.lg)
    .replace(/\{\{spacing\.xl\}\}/g, tokens.spacing.xl);
}

function findTemplate(component: string): string | null {
  const lower = component.toLowerCase();
  for (const [key] of Object.entries(TEMPLATES)) {
    const keywords = key.split("-");
    if (keywords.some((k) => lower.includes(k))) return key;
  }
  return null;
}

export function registerComponentSuggest(server: McpServer): void {
  server.tool(
    "component_suggest",
    "Get a well-designed, production-ready UI component with proper spacing, typography, and color. Supports React, Vue, Svelte, and HTML.",
    {
      component: z
        .string()
        .describe("What you need (e.g., 'pricing card', 'login form', 'hero section')"),
      framework: z
        .enum(["react", "vue", "svelte", "html"])
        .describe("Target framework"),
      variant: z
        .enum(["minimal", "modern", "corporate", "playful"])
        .default("modern")
        .describe("Design style variant"),
    },
    async ({ component, framework, variant }) => {
      const tokens = VARIANT_TOKENS[variant];
      const templateKey = findTemplate(component);

      if (!templateKey || !TEMPLATES[templateKey][framework]) {
        const available = Object.keys(TEMPLATES).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: [
                `# Component Suggestion`,
                ``,
                `I don't have a pre-built template for "${component}" yet.`,
                ``,
                `**Available templates:** ${available}`,
                ``,
                `**Design tokens for "${variant}" style:**`,
                `- Border radius: ${tokens.borderRadius}`,
                `- Box shadow: ${tokens.shadow}`,
                `- Spacing: sm=${tokens.spacing.sm}, md=${tokens.spacing.md}, lg=${tokens.spacing.lg}, xl=${tokens.spacing.xl}`,
                ``,
                `Use these tokens to maintain consistent design when building your component.`,
              ].join("\n"),
            },
          ],
        };
      }

      const raw = TEMPLATES[templateKey][framework];
      const code = applyTokens(raw, tokens);

      const designNotes = [
        `**Border radius:** ${tokens.borderRadius} — ${variant === "playful" ? "rounded for friendliness" : variant === "corporate" ? "subtle for professionalism" : "balanced for modern feel"}`,
        `**Spacing system:** Based on a consistent scale (${tokens.spacing.sm} / ${tokens.spacing.md} / ${tokens.spacing.lg} / ${tokens.spacing.xl})`,
        `**Typography:** System font stack, limited to 2 sizes and 2 weights for clarity`,
        `**Color:** Neutral base (#111827 text, #6b7280 secondary) with blue accent (#3b82f6) — safe, universal palette`,
        `**Layout:** Flexbox with gap for consistent spacing, max-width constraint for readability`,
      ];

      const lines = [
        `# ${templateKey.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")} (${framework}, ${variant})`,
        ``,
        "```" + (framework === "html" ? "html" : framework === "vue" ? "vue" : framework === "svelte" ? "svelte" : "tsx"),
        code,
        "```",
        ``,
        `## Design Decisions`,
        ``,
        ...designNotes.map((n) => `- ${n}`),
      ];

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
