import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function readWorkspaceFile(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), "utf8");
}

test("toolbar render mode buttons select explicit modes instead of cycling blindly", async () => {
  const source = await readWorkspaceFile("src/viewer-core/components/Toolbar.tsx");

  assert.match(source, /onClick=\{\(\) => onRenderModeChange\("solid"\)\}/);
  assert.match(source, /onClick=\{\(\) => onRenderModeChange\("wireframe"\)\}/);
  assert.match(source, /onClick=\{\(\) => onRenderModeChange\("edges"\)\}/);
  assert.doesNotMatch(source, /label="Solid Mode"[\s\S]*onClick=\{onCycleRenderMode\}/);
  assert.doesNotMatch(source, /label="Wireframe Mode"[\s\S]*onClick=\{onCycleRenderMode\}/);
  assert.doesNotMatch(source, /label="Edges Mode"[\s\S]*onClick=\{onCycleRenderMode\}/);
});

test("viewer-facing UI copy stays in English", async () => {
  const files = [
    "src/viewer-core/ThreePreviewEditor.tsx",
    "src/viewer-core/components/EntityTree.tsx",
    "src/viewer-core/components/ErrorState.tsx",
    "src/viewer-core/components/LoadingState.tsx",
    "src/viewer-core/components/Sidebar.tsx",
    "src/viewer-core/components/RightSidebar.tsx",
    "src/browser/App.tsx",
    "src/extension/getWebviewHtml.ts",
    "src/viewer-core/types.ts"
  ];

  for (const file of files) {
    const source = await readWorkspaceFile(file);
    assert.doesNotMatch(
      source,
      /[\u3400-\u9fff]/,
      `${file} still contains non-English UI copy`
    );
  }
});

test("floating sidebars do not force the main stage to reflow", async () => {
  const source = await readWorkspaceFile("src/viewer-core/ThreePreviewEditor.tsx");
  const styles = await readWorkspaceFile("src/webview/viewer-layout.css");
  const rootStyles = await readWorkspaceFile("src/webview/styles.css");

  assert.match(source, /const \[leftCollapsed, setLeftCollapsed\] = useState\(true\);/);
  assert.match(source, /const \[rightCollapsed, setRightCollapsed\] = useState\(true\);/);
  assert.doesNotMatch(source, /style=\{rootStyle\}/);
  assert.doesNotMatch(source, /viewer-header-pill/);
  assert.doesNotMatch(styles, /--viewer-stage-left|--viewer-stage-right/);
  assert.match(styles, /\.viewer-stage\s*\{[\s\S]*inset:\s*0;/);
  assert.match(styles, /\.viewer-stage > div\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;/);
  assert.match(rootStyles, /html,\s*[\r\n]+body\s*\{[\s\S]*width:\s*100vw;[\s\S]*height:\s*100vh;/);
  assert.match(rootStyles, /#root\s*\{[\s\S]*position:\s*fixed;[\s\S]*inset:\s*0;[\s\S]*width:\s*100vw;[\s\S]*height:\s*100vh;/);
});

test("sidebars stay edge-docked and only expose top collapse controls", async () => {
  const toolbar = await readWorkspaceFile("src/viewer-core/components/Toolbar.tsx");
  const sidebar = await readWorkspaceFile("src/viewer-core/components/Sidebar.tsx");
  const rightSidebar = await readWorkspaceFile("src/viewer-core/components/RightSidebar.tsx");
  const styles = await readWorkspaceFile("src/webview/viewer-layout.css");

  assert.match(sidebar, /viewer-sidebar-title/);
  assert.match(sidebar, /viewer-sidebar-count/);
  assert.match(sidebar, /viewer-sidebar-summary/);
  assert.match(sidebar, /viewer-filename/);
  assert.match(sidebar, /viewer-stats/);
  assert.doesNotMatch(sidebar, /Hierarchy/);
  assert.doesNotMatch(toolbar, /Show hierarchy|Hide hierarchy|ChevronLeft|ChevronRight/);
  assert.doesNotMatch(rightSidebar, /top:\s*50%|translateY/);
  assert.match(styles, /\.viewer-sidebar\s*\{[\s\S]*left:\s*0;/);
  assert.match(styles, /\.viewer-right-sidebar\s*\{[\s\S]*right:\s*0;/);
  assert.match(styles, /\.viewer-sidebar\s*\{[\s\S]*top:\s*16px;/);
  assert.match(styles, /\.viewer-right-sidebar\s*\{[\s\S]*top:\s*16px;/);
  assert.match(styles, /\.viewer-sidebar\s*\{[\s\S]*box-sizing:\s*border-box;/);
  assert.match(styles, /\.viewer-right-sidebar\s*\{[\s\S]*box-sizing:\s*border-box;/);
  assert.match(styles, /\.viewer-sidebar\s*\{[\s\S]*border-radius:\s*0 14px 14px 0;/);
  assert.match(styles, /\.viewer-right-sidebar\s*\{[\s\S]*border-radius:\s*14px 0 0 14px;/);
  assert.match(styles, /\.viewer-sidebar\s*\{[\s\S]*border-left:\s*none;/);
  assert.match(styles, /\.viewer-right-sidebar\s*\{[\s\S]*border-right:\s*none;/);
  assert.match(styles, /\.viewer-sidebar\s*\{[\s\S]*box-shadow:\s*8px 0 24px rgba\(0, 0, 0, 0\.22\);/);
  assert.match(styles, /\.viewer-right-sidebar\s*\{[\s\S]*box-shadow:\s*-8px 0 24px rgba\(0, 0, 0, 0\.22\);/);
});
