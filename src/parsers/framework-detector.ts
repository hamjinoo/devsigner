export type Framework = "react" | "vue" | "svelte" | "html";

export function detectFramework(code: string): Framework {
  if (/import\s+.*\s+from\s+['"]react['"]/.test(code) || /className\s*=/.test(code) || /useState|useEffect|useRef/.test(code)) {
    return "react";
  }

  if (/<template\s*>/.test(code) || /<script\s+setup/.test(code) || /v-bind|v-if|v-for|:class/.test(code)) {
    return "vue";
  }

  if (/\{#if\s/.test(code) || /\{#each\s/.test(code) || /on:click/.test(code) || /\$:/.test(code)) {
    return "svelte";
  }

  return "html";
}
