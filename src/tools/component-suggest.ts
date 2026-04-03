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
  "hero-section": {
    react: `interface HeroSectionProps {
  headline?: string;
  subtitle?: string;
  ctaText?: string;
  secondaryCtaText?: string;
  backgroundUrl?: string;
}

export function HeroSection({
  headline = "Build something amazing",
  subtitle = "The modern platform for teams who ship fast. Start building today with our powerful tools and intuitive workflows.",
  ctaText = "Get Started Free",
  secondaryCtaText = "Learn More",
  backgroundUrl,
}: HeroSectionProps) {
  return (
    <section
      style={{
        width: "100%",
        minHeight: "560px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "{{spacing.xl}} {{spacing.lg}}",
        background: backgroundUrl
          ? \`linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(\${backgroundUrl}) center/cover\`
          : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "720px" }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: 800, color: "#ffffff", lineHeight: 1.1, margin: 0 }}>
          {headline}
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#cbd5e1", lineHeight: 1.6, marginTop: "{{spacing.lg}}", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" }}>
          {subtitle}
        </p>
        <div style={{ display: "flex", gap: "{{spacing.md}}", justifyContent: "center", marginTop: "{{spacing.xl}}" }}>
          <button style={{
            padding: "{{spacing.md}} {{spacing.xl}}", borderRadius: "{{borderRadius}}", border: "none",
            background: "#3b82f6", color: "#fff", fontSize: "1rem", fontWeight: 600, cursor: "pointer",
          }}>
            {ctaText}
          </button>
          <button style={{
            padding: "{{spacing.md}} {{spacing.xl}}", borderRadius: "{{borderRadius}}",
            border: "1px solid rgba(255,255,255,0.3)", background: "transparent",
            color: "#fff", fontSize: "1rem", fontWeight: 500, cursor: "pointer",
          }}>
            {secondaryCtaText}
          </button>
        </div>
      </div>
    </section>
  );
}`,
    html: `<section class="hero">
  <div class="hero-inner">
    <h1>Build something amazing</h1>
    <p>The modern platform for teams who ship fast. Start building today with our powerful tools and intuitive workflows.</p>
    <div class="hero-actions">
      <button class="btn-primary">Get Started Free</button>
      <button class="btn-secondary">Learn More</button>
    </div>
  </div>
</section>

<style>
.hero {
  width: 100%; min-height: 560px; display: flex; align-items: center; justify-content: center;
  text-align: center; padding: {{spacing.xl}} {{spacing.lg}};
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif;
}
.hero-inner { max-width: 720px; }
.hero h1 { font-size: 3.5rem; font-weight: 800; color: #fff; line-height: 1.1; margin: 0; }
.hero p { font-size: 1.125rem; color: #cbd5e1; line-height: 1.6; margin-top: {{spacing.lg}}; max-width: 560px; margin-left: auto; margin-right: auto; }
.hero-actions { display: flex; gap: {{spacing.md}}; justify-content: center; margin-top: {{spacing.xl}}; }
.btn-primary {
  padding: {{spacing.md}} {{spacing.xl}}; border-radius: {{borderRadius}}; border: none;
  background: #3b82f6; color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer;
}
.btn-secondary {
  padding: {{spacing.md}} {{spacing.xl}}; border-radius: {{borderRadius}};
  border: 1px solid rgba(255,255,255,0.3); background: transparent;
  color: #fff; font-size: 1rem; font-weight: 500; cursor: pointer;
}
</style>`,
  },
  "navbar": {
    react: `interface NavbarProps {
  logo?: string;
  links?: { label: string; href: string }[];
}

export function Navbar({
  logo = "Acme",
  links = [
    { label: "Products", href: "#" },
    { label: "Solutions", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "Docs", href: "#" },
  ],
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <nav style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "{{spacing.md}} {{spacing.xl}}", background: "#ffffff",
      borderBottom: "1px solid #e5e7eb", boxSizing: "border-box", position: "relative",
    }}>
      <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>{logo}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "{{spacing.lg}}" }}>
        {links.map((link, i) => (
          <a key={i} href={link.href} style={{ fontSize: "0.875rem", color: "#374151", textDecoration: "none", fontWeight: 500 }}>
            {link.label}
          </a>
        ))}
        <button style={{
          padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}", border: "none",
          background: "#111827", color: "#fff", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
        }}>
          Sign Up
        </button>
      </div>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: "none", background: "none", border: "none", cursor: "pointer",
          fontSize: "1.5rem", color: "#374151",
        }}
        aria-label="Toggle menu"
      >
        ☰
      </button>
    </nav>
  );
}`,
    html: `<nav class="navbar">
  <span class="navbar-logo">Acme</span>
  <div class="navbar-links">
    <a href="#">Products</a>
    <a href="#">Solutions</a>
    <a href="#">Pricing</a>
    <a href="#">Docs</a>
    <button class="navbar-cta">Sign Up</button>
  </div>
  <button class="navbar-toggle" aria-label="Toggle menu">☰</button>
</nav>

<style>
.navbar {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: {{spacing.md}} {{spacing.xl}}; background: #fff;
  border-bottom: 1px solid #e5e7eb; box-sizing: border-box;
  font-family: system-ui, -apple-system, sans-serif;
}
.navbar-logo { font-size: 1.25rem; font-weight: 700; color: #111827; }
.navbar-links { display: flex; align-items: center; gap: {{spacing.lg}}; }
.navbar-links a { font-size: 0.875rem; color: #374151; text-decoration: none; font-weight: 500; }
.navbar-links a:hover { color: #111827; }
.navbar-cta {
  padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}}; border: none;
  background: #111827; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer;
}
.navbar-toggle { display: none; background: none; border: none; cursor: pointer; font-size: 1.5rem; color: #374151; }
@media (max-width: 768px) {
  .navbar-links { display: none; }
  .navbar-toggle { display: block; }
}
</style>`,
  },
  "footer": {
    react: `export function Footer() {
  const columns = [
    { title: "Product", links: ["Features", "Pricing", "Changelog", "Docs"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
    { title: "Legal", links: ["Privacy", "Terms", "Cookie Policy"] },
  ];
  return (
    <footer style={{ width: "100%", background: "#111827", color: "#9ca3af", padding: "{{spacing.xl}}", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "{{spacing.xl}}" }}>
        <div>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0 }}>Acme</p>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.6, marginTop: "{{spacing.md}}", maxWidth: "280px" }}>
            Building the future of web development. Subscribe to our newsletter.
          </p>
          <div style={{ display: "flex", gap: "{{spacing.sm}}", marginTop: "{{spacing.md}}" }}>
            <input placeholder="you@email.com" style={{
              flex: 1, padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
              border: "1px solid #374151", background: "#1f2937", color: "#fff", fontSize: "0.875rem",
            }} />
            <button style={{
              padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}", border: "none",
              background: "#3b82f6", color: "#fff", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
            }}>Subscribe</button>
          </div>
          <div style={{ display: "flex", gap: "{{spacing.md}}", marginTop: "{{spacing.lg}}" }}>
            {["Twitter", "GitHub", "LinkedIn"].map((s) => (
              <a key={s} href="#" style={{ color: "#9ca3af", fontSize: "0.875rem", textDecoration: "none" }}>{s}</a>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p style={{ fontWeight: 600, color: "#fff", fontSize: "0.875rem", marginBottom: "{{spacing.md}}" }}>{col.title}</p>
            {col.links.map((link) => (
              <a key={link} href="#" style={{ display: "block", color: "#9ca3af", fontSize: "0.875rem", textDecoration: "none", marginBottom: "{{spacing.sm}}" }}>{link}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: "1120px", margin: "{{spacing.xl}} auto 0", borderTop: "1px solid #1f2937", paddingTop: "{{spacing.lg}}", textAlign: "center", fontSize: "0.75rem" }}>
        &copy; 2026 Acme Inc. All rights reserved.
      </div>
    </footer>
  );
}`,
    html: `<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <p class="footer-logo">Acme</p>
      <p class="footer-desc">Building the future of web development. Subscribe to our newsletter.</p>
      <div class="newsletter">
        <input placeholder="you@email.com" />
        <button>Subscribe</button>
      </div>
      <div class="social-links">
        <a href="#">Twitter</a><a href="#">GitHub</a><a href="#">LinkedIn</a>
      </div>
    </div>
    <div class="footer-col">
      <p class="col-title">Product</p>
      <a href="#">Features</a><a href="#">Pricing</a><a href="#">Changelog</a><a href="#">Docs</a>
    </div>
    <div class="footer-col">
      <p class="col-title">Company</p>
      <a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a><a href="#">Press</a>
    </div>
    <div class="footer-col">
      <p class="col-title">Legal</p>
      <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookie Policy</a>
    </div>
  </div>
  <div class="footer-bottom">&copy; 2026 Acme Inc. All rights reserved.</div>
</footer>

<style>
.site-footer {
  width: 100%; background: #111827; color: #9ca3af; padding: {{spacing.xl}};
  box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif;
}
.footer-grid { max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: {{spacing.xl}}; }
.footer-logo { font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0; }
.footer-desc { font-size: 0.875rem; line-height: 1.6; margin-top: {{spacing.md}}; max-width: 280px; }
.newsletter { display: flex; gap: {{spacing.sm}}; margin-top: {{spacing.md}}; }
.newsletter input {
  flex: 1; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}};
  border: 1px solid #374151; background: #1f2937; color: #fff; font-size: 0.875rem;
}
.newsletter button {
  padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}}; border: none;
  background: #3b82f6; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer;
}
.social-links { display: flex; gap: {{spacing.md}}; margin-top: {{spacing.lg}}; }
.social-links a { color: #9ca3af; font-size: 0.875rem; text-decoration: none; }
.col-title { font-weight: 600; color: #fff; font-size: 0.875rem; margin-bottom: {{spacing.md}}; }
.footer-col a { display: block; color: #9ca3af; font-size: 0.875rem; text-decoration: none; margin-bottom: {{spacing.sm}}; }
.footer-col a:hover { color: #fff; }
.footer-bottom {
  max-width: 1120px; margin: {{spacing.xl}} auto 0; border-top: 1px solid #1f2937;
  padding-top: {{spacing.lg}}; text-align: center; font-size: 0.75rem;
}
</style>`,
  },
  "feature-grid": {
    react: `interface Feature { icon: string; title: string; description: string; }

interface FeatureGridProps {
  heading?: string;
  subheading?: string;
  features?: Feature[];
}

export function FeatureGrid({
  heading = "Everything you need",
  subheading = "Powerful features to help you build, launch, and grow your product.",
  features = [
    { icon: "⚡", title: "Lightning Fast", description: "Optimized performance with sub-100ms response times across the board." },
    { icon: "🔒", title: "Secure by Default", description: "Enterprise-grade security with end-to-end encryption and SOC2 compliance." },
    { icon: "📊", title: "Rich Analytics", description: "Deep insights with real-time dashboards, funnels, and cohort analysis." },
    { icon: "🔌", title: "Easy Integrations", description: "Connect with 100+ tools you already use. REST and GraphQL APIs included." },
    { icon: "🎨", title: "Customizable", description: "Fully themeable with CSS variables, custom components, and white-labeling." },
    { icon: "🤝", title: "Team Collaboration", description: "Real-time editing, comments, and role-based access for your whole team." },
  ],
}: FeatureGridProps) {
  return (
    <section style={{ padding: "{{spacing.xl}}", maxWidth: "1120px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "{{spacing.xl}}" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#111827", margin: 0 }}>{heading}</h2>
        <p style={{ fontSize: "1.125rem", color: "#6b7280", marginTop: "{{spacing.sm}}", maxWidth: "540px", marginLeft: "auto", marginRight: "auto" }}>{subheading}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "{{spacing.xl}}" }}>
        {features.map((f, i) => (
          <div key={i} style={{
            padding: "{{spacing.lg}}", borderRadius: "{{borderRadius}}", border: "1px solid #e5e7eb",
            boxShadow: "{{shadow}}", background: "#fff",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "{{spacing.md}}" }}>{f.icon}</div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", margin: 0 }}>{f.title}</h3>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.6, marginTop: "{{spacing.sm}}" }}>{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`,
    html: `<section class="feature-grid-section">
  <div class="feature-header">
    <h2>Everything you need</h2>
    <p>Powerful features to help you build, launch, and grow your product.</p>
  </div>
  <div class="feature-grid">
    <div class="feature-card"><div class="feature-icon">⚡</div><h3>Lightning Fast</h3><p>Optimized performance with sub-100ms response times across the board.</p></div>
    <div class="feature-card"><div class="feature-icon">🔒</div><h3>Secure by Default</h3><p>Enterprise-grade security with end-to-end encryption and SOC2 compliance.</p></div>
    <div class="feature-card"><div class="feature-icon">📊</div><h3>Rich Analytics</h3><p>Deep insights with real-time dashboards, funnels, and cohort analysis.</p></div>
    <div class="feature-card"><div class="feature-icon">🔌</div><h3>Easy Integrations</h3><p>Connect with 100+ tools you already use. REST and GraphQL APIs included.</p></div>
    <div class="feature-card"><div class="feature-icon">🎨</div><h3>Customizable</h3><p>Fully themeable with CSS variables, custom components, and white-labeling.</p></div>
    <div class="feature-card"><div class="feature-icon">🤝</div><h3>Team Collaboration</h3><p>Real-time editing, comments, and role-based access for your whole team.</p></div>
  </div>
</section>

<style>
.feature-grid-section { padding: {{spacing.xl}}; max-width: 1120px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif; }
.feature-header { text-align: center; margin-bottom: {{spacing.xl}}; }
.feature-header h2 { font-size: 2rem; font-weight: 700; color: #111827; margin: 0; }
.feature-header p { font-size: 1.125rem; color: #6b7280; margin-top: {{spacing.sm}}; max-width: 540px; margin-left: auto; margin-right: auto; }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: {{spacing.xl}}; }
.feature-card {
  padding: {{spacing.lg}}; border-radius: {{borderRadius}}; border: 1px solid #e5e7eb;
  box-shadow: {{shadow}}; background: #fff;
}
.feature-icon { font-size: 2rem; margin-bottom: {{spacing.md}}; }
.feature-card h3 { font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0; }
.feature-card p { font-size: 0.875rem; color: #6b7280; line-height: 1.6; margin-top: {{spacing.sm}}; }
@media (max-width: 768px) { .feature-grid { grid-template-columns: 1fr; } }
</style>`,
  },
  "testimonial-card": {
    react: `interface TestimonialCardProps {
  quote?: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
  rating?: number;
}

export function TestimonialCard({
  quote = "This product completely transformed our workflow. We shipped 3x faster in the first month and haven't looked back since.",
  name = "Sarah Chen",
  role = "VP of Engineering, TechCorp",
  avatarUrl,
  rating = 5,
}: TestimonialCardProps) {
  return (
    <div style={{
      padding: "{{spacing.xl}}", borderRadius: "{{borderRadius}}", boxShadow: "{{shadow}}",
      border: "1px solid #e5e7eb", background: "#fff", maxWidth: "440px",
      display: "flex", flexDirection: "column", gap: "{{spacing.lg}}",
    }}>
      <div style={{ display: "flex", gap: "2px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ color: i < rating ? "#f59e0b" : "#d1d5db", fontSize: "1.125rem" }}>★</span>
        ))}
      </div>
      <p style={{ fontSize: "1rem", color: "#374151", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
        &ldquo;{quote}&rdquo;
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "{{spacing.md}}" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%", background: "#e0e7ff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem", fontWeight: 600, color: "#4f46e5", flexShrink: 0,
          backgroundImage: avatarUrl ? \`url(\${avatarUrl})\` : undefined,
          backgroundSize: "cover",
        }}>
          {!avatarUrl && name.charAt(0)}
        </div>
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", margin: 0 }}>{name}</p>
          <p style={{ fontSize: "0.8125rem", color: "#6b7280", margin: 0, marginTop: "2px" }}>{role}</p>
        </div>
      </div>
    </div>
  );
}`,
    html: `<div class="testimonial-card">
  <div class="stars">
    <span class="star filled">★</span><span class="star filled">★</span><span class="star filled">★</span><span class="star filled">★</span><span class="star filled">★</span>
  </div>
  <p class="quote">&ldquo;This product completely transformed our workflow. We shipped 3x faster in the first month and haven't looked back since.&rdquo;</p>
  <div class="author">
    <div class="avatar">S</div>
    <div>
      <p class="author-name">Sarah Chen</p>
      <p class="author-role">VP of Engineering, TechCorp</p>
    </div>
  </div>
</div>

<style>
.testimonial-card {
  padding: {{spacing.xl}}; border-radius: {{borderRadius}}; box-shadow: {{shadow}};
  border: 1px solid #e5e7eb; background: #fff; max-width: 440px;
  display: flex; flex-direction: column; gap: {{spacing.lg}};
  font-family: system-ui, -apple-system, sans-serif;
}
.stars { display: flex; gap: 2px; }
.star { font-size: 1.125rem; color: #d1d5db; }
.star.filled { color: #f59e0b; }
.quote { font-size: 1rem; color: #374151; line-height: 1.7; margin: 0; font-style: italic; }
.author { display: flex; align-items: center; gap: {{spacing.md}}; }
.avatar {
  width: 44px; height: 44px; border-radius: 50%; background: #e0e7ff;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; font-weight: 600; color: #4f46e5; flex-shrink: 0;
}
.author-name { font-size: 0.875rem; font-weight: 600; color: #111827; margin: 0; }
.author-role { font-size: 0.8125rem; color: #6b7280; margin: 2px 0 0; }
</style>`,
  },
  "faq-accordion": {
    react: `interface FaqItem { question: string; answer: string; }

interface FaqAccordionProps {
  heading?: string;
  items?: FaqItem[];
}

export function FaqAccordion({
  heading = "Frequently asked questions",
  items = [
    { question: "How does the free trial work?", answer: "You get full access to all features for 14 days. No credit card required. Cancel anytime." },
    { question: "Can I change my plan later?", answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle." },
    { question: "What payment methods do you accept?", answer: "We accept all major credit cards, PayPal, and wire transfers for enterprise plans." },
    { question: "Is there a setup fee?", answer: "No setup fees, no hidden charges. You only pay for your subscription plan." },
  ],
}: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  return (
    <section style={{ maxWidth: "680px", margin: "0 auto", padding: "{{spacing.xl}}" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: "{{spacing.xl}}" }}>{heading}</h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, i) => (
          <div key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "{{spacing.lg}} 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{ fontSize: "1rem", fontWeight: 500, color: "#111827" }}>{item.question}</span>
              <span style={{ fontSize: "1.25rem", color: "#6b7280", transform: openIndex === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
            </button>
            {openIndex === i && (
              <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.7, margin: 0, paddingBottom: "{{spacing.lg}}" }}>
                {item.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}`,
    html: `<section class="faq-section">
  <h2>Frequently asked questions</h2>
  <div class="faq-list">
    <details class="faq-item" open>
      <summary>How does the free trial work?</summary>
      <p>You get full access to all features for 14 days. No credit card required. Cancel anytime.</p>
    </details>
    <details class="faq-item">
      <summary>Can I change my plan later?</summary>
      <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.</p>
    </details>
    <details class="faq-item">
      <summary>What payment methods do you accept?</summary>
      <p>We accept all major credit cards, PayPal, and wire transfers for enterprise plans.</p>
    </details>
    <details class="faq-item">
      <summary>Is there a setup fee?</summary>
      <p>No setup fees, no hidden charges. You only pay for your subscription plan.</p>
    </details>
  </div>
</section>

<style>
.faq-section {
  max-width: 680px; margin: 0 auto; padding: {{spacing.xl}};
  font-family: system-ui, -apple-system, sans-serif;
}
.faq-section h2 { font-size: 1.75rem; font-weight: 700; color: #111827; text-align: center; margin-bottom: {{spacing.xl}}; }
.faq-item { border-bottom: 1px solid #e5e7eb; }
.faq-item summary {
  padding: {{spacing.lg}} 0; font-size: 1rem; font-weight: 500; color: #111827;
  cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after { content: "+"; font-size: 1.25rem; color: #6b7280; }
.faq-item[open] summary::after { content: "−"; }
.faq-item p { font-size: 0.875rem; color: #6b7280; line-height: 1.7; margin: 0; padding-bottom: {{spacing.lg}}; }
</style>`,
  },
  "stats-section": {
    react: `interface Stat { value: string; label: string; }

interface StatsSectionProps {
  stats?: Stat[];
}

export function StatsSection({
  stats = [
    { value: "10K+", label: "Active Users" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "150+", label: "Countries" },
    { value: "4.9/5", label: "Customer Rating" },
  ],
}: StatsSectionProps) {
  return (
    <section style={{
      width: "100%", padding: "{{spacing.xl}}", background: "#f9fafb",
      borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb",
    }}>
      <div style={{
        maxWidth: "960px", margin: "0 auto",
        display: "grid", gridTemplateColumns: \`repeat(\${stats.length}, 1fr)\`, gap: "{{spacing.lg}}",
        textAlign: "center",
      }}>
        {stats.map((stat, i) => (
          <div key={i}>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.025em" }}>{stat.value}</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#6b7280", marginTop: "{{spacing.sm}}" }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`,
    html: `<section class="stats-section">
  <div class="stats-grid">
    <div class="stat"><p class="stat-value">10K+</p><p class="stat-label">Active Users</p></div>
    <div class="stat"><p class="stat-value">99.9%</p><p class="stat-label">Uptime SLA</p></div>
    <div class="stat"><p class="stat-value">150+</p><p class="stat-label">Countries</p></div>
    <div class="stat"><p class="stat-value">4.9/5</p><p class="stat-label">Customer Rating</p></div>
  </div>
</section>

<style>
.stats-section {
  width: 100%; padding: {{spacing.xl}}; background: #f9fafb;
  border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;
  font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box;
}
.stats-grid { max-width: 960px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: {{spacing.lg}}; text-align: center; }
.stat-value { font-size: 2.5rem; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.025em; }
.stat-label { font-size: 0.875rem; font-weight: 500; color: #6b7280; margin-top: {{spacing.sm}}; }
@media (max-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
</style>`,
  },
  "cta-banner": {
    react: `interface CtaBannerProps {
  headline?: string;
  description?: string;
  ctaText?: string;
  secondaryCtaText?: string;
}

export function CtaBanner({
  headline = "Ready to get started?",
  description = "Join thousands of teams already using our platform to build better products, faster.",
  ctaText = "Start Free Trial",
  secondaryCtaText = "Talk to Sales",
}: CtaBannerProps) {
  return (
    <section style={{
      width: "100%", padding: "{{spacing.xl}}", background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
      boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", margin: 0 }}>{headline}</h2>
        <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.85)", marginTop: "{{spacing.md}}", lineHeight: 1.6 }}>{description}</p>
        <div style={{ display: "flex", gap: "{{spacing.md}}", justifyContent: "center", marginTop: "{{spacing.xl}}" }}>
          <button style={{
            padding: "{{spacing.md}} {{spacing.xl}}", borderRadius: "{{borderRadius}}", border: "none",
            background: "#fff", color: "#1e40af", fontSize: "1rem", fontWeight: 600, cursor: "pointer",
          }}>{ctaText}</button>
          <button style={{
            padding: "{{spacing.md}} {{spacing.xl}}", borderRadius: "{{borderRadius}}",
            border: "1px solid rgba(255,255,255,0.4)", background: "transparent",
            color: "#fff", fontSize: "1rem", fontWeight: 500, cursor: "pointer",
          }}>{secondaryCtaText}</button>
        </div>
      </div>
    </section>
  );
}`,
    html: `<section class="cta-banner">
  <div class="cta-inner">
    <h2>Ready to get started?</h2>
    <p>Join thousands of teams already using our platform to build better products, faster.</p>
    <div class="cta-actions">
      <button class="cta-primary">Start Free Trial</button>
      <button class="cta-secondary">Talk to Sales</button>
    </div>
  </div>
</section>

<style>
.cta-banner {
  width: 100%; padding: {{spacing.xl}};
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif;
}
.cta-inner { max-width: 800px; margin: 0 auto; text-align: center; }
.cta-inner h2 { font-size: 2rem; font-weight: 700; color: #fff; margin: 0; }
.cta-inner p { font-size: 1.125rem; color: rgba(255,255,255,0.85); margin-top: {{spacing.md}}; line-height: 1.6; }
.cta-actions { display: flex; gap: {{spacing.md}}; justify-content: center; margin-top: {{spacing.xl}}; }
.cta-primary {
  padding: {{spacing.md}} {{spacing.xl}}; border-radius: {{borderRadius}}; border: none;
  background: #fff; color: #1e40af; font-size: 1rem; font-weight: 600; cursor: pointer;
}
.cta-secondary {
  padding: {{spacing.md}} {{spacing.xl}}; border-radius: {{borderRadius}};
  border: 1px solid rgba(255,255,255,0.4); background: transparent;
  color: #fff; font-size: 1rem; font-weight: 500; cursor: pointer;
}
</style>`,
  },
  "team-grid": {
    react: `interface TeamMember { name: string; role: string; photoUrl?: string; social?: { twitter?: string; linkedin?: string; github?: string }; }

interface TeamGridProps {
  heading?: string;
  members?: TeamMember[];
}

export function TeamGrid({
  heading = "Meet our team",
  members = [
    { name: "Alex Rivera", role: "CEO & Co-founder", social: { twitter: "#", linkedin: "#" } },
    { name: "Jordan Kim", role: "CTO & Co-founder", social: { github: "#", linkedin: "#" } },
    { name: "Sam Patel", role: "Head of Design", social: { twitter: "#" } },
    { name: "Casey Morgan", role: "Lead Engineer", social: { github: "#", linkedin: "#" } },
  ],
}: TeamGridProps) {
  return (
    <section style={{ padding: "{{spacing.xl}}", maxWidth: "960px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: "{{spacing.xl}}" }}>{heading}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "{{spacing.lg}}" }}>
        {members.map((m, i) => (
          <div key={i} style={{ textAlign: "center", padding: "{{spacing.lg}}", borderRadius: "{{borderRadius}}", border: "1px solid #e5e7eb", boxShadow: "{{shadow}}", background: "#fff" }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%", background: "#e0e7ff", margin: "0 auto {{spacing.md}}",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: "#4f46e5",
              backgroundImage: m.photoUrl ? \`url(\${m.photoUrl})\` : undefined, backgroundSize: "cover",
            }}>
              {!m.photoUrl && m.name.split(" ").map(n => n[0]).join("")}
            </div>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", margin: 0 }}>{m.name}</p>
            <p style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "4px" }}>{m.role}</p>
            {m.social && (
              <div style={{ display: "flex", gap: "{{spacing.sm}}", justifyContent: "center", marginTop: "{{spacing.md}}" }}>
                {Object.entries(m.social).map(([platform, url]) => (
                  <a key={platform} href={url} style={{ fontSize: "0.75rem", color: "#6b7280", textDecoration: "none" }}>{platform}</a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}`,
    html: `<section class="team-section">
  <h2>Meet our team</h2>
  <div class="team-grid">
    <div class="team-card">
      <div class="team-avatar">AR</div>
      <p class="team-name">Alex Rivera</p>
      <p class="team-role">CEO & Co-founder</p>
      <div class="team-social"><a href="#">Twitter</a><a href="#">LinkedIn</a></div>
    </div>
    <div class="team-card">
      <div class="team-avatar">JK</div>
      <p class="team-name">Jordan Kim</p>
      <p class="team-role">CTO & Co-founder</p>
      <div class="team-social"><a href="#">GitHub</a><a href="#">LinkedIn</a></div>
    </div>
    <div class="team-card">
      <div class="team-avatar">SP</div>
      <p class="team-name">Sam Patel</p>
      <p class="team-role">Head of Design</p>
      <div class="team-social"><a href="#">Twitter</a></div>
    </div>
    <div class="team-card">
      <div class="team-avatar">CM</div>
      <p class="team-name">Casey Morgan</p>
      <p class="team-role">Lead Engineer</p>
      <div class="team-social"><a href="#">GitHub</a><a href="#">LinkedIn</a></div>
    </div>
  </div>
</section>

<style>
.team-section { padding: {{spacing.xl}}; max-width: 960px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif; }
.team-section h2 { font-size: 1.75rem; font-weight: 700; color: #111827; text-align: center; margin-bottom: {{spacing.xl}}; }
.team-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: {{spacing.lg}}; }
.team-card {
  text-align: center; padding: {{spacing.lg}}; border-radius: {{borderRadius}};
  border: 1px solid #e5e7eb; box-shadow: {{shadow}}; background: #fff;
}
.team-avatar {
  width: 80px; height: 80px; border-radius: 50%; background: #e0e7ff; margin: 0 auto {{spacing.md}};
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #4f46e5;
}
.team-name { font-size: 1rem; font-weight: 600; color: #111827; margin: 0; }
.team-role { font-size: 0.8125rem; color: #6b7280; margin-top: 4px; }
.team-social { display: flex; gap: {{spacing.sm}}; justify-content: center; margin-top: {{spacing.md}}; }
.team-social a { font-size: 0.75rem; color: #6b7280; text-decoration: none; }
.team-social a:hover { color: #111827; }
@media (max-width: 768px) { .team-grid { grid-template-columns: repeat(2, 1fr); } }
</style>`,
  },
  "contact-form": {
    react: `export function ContactForm() {
  return (
    <div style={{
      maxWidth: "520px", margin: "0 auto", padding: "{{spacing.xl}}",
      borderRadius: "{{borderRadius}}", boxShadow: "{{shadow}}", border: "1px solid #e5e7eb", background: "#fff",
    }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: 0 }}>Get in touch</h2>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "{{spacing.sm}}" }}>We'd love to hear from you. Fill out the form below.</p>
      <form style={{ display: "flex", flexDirection: "column", gap: "{{spacing.md}}", marginTop: "{{spacing.lg}}" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "{{spacing.md}}" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "{{spacing.sm}}" }}>First name</label>
            <input placeholder="John" style={{
              width: "100%", padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
              border: "1px solid #d1d5db", fontSize: "0.875rem", boxSizing: "border-box",
            }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "{{spacing.sm}}" }}>Last name</label>
            <input placeholder="Doe" style={{
              width: "100%", padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
              border: "1px solid #d1d5db", fontSize: "0.875rem", boxSizing: "border-box",
            }} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "{{spacing.sm}}" }}>Email</label>
          <input type="email" placeholder="john@example.com" style={{
            width: "100%", padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
            border: "1px solid #d1d5db", fontSize: "0.875rem", boxSizing: "border-box",
          }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "{{spacing.sm}}" }}>Message</label>
          <textarea rows={5} placeholder="Tell us about your project..." style={{
            width: "100%", padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
            border: "1px solid #d1d5db", fontSize: "0.875rem", boxSizing: "border-box", resize: "vertical",
            fontFamily: "inherit",
          }} />
        </div>
        <button type="submit" style={{
          width: "100%", padding: "{{spacing.md}}", borderRadius: "{{borderRadius}}", border: "none",
          background: "#111827", color: "#fff", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
        }}>Send Message</button>
      </form>
    </div>
  );
}`,
    html: `<div class="contact-form-card">
  <h2>Get in touch</h2>
  <p class="contact-desc">We'd love to hear from you. Fill out the form below.</p>
  <form class="contact-form">
    <div class="name-row">
      <div class="field">
        <label>First name</label>
        <input placeholder="John" />
      </div>
      <div class="field">
        <label>Last name</label>
        <input placeholder="Doe" />
      </div>
    </div>
    <div class="field">
      <label>Email</label>
      <input type="email" placeholder="john@example.com" />
    </div>
    <div class="field">
      <label>Message</label>
      <textarea rows="5" placeholder="Tell us about your project..."></textarea>
    </div>
    <button type="submit">Send Message</button>
  </form>
</div>

<style>
.contact-form-card {
  max-width: 520px; margin: 0 auto; padding: {{spacing.xl}};
  border-radius: {{borderRadius}}; box-shadow: {{shadow}}; border: 1px solid #e5e7eb;
  background: #fff; font-family: system-ui, -apple-system, sans-serif;
}
.contact-form-card h2 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.contact-desc { font-size: 0.875rem; color: #6b7280; margin-top: {{spacing.sm}}; }
.contact-form { display: flex; flex-direction: column; gap: {{spacing.md}}; margin-top: {{spacing.lg}}; }
.name-row { display: grid; grid-template-columns: 1fr 1fr; gap: {{spacing.md}}; }
.contact-form .field label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: {{spacing.sm}}; }
.contact-form .field input,
.contact-form .field textarea {
  width: 100%; padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}};
  border: 1px solid #d1d5db; font-size: 0.875rem; box-sizing: border-box; font-family: inherit;
}
.contact-form .field textarea { resize: vertical; }
.contact-form .field input:focus,
.contact-form .field textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.contact-form button {
  width: 100%; padding: {{spacing.md}}; border-radius: {{borderRadius}}; border: none;
  background: #111827; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer;
}
</style>`,
  },
  "notification-toast": {
    react: `type ToastVariant = "success" | "error" | "warning" | "info";

interface NotificationToastProps {
  variant?: ToastVariant;
  title?: string;
  message?: string;
  onClose?: () => void;
}

const toastStyles: Record<ToastVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", icon: "✓", iconColor: "#16a34a" },
  error: { bg: "#fef2f2", border: "#fecaca", icon: "✕", iconColor: "#dc2626" },
  warning: { bg: "#fffbeb", border: "#fde68a", icon: "!", iconColor: "#d97706" },
  info: { bg: "#eff6ff", border: "#bfdbfe", icon: "i", iconColor: "#2563eb" },
};

export function NotificationToast({
  variant = "success",
  title = "Success",
  message = "Your changes have been saved successfully.",
  onClose,
}: NotificationToastProps) {
  const s = toastStyles[variant];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "{{spacing.md}}", padding: "{{spacing.md}} {{spacing.lg}}",
      borderRadius: "{{borderRadius}}", border: \`1px solid \${s.border}\`, background: s.bg,
      boxShadow: "{{shadow}}", maxWidth: "420px", minWidth: "320px",
    }}>
      <span style={{
        width: "24px", height: "24px", borderRadius: "50%", background: s.iconColor, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
      }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", margin: 0 }}>{title}</p>
        <p style={{ fontSize: "0.8125rem", color: "#6b7280", margin: 0, marginTop: "4px", lineHeight: 1.5 }}>{message}</p>
      </div>
      <button onClick={onClose} style={{
        background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "1.125rem",
        padding: 0, lineHeight: 1, flexShrink: 0,
      }}>×</button>
    </div>
  );
}`,
    html: `<div class="toast toast-success">
  <span class="toast-icon">✓</span>
  <div class="toast-content">
    <p class="toast-title">Success</p>
    <p class="toast-message">Your changes have been saved successfully.</p>
  </div>
  <button class="toast-close">×</button>
</div>

<div class="toast toast-error">
  <span class="toast-icon">✕</span>
  <div class="toast-content">
    <p class="toast-title">Error</p>
    <p class="toast-message">Something went wrong. Please try again.</p>
  </div>
  <button class="toast-close">×</button>
</div>

<div class="toast toast-warning">
  <span class="toast-icon">!</span>
  <div class="toast-content">
    <p class="toast-title">Warning</p>
    <p class="toast-message">Your session will expire in 5 minutes.</p>
  </div>
  <button class="toast-close">×</button>
</div>

<div class="toast toast-info">
  <span class="toast-icon">i</span>
  <div class="toast-content">
    <p class="toast-title">Info</p>
    <p class="toast-message">A new version is available. Refresh to update.</p>
  </div>
  <button class="toast-close">×</button>
</div>

<style>
.toast {
  display: flex; align-items: flex-start; gap: {{spacing.md}}; padding: {{spacing.md}} {{spacing.lg}};
  border-radius: {{borderRadius}}; box-shadow: {{shadow}};
  max-width: 420px; min-width: 320px; font-family: system-ui, -apple-system, sans-serif;
  margin-bottom: {{spacing.sm}};
}
.toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; }
.toast-error { background: #fef2f2; border: 1px solid #fecaca; }
.toast-warning { background: #fffbeb; border: 1px solid #fde68a; }
.toast-info { background: #eff6ff; border: 1px solid #bfdbfe; }
.toast-icon {
  width: 24px; height: 24px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
}
.toast-success .toast-icon { background: #16a34a; }
.toast-error .toast-icon { background: #dc2626; }
.toast-warning .toast-icon { background: #d97706; }
.toast-info .toast-icon { background: #2563eb; }
.toast-content { flex: 1; }
.toast-title { font-size: 0.875rem; font-weight: 600; color: #111827; margin: 0; }
.toast-message { font-size: 0.8125rem; color: #6b7280; margin: 4px 0 0; line-height: 1.5; }
.toast-close { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 1.125rem; padding: 0; line-height: 1; }
</style>`,
  },
  "modal-dialog": {
    react: `interface ModalDialogProps {
  title?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function ModalDialog({
  title = "Confirm your action",
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ModalDialogProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", zIndex: 50, padding: "{{spacing.md}}",
    }}>
      <div style={{
        background: "#fff", borderRadius: "{{borderRadius}}", boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        maxWidth: "480px", width: "100%", overflow: "hidden",
      }}>
        <div style={{ padding: "{{spacing.lg}} {{spacing.xl}}", borderBottom: "1px solid #e5e7eb" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", margin: 0 }}>{title}</h3>
        </div>
        <div style={{ padding: "{{spacing.lg}} {{spacing.xl}}" }}>
          {children || (
            <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
              Are you sure you want to proceed? This action cannot be undone.
            </p>
          )}
        </div>
        <div style={{
          padding: "{{spacing.md}} {{spacing.xl}}", borderTop: "1px solid #e5e7eb",
          display: "flex", justifyContent: "flex-end", gap: "{{spacing.sm}}", background: "#f9fafb",
        }}>
          <button onClick={onCancel} style={{
            padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
            border: "1px solid #d1d5db", background: "#fff", color: "#374151",
            fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
          }}>{cancelText}</button>
          <button onClick={onConfirm} style={{
            padding: "{{spacing.sm}} {{spacing.md}}", borderRadius: "{{borderRadius}}",
            border: "none", background: "#111827", color: "#fff",
            fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
          }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}`,
    html: `<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h3>Confirm your action</h3>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to proceed? This action cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="modal-cancel">Cancel</button>
      <button class="modal-confirm">Confirm</button>
    </div>
  </div>
</div>

<style>
.modal-overlay {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.5); z-index: 50; padding: {{spacing.md}};
  font-family: system-ui, -apple-system, sans-serif;
}
.modal {
  background: #fff; border-radius: {{borderRadius}};
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  max-width: 480px; width: 100%; overflow: hidden;
}
.modal-header { padding: {{spacing.lg}} {{spacing.xl}}; border-bottom: 1px solid #e5e7eb; }
.modal-header h3 { font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0; }
.modal-body { padding: {{spacing.lg}} {{spacing.xl}}; }
.modal-body p { font-size: 0.875rem; color: #6b7280; line-height: 1.6; margin: 0; }
.modal-footer {
  padding: {{spacing.md}} {{spacing.xl}}; border-top: 1px solid #e5e7eb;
  display: flex; justify-content: flex-end; gap: {{spacing.sm}}; background: #f9fafb;
}
.modal-cancel {
  padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}};
  border: 1px solid #d1d5db; background: #fff; color: #374151;
  font-size: 0.875rem; font-weight: 500; cursor: pointer;
}
.modal-confirm {
  padding: {{spacing.sm}} {{spacing.md}}; border-radius: {{borderRadius}};
  border: none; background: #111827; color: #fff;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
}
</style>`,
  },
  "data-table": {
    react: `interface Column { key: string; label: string; }
interface DataTableProps {
  columns?: Column[];
  rows?: Record<string, string>[];
}

export function DataTable({
  columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
  ],
  rows = [
    { name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "Active" },
    { name: "Bob Smith", email: "bob@example.com", role: "Editor", status: "Active" },
    { name: "Carol Davis", email: "carol@example.com", role: "Viewer", status: "Inactive" },
    { name: "Dan Wilson", email: "dan@example.com", role: "Editor", status: "Active" },
    { name: "Eve Martinez", email: "eve@example.com", role: "Admin", status: "Active" },
  ],
}: DataTableProps) {
  return (
    <div style={{ borderRadius: "{{borderRadius}}", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "{{shadow}}" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            {columns.map((col) => (
              <th key={col.key} style={{ padding: "{{spacing.md}} {{spacing.lg}}", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f9fafb")}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "{{spacing.md}} {{spacing.lg}}", color: col.key === "name" ? "#111827" : "#6b7280", fontWeight: col.key === "name" ? 500 : 400 }}>
                  {col.key === "status" ? (
                    <span style={{
                      display: "inline-block", padding: "2px {{spacing.sm}}", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500,
                      background: row[col.key] === "Active" ? "#dcfce7" : "#f3f4f6",
                      color: row[col.key] === "Active" ? "#166534" : "#6b7280",
                    }}>{row[col.key]}</span>
                  ) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`,
    html: `<div class="table-wrapper">
  <table class="data-table">
    <thead>
      <tr>
        <th>Name</th><th>Email</th><th>Role</th><th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="cell-name">Alice Johnson</td><td>alice@example.com</td><td>Admin</td><td><span class="badge-active">Active</span></td></tr>
      <tr><td class="cell-name">Bob Smith</td><td>bob@example.com</td><td>Editor</td><td><span class="badge-active">Active</span></td></tr>
      <tr><td class="cell-name">Carol Davis</td><td>carol@example.com</td><td>Viewer</td><td><span class="badge-inactive">Inactive</span></td></tr>
      <tr><td class="cell-name">Dan Wilson</td><td>dan@example.com</td><td>Editor</td><td><span class="badge-active">Active</span></td></tr>
      <tr><td class="cell-name">Eve Martinez</td><td>eve@example.com</td><td>Admin</td><td><span class="badge-active">Active</span></td></tr>
    </tbody>
  </table>
</div>

<style>
.table-wrapper {
  border-radius: {{borderRadius}}; border: 1px solid #e5e7eb; overflow: hidden;
  box-shadow: {{shadow}}; font-family: system-ui, -apple-system, sans-serif;
}
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.data-table th {
  padding: {{spacing.md}} {{spacing.lg}}; text-align: left; font-weight: 600;
  color: #374151; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
}
.data-table tbody tr { border-bottom: 1px solid #e5e7eb; }
.data-table tbody tr:nth-child(even) { background: #f9fafb; }
.data-table tbody tr:hover { background: #eff6ff; }
.data-table td { padding: {{spacing.md}} {{spacing.lg}}; color: #6b7280; }
.cell-name { color: #111827; font-weight: 500; }
.badge-active {
  display: inline-block; padding: 2px {{spacing.sm}}; border-radius: 9999px;
  font-size: 0.75rem; font-weight: 500; background: #dcfce7; color: #166534;
}
.badge-inactive {
  display: inline-block; padding: 2px {{spacing.sm}}; border-radius: 9999px;
  font-size: 0.75rem; font-weight: 500; background: #f3f4f6; color: #6b7280;
}
</style>`,
  },
  "empty-state": {
    react: `interface EmptyStateProps {
  headline?: string;
  description?: string;
  ctaText?: string;
  onAction?: () => void;
}

export function EmptyState({
  headline = "No projects yet",
  description = "Get started by creating your first project. It only takes a minute to set up.",
  ctaText = "Create Project",
  onAction,
}: EmptyStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "{{spacing.xl}}", textAlign: "center", minHeight: "400px",
    }}>
      <div style={{
        width: "120px", height: "120px", borderRadius: "50%", background: "#f3f4f6",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "{{spacing.lg}}",
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", margin: 0 }}>{headline}</h3>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "{{spacing.sm}}", maxWidth: "360px", lineHeight: 1.6 }}>{description}</p>
      <button onClick={onAction} style={{
        marginTop: "{{spacing.lg}}", padding: "{{spacing.sm}} {{spacing.xl}}", borderRadius: "{{borderRadius}}",
        border: "none", background: "#111827", color: "#fff", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
      }}>{ctaText}</button>
    </div>
  );
}`,
    html: `<div class="empty-state">
  <div class="empty-illustration">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  </div>
  <h3>No projects yet</h3>
  <p>Get started by creating your first project. It only takes a minute to set up.</p>
  <button>Create Project</button>
</div>

<style>
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: {{spacing.xl}}; text-align: center; min-height: 400px;
  font-family: system-ui, -apple-system, sans-serif;
}
.empty-illustration {
  width: 120px; height: 120px; border-radius: 50%; background: #f3f4f6;
  display: flex; align-items: center; justify-content: center; margin-bottom: {{spacing.lg}};
}
.empty-state h3 { font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0; }
.empty-state p { font-size: 0.875rem; color: #6b7280; margin-top: {{spacing.sm}}; max-width: 360px; line-height: 1.6; }
.empty-state button {
  margin-top: {{spacing.lg}}; padding: {{spacing.sm}} {{spacing.xl}}; border-radius: {{borderRadius}};
  border: none; background: #111827; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer;
}
</style>`,
  },
  "sidebar-nav": {
    react: `interface NavItem { icon: string; label: string; href: string; active?: boolean; children?: { label: string; href: string }[]; }

interface SidebarNavProps {
  logo?: string;
  items?: NavItem[];
}

export function SidebarNav({
  logo = "Acme",
  items = [
    { icon: "🏠", label: "Dashboard", href: "#", active: true },
    { icon: "📁", label: "Projects", href: "#", children: [{ label: "All Projects", href: "#" }, { label: "Archived", href: "#" }] },
    { icon: "👥", label: "Team", href: "#" },
    { icon: "📊", label: "Analytics", href: "#" },
    { icon: "⚙️", label: "Settings", href: "#" },
  ],
}: SidebarNavProps) {
  const [expanded, setExpanded] = React.useState<string | null>("Projects");
  return (
    <aside style={{
      width: "260px", minHeight: "100vh", background: "#fff", borderRight: "1px solid #e5e7eb",
      padding: "{{spacing.lg}} 0", display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "0 {{spacing.lg}}", marginBottom: "{{spacing.xl}}" }}>
        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>{logo}</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
        {items.map((item) => (
          <div key={item.label}>
            <a
              href={item.href}
              onClick={item.children ? (e) => { e.preventDefault(); setExpanded(expanded === item.label ? null : item.label); } : undefined}
              style={{
                display: "flex", alignItems: "center", gap: "{{spacing.sm}}",
                padding: "{{spacing.sm}} {{spacing.lg}}", fontSize: "0.875rem", fontWeight: 500,
                color: item.active ? "#111827" : "#6b7280", textDecoration: "none",
                background: item.active ? "#f3f4f6" : "transparent",
                borderRadius: "{{borderRadius}}", margin: "0 {{spacing.sm}}",
              }}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.children && <span style={{ fontSize: "0.75rem", color: "#9ca3af", transform: expanded === item.label ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>}
            </a>
            {item.children && expanded === item.label && (
              <div style={{ marginLeft: "calc({{spacing.lg}} + 1.25rem + {{spacing.sm}})", display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px" }}>
                {item.children.map((child) => (
                  <a key={child.label} href={child.href} style={{
                    display: "block", padding: "{{spacing.sm}} {{spacing.md}}", fontSize: "0.8125rem",
                    color: "#6b7280", textDecoration: "none", borderRadius: "{{borderRadius}}",
                  }}>{child.label}</a>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}`,
    html: `<aside class="sidebar">
  <div class="sidebar-logo">Acme</div>
  <nav class="sidebar-nav">
    <a href="#" class="nav-item active"><span class="nav-icon">🏠</span>Dashboard</a>
    <div class="nav-group">
      <button class="nav-item"><span class="nav-icon">📁</span><span class="nav-label">Projects</span><span class="nav-arrow">▶</span></button>
      <div class="nav-children">
        <a href="#">All Projects</a>
        <a href="#">Archived</a>
      </div>
    </div>
    <a href="#" class="nav-item"><span class="nav-icon">👥</span>Team</a>
    <a href="#" class="nav-item"><span class="nav-icon">📊</span>Analytics</a>
    <a href="#" class="nav-item"><span class="nav-icon">⚙️</span>Settings</a>
  </nav>
</aside>

<style>
.sidebar {
  width: 260px; min-height: 100vh; background: #fff; border-right: 1px solid #e5e7eb;
  padding: {{spacing.lg}} 0; display: flex; flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
}
.sidebar-logo { padding: 0 {{spacing.lg}}; margin-bottom: {{spacing.xl}}; font-size: 1.25rem; font-weight: 700; color: #111827; }
.sidebar-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: {{spacing.sm}};
  padding: {{spacing.sm}} {{spacing.lg}}; font-size: 0.875rem; font-weight: 500;
  color: #6b7280; text-decoration: none; border-radius: {{borderRadius}};
  margin: 0 {{spacing.sm}}; background: none; border: none; cursor: pointer; width: calc(100% - {{spacing.sm}} - {{spacing.sm}});
  box-sizing: border-box; text-align: left;
}
.nav-item:hover { background: #f9fafb; color: #111827; }
.nav-item.active { background: #f3f4f6; color: #111827; }
.nav-icon { flex-shrink: 0; }
.nav-label { flex: 1; }
.nav-arrow { font-size: 0.75rem; color: #9ca3af; }
.nav-children { margin-left: calc({{spacing.lg}} + 1.5rem); display: flex; flex-direction: column; gap: 2px; }
.nav-children a {
  display: block; padding: {{spacing.sm}} {{spacing.md}}; font-size: 0.8125rem;
  color: #6b7280; text-decoration: none; border-radius: {{borderRadius}};
}
.nav-children a:hover { color: #111827; background: #f9fafb; }
</style>`,
  },
  "breadcrumb": {
    react: `interface BreadcrumbItem { label: string; href?: string; }

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumb({
  items = [
    { label: "Home", href: "#" },
    { label: "Projects", href: "#" },
    { label: "Acme Website", href: "#" },
    { label: "Settings" },
  ],
}: BreadcrumbProps) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "{{spacing.sm}}", padding: "{{spacing.sm}} 0" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "{{spacing.sm}}" }}>
          {i > 0 && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
          {item.href ? (
            <a href={item.href} style={{
              fontSize: "0.875rem", color: "#6b7280", textDecoration: "none", fontWeight: 400,
            }}>{item.label}</a>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "#111827", fontWeight: 500 }}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}`,
    html: `<nav class="breadcrumb">
  <a href="#">Home</a>
  <span class="breadcrumb-sep">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </span>
  <a href="#">Projects</a>
  <span class="breadcrumb-sep">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </span>
  <a href="#">Acme Website</a>
  <span class="breadcrumb-sep">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </span>
  <span class="breadcrumb-current">Settings</span>
</nav>

<style>
.breadcrumb {
  display: flex; align-items: center; gap: {{spacing.sm}}; padding: {{spacing.sm}} 0;
  font-family: system-ui, -apple-system, sans-serif;
}
.breadcrumb a { font-size: 0.875rem; color: #6b7280; text-decoration: none; }
.breadcrumb a:hover { color: #111827; }
.breadcrumb-sep { display: flex; align-items: center; }
.breadcrumb-current { font-size: 0.875rem; color: #111827; font-weight: 500; }
</style>`,
  },
  "avatar-group": {
    react: `interface AvatarGroupProps {
  avatars?: { name: string; url?: string; color?: string }[];
  max?: number;
  size?: number;
}

export function AvatarGroup({
  avatars = [
    { name: "Alice", color: "#818cf8" },
    { name: "Bob", color: "#34d399" },
    { name: "Carol", color: "#f472b6" },
    { name: "Dan", color: "#fb923c" },
    { name: "Eve", color: "#38bdf8" },
    { name: "Frank", color: "#a78bfa" },
    { name: "Grace", color: "#f87171" },
  ],
  max = 5,
  size = 40,
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {visible.map((avatar, i) => (
        <div key={i} style={{
          width: size, height: size, borderRadius: "50%", border: "2px solid #fff",
          background: avatar.url ? \`url(\${avatar.url}) center/cover\` : avatar.color || "#e0e7ff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem", fontWeight: 600, color: "#fff",
          marginLeft: i === 0 ? 0 : "-10px", position: "relative", zIndex: max - i,
          boxShadow: "{{shadow}}",
        }}>
          {!avatar.url && avatar.name.charAt(0)}
        </div>
      ))}
      {remaining > 0 && (
        <div style={{
          width: size, height: size, borderRadius: "50%", border: "2px solid #fff",
          background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem", fontWeight: 600, color: "#6b7280",
          marginLeft: "-10px", boxShadow: "{{shadow}}",
        }}>
          +{remaining}
        </div>
      )}
    </div>
  );
}`,
    html: `<div class="avatar-group">
  <div class="avatar" style="background: #818cf8;">A</div>
  <div class="avatar" style="background: #34d399;">B</div>
  <div class="avatar" style="background: #f472b6;">C</div>
  <div class="avatar" style="background: #fb923c;">D</div>
  <div class="avatar" style="background: #38bdf8;">E</div>
  <div class="avatar avatar-count">+2</div>
</div>

<style>
.avatar-group {
  display: flex; align-items: center;
  font-family: system-ui, -apple-system, sans-serif;
}
.avatar {
  width: 40px; height: 40px; border-radius: 50%; border: 2px solid #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 600; color: #fff;
  margin-left: -10px; box-shadow: {{shadow}};
}
.avatar:first-child { margin-left: 0; }
.avatar-count { background: #f3f4f6; color: #6b7280; }
</style>`,
  },
  "badge-collection": {
    react: `type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const badgeColors: Record<BadgeVariant, { bg: string; color: string; dot: string }> = {
  success: { bg: "#dcfce7", color: "#166534", dot: "#16a34a" },
  warning: { bg: "#fef3c7", color: "#92400e", dot: "#d97706" },
  error: { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
  info: { bg: "#dbeafe", color: "#1e40af", dot: "#2563eb" },
  neutral: { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
};

export function Badge({ label, variant = "neutral" }: BadgeProps) {
  const c = badgeColors[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px {{spacing.md}}", borderRadius: "9999px",
      background: c.bg, fontSize: "0.75rem", fontWeight: 500, color: c.color,
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.dot }} />
      {label}
    </span>
  );
}

export function BadgeCollection() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "{{spacing.sm}}", padding: "{{spacing.md}}" }}>
      <Badge label="Completed" variant="success" />
      <Badge label="In Progress" variant="warning" />
      <Badge label="Failed" variant="error" />
      <Badge label="New" variant="info" />
      <Badge label="Draft" variant="neutral" />
    </div>
  );
}`,
    html: `<div class="badge-collection">
  <span class="badge badge-success"><span class="badge-dot"></span>Completed</span>
  <span class="badge badge-warning"><span class="badge-dot"></span>In Progress</span>
  <span class="badge badge-error"><span class="badge-dot"></span>Failed</span>
  <span class="badge badge-info"><span class="badge-dot"></span>New</span>
  <span class="badge badge-neutral"><span class="badge-dot"></span>Draft</span>
</div>

<style>
.badge-collection {
  display: flex; flex-wrap: wrap; gap: {{spacing.sm}}; padding: {{spacing.md}};
  font-family: system-ui, -apple-system, sans-serif;
}
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px {{spacing.md}}; border-radius: 9999px;
  font-size: 0.75rem; font-weight: 500;
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; }
.badge-success { background: #dcfce7; color: #166534; }
.badge-success .badge-dot { background: #16a34a; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-warning .badge-dot { background: #d97706; }
.badge-error { background: #fee2e2; color: #991b1b; }
.badge-error .badge-dot { background: #dc2626; }
.badge-info { background: #dbeafe; color: #1e40af; }
.badge-info .badge-dot { background: #2563eb; }
.badge-neutral { background: #f3f4f6; color: #374151; }
.badge-neutral .badge-dot { background: #9ca3af; }
</style>`,
  },
};

