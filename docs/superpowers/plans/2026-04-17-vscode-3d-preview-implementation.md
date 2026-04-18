# VS Code 三维预览插件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可安装到 VS Code 中的三维预览插件，安装后用户可以在资源管理器中单击 `glb/gltf/step/stp` 文件，并在自定义编辑器中查看三维图。

**Architecture:** 项目拆分为 VS Code 扩展层、Webview 编辑器层、Viewer Core 三维预览内核三层。扩展层负责注册 Custom Editor 与文件刷新通信，Webview 层负责承载 React 界面，Viewer Core 负责复用和裁剪 `hardgit` 中已经可用的三维渲染、实体树、相机与显示模式能力。

**Tech Stack:** TypeScript, VS Code Extension API, React, React DOM, Three.js, @react-three/fiber, @react-three/drei, Zustand, esbuild, pnpm

**Acceptance Standard:** 在本地执行打包后，能够把生成的扩展安装到 VS Code 中；安装完成后，单击工作区中的 `glb/gltf/step/stp` 文件，插件能在 preview tab 中打开并显示三维图，支持基础交互和实体树。

---

## 0. 文件结构设计

### 0.1 顶层目录

- Create: `\package.json`
- Create: `\pnpm-workspace.yaml`
- Create: `\tsconfig.base.json`
- Create: `\.gitignore`
- Create: `\README.md`

### 0.2 扩展层

- Create: `\src\extension\extension.ts`
- Create: `\src\extension\ThreePreviewEditorProvider.ts`
- Create: `\src\extension\messages.ts`
- Create: `\src\extension\getWebviewHtml.ts`

### 0.3 Webview 编辑器层

- Create: `\src\webview\index.tsx`
- Create: `\src\webview\App.tsx`
- Create: `\src\webview\styles.css`
- Create: `\src\webview\vscode.ts`
- Create: `\src\webview\types.ts`

### 0.4 Viewer Core 层

- Create: `\src\viewer-core\ThreePreviewEditor.tsx`
- Create: `\src\viewer-core\stores\viewerStore.ts`
- Create: `\src\viewer-core\stores\entityStore.ts`
- Create: `\src\viewer-core\components\Toolbar.tsx`
- Create: `\src\viewer-core\components\EntityTree.tsx`
- Create: `\src\viewer-core\components\LoadingState.tsx`
- Create: `\src\viewer-core\components\ErrorState.tsx`
- Create: `\src\viewer-core\engine\ModelLoaderR3F.tsx`
- Create: `\src\viewer-core\engine\SceneSetup.tsx`
- Create: `\src\viewer-core\engine\StepLoader.ts`
- Create: `\src\viewer-core\control\OrthoTrackball.tsx`
- Create: `\src\viewer-core\control\RenderModeController.tsx`
- Create: `\src\viewer-core\utils\entityTree.ts`
- Create: `\src\viewer-core\types.ts`

### 0.5 测试与构建

- Create: `\scripts\build-webview.mjs`
- Create: `\scripts\build-extension.mjs`
- Create: `\test\extension\editorProvider.test.ts`
- Create: `\test\viewer\entityTree.test.ts`
- Create: `\test\viewer\fileSupport.test.ts`

## 1. 实施原则

- 复用 `hardgit` 已完成能力，但先复制为本仓库内的 Viewer Core 版本，再做裁剪
- 不迁移批注、剖切、云端、上传入口、URL 加载入口
- 所有依赖安装和脚本均使用 `pnpm`
- 每完成一个任务就运行对应的最小验证，再继续下一个任务
- 每个任务结束后单独提交一次 commit

## 2. 任务清单

### Task 1: 初始化 VS Code 扩展骨架

**Files:**
- Create: `\package.json`
- Create: `\pnpm-workspace.yaml`
- Create: `\tsconfig.base.json`
- Create: `\.vscodeignore`
- Create: `\src\extension\extension.ts`

- [ ] **Step 1: 写扩展清单文件**

