import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function loadWebviewTypesModule() {
  return import(pathToFileURL(resolve(process.cwd(), "src/webview/types.ts")).href);
}

test("reduceDocumentState ignores duplicate and stale document messages", async () => {
  const { reduceDocumentState } = await loadWebviewTypesModule();

  const opened = reduceDocumentState(null, {
    type: "open-document",
    uri: "https://example.com/model.glb",
    extension: "glb",
    fileName: "model.glb",
    version: 1
  });

  assert.deepEqual(opened, {
    uri: "https://example.com/model.glb",
    extension: "glb",
    fileName: "model.glb",
    version: 1
  });

  assert.equal(
    reduceDocumentState(opened, {
      type: "open-document",
      uri: "https://example.com/model.glb",
      extension: "glb",
      fileName: "model.glb",
      version: 1
    }),
    opened
  );

  assert.equal(
    reduceDocumentState(opened, {
      type: "refresh-document",
      uri: "https://example.com/model.glb",
      version: 1
    }),
    opened
  );

  const refreshed = reduceDocumentState(opened, {
    type: "refresh-document",
    uri: "https://example.com/model.glb",
    version: 2
  });

  assert.deepEqual(refreshed, {
    uri: "https://example.com/model.glb",
    extension: "glb",
    fileName: "model.glb",
    version: 2
  });

  assert.equal(
    reduceDocumentState(refreshed, {
      type: "open-document",
      uri: "https://example.com/model.glb",
      extension: "glb",
      fileName: "model.glb",
      version: 1
    }),
    refreshed
  );
});

test("reduceDocumentState still accepts opening a different document", async () => {
  const { reduceDocumentState } = await loadWebviewTypesModule();

  const current = reduceDocumentState(null, {
    type: "open-document",
    uri: "https://example.com/first.glb",
    extension: "glb",
    fileName: "first.glb",
    version: 8
  });

  const next = reduceDocumentState(current, {
    type: "open-document",
    uri: "https://example.com/second.step",
    extension: "step",
    fileName: "second.step",
    version: 1
  });

  assert.deepEqual(next, {
    uri: "https://example.com/second.step",
    extension: "step",
    fileName: "second.step",
    version: 1
  });
});
