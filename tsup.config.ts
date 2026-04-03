import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node18",
    outDir: "dist",
    clean: true,
    sourcemap: true,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  {
    entry: ["src/review.ts"],
    format: ["esm"],
    target: "node18",
    outDir: "dist",
    clean: false,
    sourcemap: true,
  },
]);
