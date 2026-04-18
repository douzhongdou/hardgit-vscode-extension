import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Group } from "three";

async function loadModelLoadResultModule() {
  return import(
    pathToFileURL(
      resolve(process.cwd(), "src/viewer-core/engine/model-load-result.ts")
    ).href
  );
}

test("createRenderableModelLoadResult rejects models that contain no renderable triangles", async () => {
  const { createRenderableModelLoadResult } = await loadModelLoadResultModule();

  assert.throws(
    () => createRenderableModelLoadResult(new Group()),
    /STEP assembly structure loaded, but no renderable mesh geometry was produced/i
  );
});

test("createRenderableModelLoadResult reports the loaded mesh stats for renderable models", async () => {
  const { createRenderableModelLoadResult } = await loadModelLoadResultModule();
  const { BoxGeometry, Mesh, MeshStandardMaterial } = await import("three");
  const model = new Group();

  model.add(new Mesh(new BoxGeometry(2, 4, 6), new MeshStandardMaterial()));

  const result = createRenderableModelLoadResult(model);

  assert.equal(result.vertices, 24);
  assert.equal(result.faces, 12);
  assert.deepEqual(result.size, { x: 2, y: 4, z: 6 });
});