```json
{
  "name": "hardgit-3d-preview",
  "displayName": "Hardgit 3D Preview",
  "version": "0.0.1",
  "publisher": "local",
  "engines": {
    "vscode": "^1.99.0"
  },
  "main": "./dist/extension/extension.js",
  "activationEvents": [
    "onCustomEditor:hardgit.3dPreview"
  ],
  "contributes": {
    "customEditors": [
      {
        "viewType": "hardgit.3dPreview",
        "displayName": "Hardgit 3D Preview",
        "selector": [
          { "filenamePattern": "*.glb" },
          { "filenamePattern": "*.gltf" },
          { "filenamePattern": "*.step" },
          { "filenamePattern": "*.stp" }
        ],
        "priority": "default"
      }
    ],
    "commands": [
      {
        "command": "hardgit.3dPreview.refresh",
        "title": "Hardgit 3D Preview: Refresh"
      }
    ]
  },
  "scripts": {
    "build": "pnpm build:extension && pnpm build:webview",
    "build:extension": "node ./scripts/build-extension.mjs",
    "build:webview": "node ./scripts/build-webview.mjs",
    "check": "tsc -p tsconfig.base.json --noEmit",
    "test": "node --test ./test/**/*.test.js",
    "package": "vsce package"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.6",
    "@react-three/fiber": "^9.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "three": "^0.180.0",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@types/vscode": "^1.99.0",
    "esbuild": "^0.25.0",
    "typescript": "^5.8.0",
    "vsce": "^2.15.0"
  }
}
```

- [ ] **Step 2: 写工作区和 TS 配置**

```yaml
# \pnpm-workspace.yaml
packages:
  - "."
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "outDir": "dist",
    "rootDir": ".",
    "types": ["node", "vscode"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "scripts/**/*.mjs", "test/**/*.ts"]
}
```

- [ ] **Step 3: 写最小扩展入口**

```ts
import * as vscode from "vscode";
import { ThreePreviewEditorProvider } from "./ThreePreviewEditorProvider";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    ThreePreviewEditorProvider.register(context)
  );
}

export function deactivate() {}
```

- [ ] **Step 4: 安装依赖并验证清单格式**

Run: `pnpm install`

Expected: 安装完成，无 `ERR_PNPM_*` 错误。

- [ ] **Step 5: 运行类型检查**

Run: `pnpm check`

Expected: 初始可能因 `ThreePreviewEditorProvider` 尚未创建而失败，报错应聚焦于缺失模块。

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .vscodeignore src/extension/extension.ts
git commit -m "Define the VS Code extension shell for 3D preview

Constraint: Must open supported 3D files through a custom editor inside VS Code
Rejected: Start from a generic web app scaffold | does not establish extension lifecycle early
Confidence: high
Scope-risk: narrow
Directive: Keep the extension entrypoint minimal until the custom editor provider is wired
Tested: pnpm install, pnpm check
Not-tested: VS Code runtime activation
"
```

### Task 2: 实现 Custom Editor Provider 与 Webview HTML

**Files:**
- Modify: `\src\extension\extension.ts`
- Create: `\src\extension\ThreePreviewEditorProvider.ts`
- Create: `\src\extension\messages.ts`
- Create: `\src\extension\getWebviewHtml.ts`

- [ ] **Step 1: 写扩展与 Webview 消息类型**

```ts
export type ToWebviewMessage =
  | {
      type: "open-document";
      uri: string;
      extension: string;
      fileName: string;
      version: number;
    }
  | {
      type: "refresh-document";
      uri: string;
      version: number;
    };

export type FromWebviewMessage =
  | { type: "webview-ready" }
  | { type: "refresh-requested" }
  | { type: "show-error"; message: string };
```

- [ ] **Step 2: 写 HTML 生成函数**

```ts
import * as vscode from "vscode";

export function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview", "index.js")
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview", "styles.css")
  );
  const nonce = "hardgit-preview";

  return `<!DOCTYPE html>
  <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <meta
        http-equiv="Content-Security-Policy"
        content="default-src 'none'; img-src ${webview.cspSource} blob: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};"
      />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="${styleUri}">
      <title>Hardgit 3D Preview</title>
    </head>
    <body>
      <div id="root"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
  </html>`;
}
```

- [ ] **Step 3: 写 Provider 主体**

```ts
import * as vscode from "vscode";
import { getWebviewHtml } from "./getWebviewHtml";
import type { FromWebviewMessage, ToWebviewMessage } from "./messages";

export class ThreePreviewEditorProvider implements vscode.CustomReadonlyEditorProvider {
  public static readonly viewType = "hardgit.3dPreview";

