import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function loadStepLoaderModule() {
  return import(
    pathToFileURL(
      resolve(process.cwd(), "src/viewer-core/engine/step-loader-utils.ts")
    ).href
  );
}

test("resolveStepAssetUrl resolves emitted wasm assets against the webview base URI", async () => {
  const { resolveStepAssetUrl } = await loadStepLoaderModule();

  assert.equal(
    resolveStepAssetUrl("./assets/occt-import-js-abc.wasm", "https://webview.test/dist/webview/"),
    "https://webview.test/dist/webview/assets/occt-import-js-abc.wasm"
  );
});

test("createStepIndexArray keeps large index buffers in Uint32Array", async () => {
  const { createStepIndexArray } = await loadStepLoaderModule();
  const result = createStepIndexArray([0, 12, 70000]);

  assert.equal(result instanceof Uint32Array, true);
  assert.deepEqual(Array.from(result), [0, 12, 70000]);
});

test("loadCachedModule clears rejected promises so later retries can succeed", async () => {
  const { loadCachedModule } = await loadStepLoaderModule();
  const cache = new Map<string, Promise<string>>();
  let attempt = 0;

  await assert.rejects(() =>
    loadCachedModule(cache, "occt", async () => {
      attempt += 1;
      throw new Error(`fail-${attempt}`);
    })
  );

  assert.equal(cache.has("occt"), false);

  const result = await loadCachedModule(cache, "occt", async () => {
    attempt += 1;
    return `ok-${attempt}`;
  });

  assert.equal(result, "ok-2");
});
