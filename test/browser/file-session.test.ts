import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

class MockFile extends Blob {
  public readonly name: string;
  public readonly webkitRelativePath: string;

  public constructor(
    parts: BlobPart[],
    name: string,
    options?: BlobPropertyBag & { webkitRelativePath?: string }
  ) {
    super(parts, options);
    this.name = name;
    this.webkitRelativePath = options?.webkitRelativePath ?? "";
  }
}

async function loadFileSessionModule() {
  return import(pathToFileURL(resolve(process.cwd(), "src/browser/fileSession.ts")).href);
}

test("selectPrimaryModelFile picks the first supported model file", async () => {
  const { selectPrimaryModelFile } = await loadFileSessionModule();

  const selection = selectPrimaryModelFile([
    new MockFile(["ignored"], "readme.txt"),
    new MockFile(["gltf"], "chair.gltf"),
    new MockFile(["glb"], "backup.glb")
  ]);

  assert.ok(selection);
  assert.equal(selection.fileName, "chair.gltf");
  assert.equal(selection.extension, "gltf");
  assert.deepEqual(selection.assetKeys, ["chair.gltf"]);
});

test("createBrowserFileSession maps companion assets for local gltf packs", async () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  let nextUrlId = 0;
  const revokedUrls: string[] = [];

  URL.createObjectURL = () => `blob:mock-${++nextUrlId}`;
  URL.revokeObjectURL = (url) => {
    revokedUrls.push(url);
  };

  try {
    const { createBrowserFileSession, revokeBrowserFileSession } =
      await loadFileSessionModule();
    const session = createBrowserFileSession(
      [
        new MockFile(["gltf"], "chair.gltf"),
        new MockFile(["bin"], "chair.bin"),
        new MockFile(["img"], "textures/base.png", {
          webkitRelativePath: "textures/base.png"
        })
      ],
      4
    );

    assert.ok(session);
    assert.deepEqual(session.documentState, {
      uri: "blob:mock-1",
      extension: "gltf",
      fileName: "chair.gltf",
      version: 4
    });
    assert.equal(session.assetMap["chair.gltf"], "blob:mock-1");
    assert.equal(session.assetMap["chair.bin"], "blob:mock-2");
    assert.equal(session.assetMap["textures/base.png"], "blob:mock-3");
    assert.equal(session.assetMap["base.png"], "blob:mock-3");

    revokeBrowserFileSession(session);
    assert.deepEqual(revokedUrls, ["blob:mock-1", "blob:mock-2", "blob:mock-3"]);
  } finally {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
  }
});
