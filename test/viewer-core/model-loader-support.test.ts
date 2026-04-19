import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function readModelLoaderSource(): Promise<string> {
  return readFile(
    resolve(process.cwd(), "src/viewer-core/engine/ModelLoaderR3F.tsx"),
    "utf8"
  );
}

async function readOcctTypesSource(): Promise<string> {
  return readFile(
    resolve(process.cwd(), "src/viewer-core/engine/occt-import-js.d.ts"),
    "utf8"
  );
}

test("model loader wires the extra exchange-format loaders used by hardgit", async () => {
  const source = await readModelLoaderSource();

  assert.match(source, /FBXLoader/);
  assert.match(source, /OBJLoader/);
  assert.match(source, /STLLoader/);
  assert.match(source, /PLYLoader/);
  assert.match(source, /ColladaLoader/);
  assert.match(source, /IgesLoader/);
  assert.match(source, /extension === "fbx"/);
  assert.match(source, /extension === "obj"/);
  assert.match(source, /extension === "stl"/);
  assert.match(source, /extension === "ply"/);
  assert.match(source, /extension === "dae"/);
  assert.match(source, /extension === "iges"/);
  assert.match(source, /extension === "igs"/);
});

test("occt type declarations include the IGES browser import entrypoint", async () => {
  const source = await readOcctTypesSource();

  assert.match(source, /ReadIgesFile\(fileBuffer: Uint8Array, params: null\): OcctReadResult;/);
});
