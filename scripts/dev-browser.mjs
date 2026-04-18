import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import esbuild from "esbuild";

const outputDir = join(process.cwd(), ".dev", "browser");
const templatePath = join(process.cwd(), "src", "browser", "index.html");
const pathShim = join(process.cwd(), "scripts", "shims", "path-browser.js");

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, "index.html"), await readFile(templatePath, "utf8"));

const context = await esbuild.context({
  entryPoints: [join("src", "browser", "index.tsx")],
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

await context.watch();

const { host, port } = await context.serve({
  servedir: outputDir
});

console.log(`hardgit browser preview: http://${host ?? "127.0.0.1"}:${port}`);
