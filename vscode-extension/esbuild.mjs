import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"], // provided by VS Code at runtime
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
  minify: false, // keep readable for debugging
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(options);
  console.log("Build complete.");
}