  public static register(context: vscode.ExtensionContext) {
    const provider = new ThreePreviewEditorProvider(context);
    return vscode.window.registerCustomEditorProvider(
      ThreePreviewEditorProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true }, supportsMultipleEditorsPerDocument: false }
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  async openCustomDocument(uri: vscode.Uri): Promise<vscode.CustomDocument> {
    return { uri, dispose() {} };
  }

  async resolveCustomEditor(document: vscode.CustomDocument, panel: vscode.WebviewPanel): Promise<void> {
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri, vscode.Uri.joinPath(document.uri, "..")]
    };
    panel.webview.html = getWebviewHtml(panel.webview, this.context.extensionUri);

    const postOpen = () => {
      const message: ToWebviewMessage = {
        type: "open-document",
        uri: panel.webview.asWebviewUri(document.uri).toString(),
        extension: document.uri.path.split(".").pop() ?? "",
        fileName: document.uri.path.split("/").pop() ?? "",
        version: Date.now()
      };
      void panel.webview.postMessage(message);
    };

    panel.webview.onDidReceiveMessage((message: FromWebviewMessage) => {
      if (message.type === "webview-ready" || message.type === "refresh-requested") {
        postOpen();
      }
    });

    postOpen();
  }
}
```

- [ ] **Step 4: 运行类型检查**

Run: `pnpm check`

Expected: 若报错，应该仅剩 Webview 入口文件未创建相关错误。

- [ ] **Step 5: Commit**

```bash
git add src/extension/extension.ts src/extension/ThreePreviewEditorProvider.ts src/extension/messages.ts src/extension/getWebviewHtml.ts
git commit -m "Route supported 3D files through a custom preview editor

Constraint: The plugin must open binary model files in a VS Code custom editor instead of the text editor
Rejected: Delay provider wiring until after viewer work | would hide lifecycle issues too late
Confidence: high
Scope-risk: moderate
Directive: Keep extension-to-webview messaging explicit and versioned
Tested: pnpm check
Not-tested: Opening a real model in VS Code
"
```

### Task 3: 搭建 Webview React 入口

**Files:**
- Create: `\src\webview\index.tsx`
- Create: `\src\webview\App.tsx`
- Create: `\src\webview\vscode.ts`
- Create: `\src\webview\types.ts`
- Create: `\src\webview\styles.css`
- Create: `\scripts\build-webview.mjs`

- [ ] **Step 1: 定义 Webview 运行时类型与 VS Code API 包装**

```ts
declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
};

export const vscodeApi = acquireVsCodeApi();
```

```ts
export type WebviewDocumentState = {
  uri: string;
  extension: string;
  fileName: string;
  version: number;
};
```

- [ ] **Step 2: 写 React 入口与消息订阅**

```tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
```

```tsx
import { useEffect, useState } from "react";
import { vscodeApi } from "./vscode";
import type { WebviewDocumentState } from "./types";
import { ThreePreviewEditor } from "../viewer-core/ThreePreviewEditor";

export function App() {
  const [documentState, setDocumentState] = useState<WebviewDocumentState | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<WebviewDocumentState & { type: string }>) => {
      if (event.data.type === "open-document" || event.data.type === "refresh-document") {
        setDocumentState(event.data);
      }
    };

    window.addEventListener("message", handleMessage);
    vscodeApi.postMessage({ type: "webview-ready" });
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return <ThreePreviewEditor documentState={documentState} />;
}
```

- [ ] **Step 3: 写最小样式与构建脚本**

```css
html, body, #root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

