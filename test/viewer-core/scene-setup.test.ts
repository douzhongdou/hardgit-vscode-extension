import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function readSceneSetupSource(): Promise<string> {
  return readFile(resolve(process.cwd(), "src/viewer-core/engine/SceneSetup.tsx"), "utf8");
}

test("scene setup uses stronger contrast lighting for solid shading", async () => {
  const source = await readSceneSetupSource();

  assert.match(source, /toneMappingExposure = backgroundMode === "light" \? 1\.12 : 1\.08;/);
  assert.match(source, /ambientLight intensity=\{backgroundMode === "light" \? 0\.24 : 0\.16\}/);
  assert.match(source, /directionalLight[\s\S]*intensity=\{backgroundMode === "light" \? 3\.4 : 3\.9\}/);
  assert.match(source, /directionalLight[\s\S]*intensity=\{backgroundMode === "light" \? 0\.34 : 0\.42\}[\s\S]*position=\{\[-8, 3\.5, -7\]\}/);
});
