import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { BoxGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial } from "three";

async function loadEntityTreeModule() {
  return import(
    pathToFileURL(
      resolve(process.cwd(), "src/viewer-core/utils/entityTree.ts")
    ).href
  );
}

test("buildEntityTree keeps recursive scene nodes and skips viewer edge helpers", async () => {
  const { buildEntityTree, VIEWER_EDGE_HELPER_FLAG } = await loadEntityTreeModule();
  const root = new Group();
  const assembly = new Group();
  const part = new Mesh(new BoxGeometry(2, 4, 6), new MeshStandardMaterial());
  const edgeHelper = new LineSegments(part.geometry, new LineBasicMaterial());

  root.name = "root";
  assembly.name = "Assembly";
  part.name = "Part";
  edgeHelper.userData[VIEWER_EDGE_HELPER_FLAG] = true;

  part.add(edgeHelper);
  assembly.add(part);
  root.add(assembly);

  const tree = buildEntityTree(root);

  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.name, "Assembly");
  assert.equal(tree[0]?.kind, "group");
  assert.equal(tree[0]?.children.length, 1);
  assert.equal(tree[0]?.children[0]?.name, "Part");
  assert.equal(tree[0]?.children[0]?.kind, "mesh");
  assert.equal(tree[0]?.children[0]?.children.length, 0);
});
