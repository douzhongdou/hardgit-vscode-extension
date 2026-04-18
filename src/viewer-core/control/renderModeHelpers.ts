import {
  Color,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  type Material,
  type Object3D
} from "three";
import type { RenderMode, ViewerBackgroundMode } from "../types";
import { VIEWER_EDGE_HELPER_FLAG } from "../utils/entityTree.ts";

type RenderStateParams = {
  renderMode: RenderMode;
  backgroundMode: ViewerBackgroundMode;
  selectedEntityId: string | null;
};

type ViewerMaterialState = {
  colorHex: number | null;
  emissiveHex: number | null;
  emissiveIntensity: number | null;
  wireframe: boolean | null;
};

const VIEWER_MATERIAL_STATE_KEY = "__viewerMaterialState";
const SELECTED_COLOR = new Color("#4da3ff");
const DARK_EDGE_COLOR = new Color("#122033");
const LIGHT_EDGE_COLOR = new Color("#4b5f76");
const EDGE_MODE_OPACITY = 0.92;

function getMaterials(mesh: Mesh): Material[] {
  if (Array.isArray(mesh.material)) {
    return mesh.material;
  }

  return mesh.material ? [mesh.material] : [];
}

function getViewerMaterialState(material: Material): ViewerMaterialState {
  const userData = material.userData as Record<string, unknown>;
  const existing = userData[VIEWER_MATERIAL_STATE_KEY] as ViewerMaterialState | undefined;

  if (existing !== undefined) {
    return existing;
  }

  const nextState: ViewerMaterialState = {
    colorHex:
      "color" in material && material.color instanceof Color
        ? material.color.getHex()
        : null,
    emissiveHex:
      "emissive" in material && material.emissive instanceof Color
        ? material.emissive.getHex()
        : null,
    emissiveIntensity:
      "emissiveIntensity" in material &&
      typeof material.emissiveIntensity === "number"
        ? material.emissiveIntensity
        : null,
    wireframe:
      "wireframe" in material && typeof material.wireframe === "boolean"
        ? material.wireframe
        : null
  };

  userData[VIEWER_MATERIAL_STATE_KEY] = nextState;
  return nextState;
}

function restoreMaterialState(material: Material): void {
  const state = getViewerMaterialState(material);

  if (state.colorHex !== null && "color" in material && material.color instanceof Color) {
    material.color.setHex(state.colorHex);
  }

  if (
    state.emissiveHex !== null &&
    "emissive" in material &&
    material.emissive instanceof Color
  ) {
    material.emissive.setHex(state.emissiveHex);
  }

  if (
    state.emissiveIntensity !== null &&
    "emissiveIntensity" in material &&
    typeof material.emissiveIntensity === "number"
  ) {
    material.emissiveIntensity = state.emissiveIntensity;
  }

  if (state.wireframe !== null && "wireframe" in material) {
    material.wireframe = state.wireframe;
  }
}

function isMeshSelected(mesh: Mesh, selectedEntityId: string | null): boolean {
  if (selectedEntityId === null) {
    return false;
  }

  let current: Object3D | null = mesh;

  while (current !== null) {
    if (current.uuid === selectedEntityId) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

function getEdgeHelper(mesh: Mesh): LineSegments | null {
  return (
    mesh.children.find(
      (child): child is LineSegments =>
        child instanceof LineSegments &&
        child.userData[VIEWER_EDGE_HELPER_FLAG] === true
    ) ?? null
  );
}

function createEdgeHelper(mesh: Mesh): LineSegments | null {
  if (mesh.geometry === undefined) {
    return null;
  }

  const helper = new LineSegments(
    new EdgesGeometry(mesh.geometry),
    new LineBasicMaterial({
      color: DARK_EDGE_COLOR,
      transparent: true,
      opacity: EDGE_MODE_OPACITY,
      depthWrite: false
    })
  );

  helper.name = `${mesh.name || mesh.uuid}-edges`;
  helper.renderOrder = 2;
  helper.userData[VIEWER_EDGE_HELPER_FLAG] = true;
  mesh.add(helper);
  return helper;
}

function ensureEdgeHelper(mesh: Mesh): LineSegments | null {
  return getEdgeHelper(mesh) ?? createEdgeHelper(mesh);
}

function shouldShowEdgeHelper(mesh: Mesh, renderMode: RenderMode): boolean {
  return renderMode === "edges" && mesh.visible;
}

function syncEdgeHelperAppearance(
  helper: LineSegments,
  params: Pick<RenderStateParams, "backgroundMode" | "renderMode">
): void {
  const material = Array.isArray(helper.material)
    ? helper.material[0]
    : helper.material;

  if (!(material instanceof LineBasicMaterial)) {
    return;
  }

  material.color.copy(
    params.backgroundMode === "light" ? LIGHT_EDGE_COLOR : DARK_EDGE_COLOR
  );
  material.opacity = EDGE_MODE_OPACITY;
  material.needsUpdate = true;
}

function syncMaterialState(material: Material, params: {
  renderMode: RenderMode;
  isSelected: boolean;
}): void {
  const state = getViewerMaterialState(material);

  restoreMaterialState(material);

  if (state.wireframe !== null && "wireframe" in material) {
    material.wireframe = params.renderMode === "wireframe";
  }

  if (params.isSelected) {
    if ("emissive" in material && material.emissive instanceof Color) {
      material.emissive.copy(SELECTED_COLOR);

      if (
        "emissiveIntensity" in material &&
        typeof material.emissiveIntensity === "number"
      ) {
        material.emissiveIntensity = Math.max(state.emissiveIntensity ?? 0, 0.45);
      }
    } else if ("color" in material && material.color instanceof Color) {
      material.color.copy(SELECTED_COLOR.clone().lerp(material.color, 0.78));
    }
  }

  material.needsUpdate = true;
}

function syncMeshState(mesh: Mesh, params: RenderStateParams): void {
  const isSelected = isMeshSelected(mesh, params.selectedEntityId);

  for (const material of getMaterials(mesh)) {
    syncMaterialState(material, {
      renderMode: params.renderMode,
      isSelected
    });
  }

  const helper =
    params.renderMode === "edges" ? ensureEdgeHelper(mesh) : getEdgeHelper(mesh);
  if (helper !== null) {
    syncEdgeHelperAppearance(helper, params);
    helper.visible = shouldShowEdgeHelper(mesh, params.renderMode);
  }
}

export function syncObjectRenderState(
  object: Object3D,
  params: RenderStateParams
): void {
  object.traverse((child) => {
    if (child instanceof Mesh) {
      syncMeshState(child, params);
    }
  });
}

function disposeMaterial(material: Material): void {
  material.dispose();
}

function disposeHelper(helper: LineSegments): void {
  helper.parent?.remove(helper);
  helper.geometry.dispose();

  if (Array.isArray(helper.material)) {
    helper.material.forEach(disposeMaterial);
  } else {
    disposeMaterial(helper.material);
  }
}

export function disposeViewerHelpers(object: Object3D): void {
  const helpers: LineSegments[] = [];

  object.traverse((child) => {
    if (child instanceof Mesh) {
      for (const material of getMaterials(child)) {
        restoreMaterialState(material);
      }
    }

    if (
      child instanceof LineSegments &&
      child.userData[VIEWER_EDGE_HELPER_FLAG] === true
    ) {
      helpers.push(child);
    }
  });

  helpers.forEach(disposeHelper);
}
