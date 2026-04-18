import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";

async function loadViewerStoreModule() {
  return import(
    pathToFileURL(
      resolve(process.cwd(), "src/viewer-core/stores/viewerStore.ts")
    ).href
  );
}

async function loadEntityStoreModule() {
  return import(
    pathToFileURL(
      resolve(process.cwd(), "src/viewer-core/stores/entityStore.ts")
    ).href
  );
}

test("viewerStore cycles render and background state and records fit-view requests", async () => {
  const { useViewerStore } = await loadViewerStoreModule();

  useViewerStore.getState().reset();
  useViewerStore.getState().setHasModel(true);
  useViewerStore.getState().setRenderMode("wireframe");
  useViewerStore.getState().toggleBackgroundMode();
  useViewerStore.getState().requestFitView();

  const state = useViewerStore.getState();

  assert.equal(state.hasModel, true);
  assert.equal(state.renderMode, "wireframe");
  assert.equal(state.backgroundMode, "light");
  assert.equal(state.fitViewToken, 1);

  useViewerStore.getState().cycleRenderMode();
  assert.equal(useViewerStore.getState().renderMode, "edges");
});

test("entityStore builds entities from a model and propagates visibility changes", async () => {
  const { useEntityStore } = await loadEntityStoreModule();
  const root = new Group();
  const assembly = new Group();
  const part = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());

  assembly.name = "Assembly";
  part.name = "Part";
  assembly.add(part);
  root.add(assembly);

  useEntityStore.getState().reset();
  useEntityStore.getState().setEntitiesFromObject(root);

  const initialTree = useEntityStore.getState().entities;
  const assemblyNode = initialTree[0];

  assert.equal(initialTree.length, 1);
  assert.equal(assemblyNode?.children[0]?.name, "Part");

  useEntityStore.getState().toggleEntityVisibility(assemblyNode!.id);

  const nextTree = useEntityStore.getState().entities;

  assert.equal(assembly.visible, false);
  assert.equal(part.visible, false);
  assert.equal(nextTree[0]?.visible, false);
  assert.equal(nextTree[0]?.children[0]?.visible, false);

  useEntityStore.getState().selectEntity(assemblyNode!.id);
  assert.equal(useEntityStore.getState().selectedEntityId, assemblyNode!.id);
});
