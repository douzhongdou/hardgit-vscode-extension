import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function readPackageJson() {
  const source = await readFile(resolve(process.cwd(), "package.json"), "utf8");
  return JSON.parse(source) as {
    icon?: string;
    repository?: {
      type?: string;
      url?: string;
    };
    license?: string;
    scripts?: Record<string, string>;
  };
}

async function readVscodeIgnore(): Promise<string> {
  return readFile(resolve(process.cwd(), ".vscodeignore"), "utf8");
}

test("package metadata includes repository and license information", async () => {
  const packageJson = await readPackageJson();

  assert.equal(packageJson.icon, "hardgit-vscode-icon.png");
  assert.deepEqual(packageJson.repository, {
    type: "git",
    url: "https://github.com/douzhongdou/hardgit-vscode.git"
  });
  assert.equal(packageJson.license, "MIT");
});

test("workspace includes a LICENSE file for packaging", async () => {
  await access(resolve(process.cwd(), "LICENSE"));
});

test("package scripts expose the browser preview dev entry", async () => {
  const packageJson = await readPackageJson();

  assert.equal(packageJson.scripts?.["dev:web"], "node ./scripts/dev-browser.mjs");
});

test(".vscodeignore excludes the browser preview dev output from vsix packaging", async () => {
  const vscodeIgnore = await readVscodeIgnore();

  assert.match(vscodeIgnore, /^\.dev\/\*\*$/m);
});
