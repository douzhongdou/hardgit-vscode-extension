import { Box3, Mesh, Object3D, Vector3 } from "three";
import type { ModelLoadResult } from "../types.ts";

const EMPTY_RENDERABLE_GEOMETRY_ERROR =
  "STEP assembly structure loaded, but no renderable mesh geometry was produced.";

export function createRenderableModelLoadResult(model: Object3D): ModelLoadResult {
  const boundingBox = new Box3().setFromObject(model);
  const size = boundingBox.getSize(new Vector3());
  const center = boundingBox.getCenter(new Vector3());
  let vertices = 0;
  let faces = 0;

  model.traverse((child: Object3D) => {
    if (!(child instanceof Mesh) || child.geometry.attributes.position === undefined) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    vertices += child.geometry.attributes.position.count;

    if (child.geometry.index !== null) {
      faces += child.geometry.index.count / 3;
      return;
    }

    faces += child.geometry.attributes.position.count / 3;
  });

  if (vertices === 0 || faces === 0) {
    throw new Error(
      `${EMPTY_RENDERABLE_GEOMETRY_ERROR}\n` +
        "The file may be a large STEP assembly that this browser-side parser could structure but not triangulate."
    );
  }

  return {
    model,
    size: { x: size.x, y: size.y, z: size.z },
    center: { x: center.x, y: center.y, z: center.z },
    vertices,
    faces
  };
}