const TEMPLATE_KEYWORDS: Record<string, string[]> = {
  "pricing-card": ["pricing", "card", "plan", "subscription"],
  "login-form": ["login", "signin", "sign-in", "auth"],
  "hero-section": ["hero", "banner", "landing", "headline"],
  "navbar": ["navbar", "nav", "navigation", "header", "topbar"],
  "footer": ["footer", "bottom"],
  "feature-grid": ["feature", "grid", "benefits"],
  "testimonial-card": ["testimonial", "review", "quote"],
  "faq-accordion": ["faq", "accordion", "question", "collapsible"],
  "stats-section": ["stats", "statistics", "numbers", "metrics"],
  "cta-banner": ["cta", "call-to-action", "calltoaction"],
  "team-grid": ["team", "members", "people", "staff"],
  "contact-form": ["contact", "message", "inquiry"],
  "notification-toast": ["toast", "notification", "alert", "snackbar"],
  "modal-dialog": ["modal", "dialog", "popup", "overlay", "confirm"],
  "data-table": ["table", "data", "list", "grid", "datagrid"],
  "empty-state": ["empty", "no-data", "placeholder", "blank"],
  "sidebar-nav": ["sidebar", "sidenav", "drawer", "menu"],
  "breadcrumb": ["breadcrumb", "crumb", "trail", "path"],
  "avatar-group": ["avatar", "group", "stack", "faces"],
  "badge-collection": ["badge", "tag", "status", "chip", "pill"],
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
  const lower = component.toLowerCase().replace(/[^a-z0-9]/g, " ");
  let bestMatch: string | null = null;
  let bestScore = 0;
  for (const [key, keywords] of Object.entries(TEMPLATE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }
  return bestMatch;
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
