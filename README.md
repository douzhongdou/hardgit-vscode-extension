# Hardgit 3D Preview

Hardgit 3D Preview is a VS Code extension for viewing common 3D model files with a custom previewer.

## Supported Formats

- `glb` / `gltf` — GL Transmission Format
- `fbx` — Autodesk FBX
- `obj` — Wavefront OBJ
- `stl` — STL (StereoLithography)
- `ply` — Stanford PLY
- `dae` — COLLADA
- `step` / `stp` — STEP (ISO 10303)
- `iges` / `igs` — IGES

## Features

- Open 3D model files directly in VS Code
- Read-only custom previewer — no modification to source files
- Entity tree navigation with node visibility toggle
- Three display modes: `Solid`, `Wireframe`, `Edges`
- Light/dark background toggle
- `Fit view` support
- Refresh current preview

## Installation

Install from `.vsix`:

## Usage

After installation, open any of the following file types directly in VS Code:

- `*.glb` / `*.gltf`
- `*.fbx`
- `*.obj`
- `*.stl`
- `*.ply`
- `*.dae`
- `*.step` / `*.stp`
- `*.iges` / `*.igs`

The extension will use the `Hardgit 3D Preview` custom editor for preview.

Previewer operations:

- View entity tree
- Toggle entity visibility
- Switch `Solid / Wireframe / Edges` mode
- Toggle light/dark background
- Execute `Fit view`
- Refresh current preview via command `Hardgit 3D Preview: Refresh`

## Known Limitations

- `gltf` files relying on external `.bin` or texture files require complete and accessible resource paths (in browser mode, drag in associated files together)
- `step/stp` and `iges/igs` depend on the browser-side `occt-import-js` library for triangulation
- For some large assemblies or CAD-exported STEP/IGES files, only the assembly structure may be readable without renderable triangles
- In such cases, the extension will clearly indicate "Structure loaded but no renderable geometry" rather than misinterpreting as a camera issue

## Repository Info

- License: MIT
- Repository: [douzhongdou/hardgit-vscode-extension](https://github.com/douzhongdou/hardgit-vscode-extension)
