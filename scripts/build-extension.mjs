import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import esbuild from "esbuild";

const outputDir = join(process.cwd(), "dist", "extension");
const outputFile = join(outputDir, "extension.js");

await mkdir(outputDir, { recursive: true });
await esbuild.build({
  entryPoints: [join("src", "extension", "extension.ts")],
  outfile: outputFile,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: ["node18"],
  external: ["vscode"],
  sourcemap: true,
  logLevel: "info"
});

console.log(`Built extension bundle to ${outputFile}`);
