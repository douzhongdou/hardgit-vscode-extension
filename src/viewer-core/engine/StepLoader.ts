import occtimportjs, {
  type OcctImportModule,
  type OcctResultMesh
} from "occt-import-js";
import occtWasmAssetPath from "occt-import-js/dist/occt-import-js.wasm";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Loader,
  Mesh,
  MeshStandardMaterial,
  type LoadingManager,
  type Object3D
} from "three";
import {
  createStepIndexArray,
  loadCachedModule,
  resolveStepAssetUrl
} from "./step-loader-utils";

const occtModuleCache = new Map<string, Promise<OcctImportModule>>();

function getStepRuntimeBaseUri(): string {
  if (typeof document !== "undefined" && document.baseURI.length > 0) {
    return document.baseURI;
  }

  if (typeof window !== "undefined") {
    return window.location.href;
  }

  return "file:///";
}

function getStepWasmUrl(baseUri: string): string {
  return resolveStepAssetUrl(occtWasmAssetPath, baseUri);
}

function getOcctModule(baseUri: string): Promise<OcctImportModule> {
  return loadCachedModule(occtModuleCache, baseUri, () =>
    occtimportjs({
      locateFile: (path) => {
        if (path.endsWith(".wasm")) {
          return getStepWasmUrl(baseUri);
        }

        return resolveStepAssetUrl(path, baseUri);
      }
    })
  );
}

function createStepMaterial(meshColor?: [number, number, number]) {
  return new MeshStandardMaterial({
    color:
      meshColor === undefined
        ? 0xcccccc
        : new Color(meshColor[0], meshColor[1], meshColor[2]),
    metalness: 0.15,
    roughness: 0.72,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });
}

function createStepMesh(resultMesh: OcctResultMesh): Mesh {
  const geometry = new BufferGeometry();
  const positionArray = Float32Array.from(resultMesh.attributes.position.array);

  geometry.setAttribute("position", new BufferAttribute(positionArray, 3));

  if (resultMesh.attributes.normal !== undefined) {
    geometry.setAttribute(
      "normal",
      new BufferAttribute(Float32Array.from(resultMesh.attributes.normal.array), 3)
    );
  } else {
    geometry.computeVertexNormals();
  }

  geometry.setIndex(new BufferAttribute(createStepIndexArray(resultMesh.index.array), 1));
  geometry.computeBoundingSphere();

  const mesh = new Mesh(geometry, createStepMaterial(resultMesh.color));
  mesh.name = resultMesh.name?.trim() || "STEPMesh";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function normalizeStepError(error: unknown, url: string): Error {
  if (error instanceof Error) {
    return new Error(`STEP load failed: ${error.message}\nAsset: ${url}`);
  }

  return new Error(`STEP load failed: ${String(error)}\nAsset: ${url}`);
}

export class StepLoader extends Loader<Object3D> {
  public constructor(manager?: LoadingManager) {
    super(manager);
  }

  public override load(
    url: string,
    onLoad: (data: Object3D) => void,
    _onProgress?: (event: ProgressEvent<EventTarget>) => void,
    onError?: (event: unknown) => void
  ): void {
    this.manager.itemStart(url);

    void this.loadAsync(url)
      .then((object) => {
        onLoad(object);
        this.manager.itemEnd(url);
      })
      .catch((error) => {
        const normalizedError = normalizeStepError(error, url);
        this.manager.itemError(url);
        this.manager.itemEnd(url);
        onError?.(normalizedError);
      });
  }

  public override async loadAsync(url: string): Promise<Object3D> {
    const baseUri = getStepRuntimeBaseUri();
    const occt = await getOcctModule(baseUri);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Could not read STEP asset. HTTP ${response.status}`);
    }

    const fileBuffer = new Uint8Array(await response.arrayBuffer());
    const result = occt.ReadStepFile(fileBuffer, null);

    if (result.success === false || result.meshes.length === 0) {
      throw new Error("STEP parsing returned no renderable meshes.");
    }

    const group = new Group();
    group.name = "STEPModel";

    for (const resultMesh of result.meshes) {
      group.add(createStepMesh(resultMesh));
    }

    return group;
  }
}
