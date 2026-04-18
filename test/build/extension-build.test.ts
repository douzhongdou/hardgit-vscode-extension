import test from "node:test";
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const cwd = process.cwd();
const extensionOutputPath = resolve(cwd, "dist", "extension", "extension.js");

async function runBuildScript(scriptPath: string) {
  await rm(extensionOutputPath, { force: true });

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd,
      stdio: "inherit"
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        rejectPromise(new Error(`build exited with signal ${signal}`));
        return;
      }

      if (code !== 0) {
        rejectPromise(new Error(`build exited with code ${code ?? "unknown"}`));
        return;
      }

      resolvePromise();
    });

    child.on("error", rejectPromise);
  });
}

test("build-extension emits a real bundle that registers ThreePreviewEditorProvider", async () => {
  await runBuildScript(resolve(cwd, "scripts", "build-extension.mjs"));

  const bundle = await readFile(extensionOutputPath, "utf8");

  assert.match(bundle, /ThreePreviewEditorProvider/);
  assert.match(bundle, /registerCustomEditorProvider/);
});
