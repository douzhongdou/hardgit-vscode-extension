import type { Object3D } from "three";

export type SupportedModelExtension =
  | "glb"
  | "gltf"
  | "fbx"
  | "obj"
  | "stl"
  | "ply"
  | "dae"
  | "step"
  | "stp"
  | "iges"
  | "igs";
export type RenderMode = "solid" | "wireframe" | "edges";
export type ViewerBackgroundMode = "dark" | "light";
export type ModelAssetMap = Readonly<Record<string, string>>;

export type Vector3Like = {
  x: number;
  y: number;
  z: number;
};

export type SceneBounds = {
  center: [number, number, number];
  size: [number, number, number];
};

export type ModelLoadResult = {
  model: Object3D;
  size: Vector3Like;
  center: Vector3Like;
  vertices: number;
  faces: number;
};

export type ModelLoaderR3FProps = {
  url: string;
  extension: SupportedModelExtension;
  assetMap?: ModelAssetMap | null;
  onLoad: (result: ModelLoadResult) => void;
  onError: (error: Error) => void;
};

export type SceneSetupProps = {
  backgroundMode?: ViewerBackgroundMode;
  sceneBounds?: SceneBounds | null;
};

export type LoadingStateProps = {
  label: string;
};

export type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

const SUPPORTED_MODEL_EXTENSION_LIST: readonly SupportedModelExtension[] = [
  "glb",
  "gltf",
  "fbx",
  "obj",
  "stl",
  "ply",
  "dae",
  "step",
  "stp",
  "iges",
  "igs"
] as const;

const SUPPORTED_MODEL_EXTENSIONS: ReadonlySet<SupportedModelExtension> = new Set(
  SUPPORTED_MODEL_EXTENSION_LIST
);

const STEP_SUPPORT_ERROR_MESSAGE =
  "STEP/STP preview depends on occt-import-js and its wasm runtime. If STEP loading fails, the wasm asset is usually unavailable, initialization failed, or the source file itself could not be parsed.";

function formatNaturalLanguageList(values: readonly string[]): string {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

export function getSupportedModelExtensionsLabel(): string {
  return formatNaturalLanguageList(SUPPORTED_MODEL_EXTENSION_LIST);
}

export function getSupportedModelFileInputAcceptValue(): string {
  return SUPPORTED_MODEL_EXTENSION_LIST.map((extension) => `.${extension}`).join(",");
}

export function toSupportedModelExtension(
  extension: string
): SupportedModelExtension | null {
  const normalizedExtension = extension.trim().toLowerCase();

  if (!SUPPORTED_MODEL_EXTENSIONS.has(normalizedExtension as SupportedModelExtension)) {
    return null;
  }

  return normalizedExtension as SupportedModelExtension;
}

export function createVersionedModelUrl(uri: string, version: number): string {
  if (uri.startsWith("blob:") || uri.startsWith("data:")) {
    return uri;
  }

  try {
    const nextUrl = new URL(uri);
    nextUrl.searchParams.set("hardgitVersion", String(version));
    return nextUrl.toString();
  } catch {
    const [baseUrl, hash = ""] = uri.split("#", 2);
    const normalizedBaseUrl = baseUrl
      .replace(/([?&])hardgitVersion=[^&#]*/g, "$1")
      .replace(/[?&]$/, "");
    const separator = normalizedBaseUrl.includes("?") ? "&" : "?";
    const suffix = hash.length > 0 ? `#${hash}` : "";

    return `${normalizedBaseUrl}${separator}hardgitVersion=${version}${suffix}`;
  }
}

export function getStepSupportError(): Error {
  return new Error(STEP_SUPPORT_ERROR_MESSAGE);
}
