import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function loadTypesModule() {
  return import(pathToFileURL(resolve(process.cwd(), "src/viewer-core/types.ts")).href);
}

test("toSupportedModelExtension accepts all hardgit preview model formats", async () => {
  const { toSupportedModelExtension } = await loadTypesModule();

  assert.equal(toSupportedModelExtension("glb"), "glb");
  assert.equal(toSupportedModelExtension("GLTF"), "gltf");
  assert.equal(toSupportedModelExtension("fbx"), "fbx");
  assert.equal(toSupportedModelExtension("obj"), "obj");
  assert.equal(toSupportedModelExtension("stl"), "stl");
  assert.equal(toSupportedModelExtension("ply"), "ply");
  assert.equal(toSupportedModelExtension("dae"), "dae");
  assert.equal(toSupportedModelExtension("step"), "step");
  assert.equal(toSupportedModelExtension("stp"), "stp");
  assert.equal(toSupportedModelExtension("IGES"), "iges");
  assert.equal(toSupportedModelExtension("igs"), "igs");
  assert.equal(toSupportedModelExtension("3dm"), null);
});

test("createVersionedModelUrl appends the document version as a query parameter for refresh busting", async () => {
  const { createVersionedModelUrl } = await loadTypesModule();

  assert.equal(
    createVersionedModelUrl("https://example.com/model.glb", 3),
    "https://example.com/model.glb?hardgitVersion=3"
  );

  assert.equal(
    createVersionedModelUrl("https://example.com/model.gltf?token=abc", 9),
    "https://example.com/model.gltf?token=abc&hardgitVersion=9"
  );

  assert.equal(
    createVersionedModelUrl("https://example.com/model.glb#preview", 11),
    "https://example.com/model.glb?hardgitVersion=11#preview"
  );

  assert.equal(
    createVersionedModelUrl("blob:mock-model", 5),
    "blob:mock-model"
  );
});

test("getStepSupportError explains the occt runtime requirement", async () => {
  const { getStepSupportError } = await loadTypesModule();

  assert.match(getStepSupportError().message, /occt-import-js/);
  assert.match(getStepSupportError().message, /step\/stp/i);
});