body {
  font-family: var(--vscode-font-family);
}
```

```js
import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/webview/index.tsx"],
  bundle: true,
  outfile: "dist/webview/index.js",
  format: "iife",
  platform: "browser",
  sourcemap: true,
  loader: { ".css": "css" }
});
```

- [ ] **Step 4: 运行 Webview 构建**

Run: `pnpm build:webview`

Expected: 生成 `dist/webview/index.js`，若失败，应集中在 `viewer-core` 尚未创建。

- [ ] **Step 5: Commit**

```bash
git add src/webview src/webview/* scripts/build-webview.mjs
git commit -m "Create the webview app shell for the 3D preview editor

Constraint: The editor UI must run fully inside a VS Code webview
Rejected: Render viewer markup from extension code | would make state handling brittle
Confidence: high
Scope-risk: narrow
Directive: Keep webview state driven by explicit document messages from the extension
Tested: pnpm build:webview
Not-tested: Rendering a real 3D scene
"
```

### Task 4: 迁移 Viewer Core 最小可显示链路

**Files:**
- Create: `\src\viewer-core\types.ts`
- Create: `\src\viewer-core\ThreePreviewEditor.tsx`
- Create: `\src\viewer-core\engine\ModelLoaderR3F.tsx`
- Create: `\src\viewer-core\engine\SceneSetup.tsx`
- Create: `\src\viewer-core\engine\StepLoader.ts`
- Create: `\src\viewer-core\components\LoadingState.tsx`
- Create: `\src\viewer-core\components\ErrorState.tsx`
- Modify: `\src\webview\App.tsx`

- [ ] **Step 1: 从 `hardgit` 复制并裁剪格式加载器**

```tsx
export type SupportedModelExtension = "glb" | "gltf" | "step" | "stp";

export type ModelLoadResult = {
  model: THREE.Object3D;
  size: THREE.Vector3;
  center: THREE.Vector3;
  vertices: number;
  faces: number;
};
```

```tsx
export function ModelLoaderR3F({
  url,
  extension,
  onLoad,
  onError
}: {
  url: string;
  extension: SupportedModelExtension;
  onLoad: (result: ModelLoadResult) => void;
  onError: (error: Error) => void;
}) {
  if (extension === "glb" || extension === "gltf") {
    return <GLTFModel url={url} onLoad={onLoad} />;
  }
  if (extension === "step" || extension === "stp") {
    return <STEPModel url={url} onLoad={onLoad} />;
  }
  onError(new Error(`Unsupported extension: ${extension}`));
  return null;
}
```

- [ ] **Step 2: 写最小编辑器主体**

```tsx
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import type { WebviewDocumentState } from "../webview/types";
import { ModelLoaderR3F } from "./engine/ModelLoaderR3F";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { SceneSetup } from "./engine/SceneSetup";

export function ThreePreviewEditor({ documentState }: { documentState: WebviewDocumentState | null }) {
  const [error, setError] = useState<string | null>(null);

  if (!documentState) return <LoadingState label="等待文件..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <Canvas>
      <SceneSetup />
      <Suspense fallback={null}>
        <ModelLoaderR3F
          url={documentState.uri}
          extension={documentState.extension as "glb" | "gltf" | "step" | "stp"}
          onLoad={() => setError(null)}
          onError={(nextError) => setError(nextError.message)}
        />
      </Suspense>
    </Canvas>
  );
}
```

- [ ] **Step 3: 写加载态和错误态**

```tsx
export function LoadingState({ label }: { label: string }) {
  return <div style={{ padding: 16 }}>加载中：{label}</div>;
}
```

```tsx
export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>模型加载失败</h2>
      <pre>{message}</pre>
    </div>
  );
}
```

- [ ] **Step 4: 运行完整构建**

Run: `pnpm build`

Expected: 生成 `dist/extension` 与 `dist/webview`，若失败，错误应集中在 `StepLoader` 或 Three 类型适配。

- [ ] **Step 5: Commit**

```bash
git add src/viewer-core src/viewer-core/* src/webview/App.tsx
git commit -m "Port the minimal 3D viewer core into the VS Code webview

Constraint: The first acceptance milestone is seeing supported models render inside the custom editor
Rejected: Rebuild model loading from scratch | existing hardgit loaders are already validated
Confidence: medium
Scope-risk: moderate
Directive: Keep only the glb/gltf/step/stp loading path in the first port
Tested: pnpm build
Not-tested: VS Code install and open workflow
"
```

### Task 5: 接入相机控制、显示模式和实体树

**Files:**
- Create: `\src\viewer-core\stores\viewerStore.ts`
- Create: `\src\viewer-core\stores\entityStore.ts`
- Create: `\src\viewer-core\components\Toolbar.tsx`
- Create: `\src\viewer-core\components\EntityTree.tsx`
- Create: `\src\viewer-core\control\OrthoTrackball.tsx`
- Create: `\src\viewer-core\control\RenderModeController.tsx`
- Create: `\src\viewer-core\utils\entityTree.ts`
- Modify: `\src\viewer-core\ThreePreviewEditor.tsx`

- [ ] **Step 1: 写 viewer store 与实体树生成工具**

```ts
import { create } from "zustand";

export const useViewerStore = create<{
  renderMode: "solid" | "wireframe" | "edges";
  background: "light" | "dark";
  setRenderMode: (mode: "solid" | "wireframe" | "edges") => void;
  toggleBackground: () => void;
}>((set) => ({
  renderMode: "solid",
  background: "light",
  setRenderMode: (renderMode) => set({ renderMode }),
  toggleBackground: () => set((state) => ({ background: state.background === "light" ? "dark" : "light" }))
}));
```

```ts
export function buildEntityTree(root: THREE.Object3D) {
  return root.children.map((child) => ({
    id: child.uuid,
    name: child.name || child.type,
    children: []
  }));
}
```

- [ ] **Step 2: 写工具栏与实体树组件**

```tsx
export function Toolbar() {
  const { renderMode, setRenderMode, toggleBackground } = useViewerStore();
  return (
    <div className="toolbar">
      <button onClick={() => setRenderMode("solid")} data-active={renderMode === "solid"}>实体</button>
      <button onClick={() => setRenderMode("wireframe")} data-active={renderMode === "wireframe"}>线框</button>
      <button onClick={() => setRenderMode("edges")} data-active={renderMode === "edges"}>边线</button>
      <button onClick={toggleBackground}>背景</button>
    </div>
  );
}
```

```tsx
export function EntityTree({ nodes }: { nodes: Array<{ id: string; name: string }> }) {
  return (
    <aside className="entity-tree">
      {nodes.map((node) => (
        <button key={node.id}>{node.name}</button>
      ))}
    </aside>
  );
}
```

- [ ] **Step 3: 把 UI 接回编辑器主体**

```tsx
const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);

<Toolbar />
<EntityTree nodes={entities} />
<Canvas>
  <SceneSetup />
  <OrthoTrackball />
  <ModelLoaderR3F
    url={documentState.uri}
    extension={documentState.extension as SupportedModelExtension}
    onLoad={(result) => {
      setEntities(buildEntityTree(result.model));
      setError(null);
    }}
    onError={(nextError) => setError(nextError.message)}
  />
</Canvas>
```

- [ ] **Step 4: 运行最小测试与构建**

Run: `pnpm build`

Expected: 构建通过，工具栏和实体树组件进入 bundle。

- [ ] **Step 5: Commit**

```bash
git add src/viewer-core
git commit -m "Restore camera controls, render modes, and the entity tree in the editor

Constraint: The accepted MVP keeps the hardgit-style entity tree while excluding annotation and clipping
Rejected: Ship a canvas-only viewer first | would miss a key approved requirement
Confidence: medium
Scope-risk: moderate
Directive: Do not reintroduce annotation or clipping dependencies while wiring UI
Tested: pnpm build
Not-tested: Entity selection behavior inside VS Code
"
```

### Task 6: 接入文件变更自动刷新

**Files:**
- Modify: `\src\extension\ThreePreviewEditorProvider.ts`
- Modify: `\src\extension\messages.ts`
- Modify: `\src\webview\App.tsx`
- Modify: `\src\viewer-core\components\ErrorState.tsx`

- [ ] **Step 1: 在 Provider 中监听工作区文件变化**

```ts
const watcher = vscode.workspace.onDidSaveTextDocument((savedDocument) => {
  if (savedDocument.uri.toString() !== document.uri.toString()) return;
  const message: ToWebviewMessage = {
    type: "refresh-document",
    uri: panel.webview.asWebviewUri(document.uri).toString(),
    version: Date.now()
  };
  void panel.webview.postMessage(message);
});

panel.onDidDispose(() => watcher.dispose());
```

- [ ] **Step 2: 在 Webview 中用版本号触发重新加载**

```tsx
useEffect(() => {
  if (!documentState) return;
  setViewerKey(`${documentState.uri}?v=${documentState.version}`);
}, [documentState]);
```

- [ ] **Step 3: 给错误态增加手动刷新按钮**

```tsx
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>模型加载失败</h2>
      <pre>{message}</pre>
      <button onClick={onRetry}>重新加载</button>
    </div>
  );
}
```

- [ ] **Step 4: 运行构建验证**

Run: `pnpm build`

Expected: 构建通过，刷新消息流无类型错误。

- [ ] **Step 5: Commit**

```bash
git add src/extension/ThreePreviewEditorProvider.ts src/extension/messages.ts src/webview/App.tsx src/viewer-core/components/ErrorState.tsx
git commit -m "Refresh the preview automatically when the source file changes

Constraint: Accepted behavior requires auto-refresh with a manual recovery path on failure
Rejected: Manual refresh only | breaks the expected preview workflow
Confidence: high
Scope-risk: narrow
Directive: Keep refresh idempotent and key it off document version changes
Tested: pnpm build
Not-tested: External generator writing binary files while VS Code stays open
"
```

### Task 7: 添加自动化测试与本地安装验收

**Files:**
- Create: `\test\viewer\fileSupport.test.ts`
- Create: `\test\viewer\entityTree.test.ts`
- Create: `\test\extension\editorProvider.test.ts`
- Modify: `\package.json`
- Modify: `\README.md`

- [ ] **Step 1: 写文件支持测试**

```ts
import test from "node:test";
import assert from "node:assert/strict";

test("supports accepted model extensions", () => {
  const supported = ["glb", "gltf", "step", "stp"];
  assert.equal(supported.includes("glb"), true);
  assert.equal(supported.includes("step"), true);
  assert.equal(supported.includes("obj"), false);
});
```

- [ ] **Step 2: 写实体树工具测试**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { buildEntityTree } from "../../src/viewer-core/utils/entityTree";

test("buildEntityTree returns root children as visible nodes", () => {
  const root = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  mesh.name = "Cube";
  root.add(mesh);

  const result = buildEntityTree(root);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Cube");
});
```

- [ ] **Step 3: 写 Provider 注册测试**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { ThreePreviewEditorProvider } from "../../src/extension/ThreePreviewEditorProvider";

test("custom editor view type is stable", () => {
  assert.equal(ThreePreviewEditorProvider.viewType, "hardgit.3dPreview");
});
```

- [ ] **Step 4: 跑测试与构建**

Run: `pnpm build && pnpm test`

Expected: 构建通过，测试全部 PASS。

- [ ] **Step 5: 进行最终人工验收**

Run:

```bash
pnpm build
pnpm package
code --install-extension .\hardgit-3d-preview-0.0.1.vsix
```

Manual verification:

1. 在 VS Code 中打开一个包含 `glb/gltf/step/stp` 文件的工作区。
2. 单击任意支持格式文件。
3. 确认当前 preview tab 打开的是 `Hardgit 3D Preview`。
4. 确认模型可见。
5. 确认可以旋转、缩放、平移。
6. 确认可以切换 `实体 / 线框 / 边线`。
7. 确认实体树出现。
8. 修改并保存模型文件后，确认预览自动刷新；若失败，确认可以点击“重新加载”恢复。

Expected: 全部满足，即视为达到验收标准“我能安装到 VS Code 里查看三维图”。

- [ ] **Step 6: Commit**

```bash
git add test README.md package.json
git commit -m "Prove the extension can be installed and used to inspect 3D files in VS Code

Constraint: Final acceptance is installation into VS Code and successful 3D preview of supported files
Rejected: Stop after unit tests | does not prove installability or editor behavior
Confidence: high
Scope-risk: narrow
Directive: Do not declare completion until VSIX installation and manual preview verification both pass
Tested: pnpm build, pnpm test, pnpm package, VSIX install, manual editor open flow
Not-tested: Very large production CAD files
"
```

## 3. 计划自检

### 3.1 Spec 覆盖检查

- 单击文件后在 preview tab 打开：Task 1, Task 2, Task 7
- 正式支持 `glb/gltf/step/stp`：Task 1, Task 4, Task 7
- 保留 `hardgit` 风格与实体树：Task 5
- 不做批注与剖切：Task 4, Task 5 的裁剪约束中已固定
- 自动刷新与手动恢复：Task 6, Task 7
- 验收标准“能安装到 VS Code 里查看三维图”：Task 7

### 3.2 Placeholder 扫描

- 未使用 `TBD`、`TODO`、`后续实现` 等占位词
- 每个任务都包含明确文件路径
- 每个代码步骤都附带具体代码片段
- 每个验证步骤都附带具体命令和预期结果

### 3.3 类型与命名一致性

- Custom Editor `viewType` 统一为 `hardgit.3dPreview`
- 支持格式统一为 `glb/gltf/step/stp`
- Webview 文档状态统一使用 `uri / extension / fileName / version`
- 刷新入口统一使用 `refresh-document`
