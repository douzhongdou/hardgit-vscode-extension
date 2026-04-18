import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function readWorkspaceFile(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), "utf8");
}

test("empty STEP geometry errors explain that the assembly tree loaded without triangles", async () => {
  const source = await readWorkspaceFile("src/viewer-core/engine/model-load-result.ts");

  assert.match(
    source,
    /STEP assembly structure loaded, but no renderable mesh geometry was produced\./
  );
});
