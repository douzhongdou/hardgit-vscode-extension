# Hardgit 3D Preview

Hardgit 3D Preview 是一个 VS Code 3D 模型预览插件，用来自定义打开并查看常见三维文件。

目前支持的格式：

- `glb` / `gltf` — GL Transmission Format
- `fbx` — Autodesk FBX
- `obj` — Wavefront OBJ
- `stl` — STL（StereoLithography）
- `ply` — Stanford PLY
- `dae` — COLLADA
- `step` / `stp` — STEP（ISO 10303）
- `iges` / `igs` — IGES

## 功能

- 在 VS Code 中直接打开 3D 模型文件
- 使用只读自定义预览器，不修改源文件
- 支持实体树浏览与节点可见性切换
- 支持 `Solid`、`Wireframe`、`Edges` 三种显示模式
- 支持明暗背景切换
- 支持 `Fit view`
- 支持刷新当前预览

## 安装

 从 `.vsix` 安装


## 使用

安装后，直接在 VS Code 中打开以下文件之一：

- `*.glb` / `*.gltf`
- `*.fbx`
- `*.obj`
- `*.stl`
- `*.ply`
- `*.dae`
- `*.step` / `*.stp`
- `*.iges` / `*.igs`

插件会使用 `hardgit 3D Preview` 自定义编辑器进行预览。

预览器中支持的主要操作：

- 查看实体树
- 切换实体可见性
- 切换 `Solid / Wireframe / Edges`
- 切换浅色或深色背景
- 执行 `Fit view`
- 使用命令 `hardgit 3D Preview: Refresh` 刷新当前预览

## 已知限制

- `gltf` 如果依赖外部 `.bin` 或纹理文件，需要资源路径完整且可访问（在浏览器模式下，需将关联文件一并拖入）
- `step/stp` 和 `iges/igs` 依赖浏览器侧 `occt-import-js` 进行三角化
- 对于部分超大装配体或特定 CAD 导出的 STEP/IGES 文件，可能只能读取装配结构，但无法生成可渲染三角面
- 遇到上述情况时，插件会明确提示”结构已加载，但没有可渲染几何”，而不是误判成视角问题

## 仓库信息

- License: MIT
- Repository: [douzhongdou/hardgit-vscode-extension](https://github.com/douzhongdou/hardgit-vscode-extension)

## 插件介绍页

仓库内提供了一个可直接部署到 GitHub Pages 的静态介绍页，目录位于 `site/`。

特点：

- 面向机械 / 结构 / CAD 工程师的单页介绍页
- 主下载入口指向 GitHub Releases
- 支持中文与英文切换
- 使用纯静态 HTML / CSS / JavaScript 实现，便于直接托管

如果需要部署到 GitHub Pages，可直接发布 `site/` 目录内容。

仓库同时提供了 GitHub Actions workflow：

- `.github/workflows/deploy-pages.yml`

启用方式：

- 在 GitHub 仓库设置中开启 Pages
- Source 选择 `GitHub Actions`
- 后续推送 `main` 分支中的 `site/` 相关改动后会自动发布
