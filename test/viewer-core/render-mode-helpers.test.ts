import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  BoxGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial
} from "three";
import { VIEWER_EDGE_HELPER_FLAG } from "../../src/viewer-core/utils/entityTree.ts";

async function loadRenderModeHelpersModule() {
  return import(
    pathToFileURL(
      resolve(process.cwd(), "src/viewer-core/control/renderModeHelpers.ts")
    ).href
  );
}

test("solid mode hides existing edge helpers so solid shading stays clean", async () => {
  const { syncObjectRenderState } = await loadRenderModeHelpersModule();
  const root = new Group();
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  const helper = new LineSegments(mesh.geometry, new LineBasicMaterial());

  helper.userData[VIEWER_EDGE_HELPER_FLAG] = true;
  helper.visible = false;
  mesh.add(helper);
  root.add(mesh);

  syncObjectRenderState(root, {
    backgroundMode: "dark",
    renderMode: "solid",
    selectedEntityId: null
  });

  assert.equal(helper.visible, false);

  mesh.visible = false;
  syncObjectRenderState(root, {
    backgroundMode: "dark",
    renderMode: "solid",
    selectedEntityId: null
  });

  assert.equal(helper.visible, false);

  mesh.visible = true;
  syncObjectRenderState(root, {
    backgroundMode: "dark",
    renderMode: "solid",
    selectedEntityId: null
  });

  assert.equal(helper.visible, false);
});

test("solid mode does not create edge helpers for mesh definition", async () => {
  const { syncObjectRenderState } = await loadRenderModeHelpersModule();
  const root = new Group();
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());

  root.add(mesh);

  syncObjectRenderState(root, {
    backgroundMode: "dark",
    renderMode: "solid",
    selectedEntityId: null
  });

  const helper = mesh.children.find(
    (child): child is LineSegments =>
      child instanceof LineSegments &&
      child.userData[VIEWER_EDGE_HELPER_FLAG] === true
  );

  assert.equal(helper, undefined);
});

test("disposing viewer helpers releases helper geometry and material", async () => {
  const { disposeViewerHelpers } = await loadRenderModeHelpersModule();
  const root = new Group();
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  const helperGeometry = new BoxGeometry(1, 1, 1);
  const helperMaterial = new LineBasicMaterial();
  const helper = new LineSegments(helperGeometry, helperMaterial);

  helper.userData[VIEWER_EDGE_HELPER_FLAG] = true;
  root.add(mesh);
  mesh.add(helper);

  let geometryDisposed = false;
  let materialDisposed = false;
  helperGeometry.dispose = () => {
    geometryDisposed = true;
  };
  helperMaterial.dispose = () => {
    materialDisposed = true;
  };

  disposeViewerHelpers(root);

  assert.equal(mesh.children.includes(helper), false);
  assert.equal(geometryDisposed, true);
  assert.equal(materialDisposed, true);
});
