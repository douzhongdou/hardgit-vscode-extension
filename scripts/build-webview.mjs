import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import esbuild from "esbuild";

const outputDir = join(process.cwd(), "dist", "webview");
const pathShim = join(process.cwd(), "scripts", "shims", "path-browser.js");

await mkdir(outputDir, { recursive: true });
await esbuild.build({
  entryPoints: [join("src", "webview", "index.tsx")],
  outdir: outputDir,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2022"],
  jsx: "automatic",
  jsxImportSource: "react",
  sourcemap: true,
  alias: {
    path: pathShim
  },
  entryNames: "index",
  assetNames: "assets/[name]-[hash]",
  loader: {
    ".css": "css",
    ".wasm": "file"
  },
  logLevel: "info"
});

console.log(`Built webview bundle to ${outputDir}`);
