import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { spawn } from "node:child_process";

async function collectTestFiles(rootDir) {
  const results = [];
  const entries = await readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await collectTestFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      results.push(absolutePath);
    }
  }

  return results;
}

const cwd = process.cwd();
const testRoot = join(cwd, "test");

let testFiles = [];

try {
  testFiles = await collectTestFiles(testRoot);
} catch (error) {
  if (error && typeof error === "object" && error.code !== "ENOENT") {
    throw error;
  }
}

if (testFiles.length === 0) {
  console.log("No .test.ts files found under ./test; skipping Node test runner.");
  process.exit(0);
}

const relativeTestFiles = testFiles
  .map((file) => relative(cwd, file))
  .sort();

const child = spawn(
  process.execPath,
  ["--test", "--experimental-strip-types", ...relativeTestFiles],
  {
    cwd,
    stdio: "inherit"
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
