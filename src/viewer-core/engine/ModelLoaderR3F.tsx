import React, { useEffect, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { Box3, Mesh, Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createRenderableModelLoadResult } from "./model-load-result.ts";
import { StepLoader } from "./StepLoader";
import type {
  ModelAssetMap,
  ModelLoadResult,
  ModelLoaderR3FProps
} from "../types";

function LoadedObjectModel({
  object,
  onLoad,
  onError
}: {
  object: Object3D;
  onLoad: (result: ModelLoadResult) => void;
  onError: (error: Error) => void;
}) {
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    try {
      const result = createRenderableModelLoadResult(object);

      object.position.set(-result.center.x, -result.center.y, -result.center.z);
      object.updateMatrixWorld(true);

      const centeredBounds = new Box3().setFromObject(object);
      const centeredSize = centeredBounds.getSize(new Vector3());
      const centered = centeredBounds.getCenter(new Vector3());

      onLoadRef.current({
        ...result,
        center: { x: centered.x, y: centered.y, z: centered.z },
        size: { x: centeredSize.x, y: centeredSize.y, z: centeredSize.z }
      });
    } catch (error) {
      onErrorRef.current(
        error instanceof Error ? error : new Error(`Model load failed: ${String(error)}`)
      );
    }
  }, [object]);

  return <primitive object={object} />;
}

function createAssetUrlResolver(assetMap?: ModelAssetMap | null) {
  if (assetMap === undefined || assetMap === null) {
    return undefined;
  }

  return (requestedUrl: string) => {
    if (requestedUrl.startsWith("blob:") || requestedUrl.startsWith("data:")) {
      return requestedUrl;
    }

    try {
      const absoluteUrl = new URL(requestedUrl, window.location.href);

      if (absoluteUrl.origin !== window.location.origin) {
        return requestedUrl;
      }
    } catch {}

    const normalizedUrl = requestedUrl.replace(/\\/g, "/").replace(/^\/+/, "");
    const fileName = normalizedUrl.split("/").pop() ?? normalizedUrl;

    return assetMap[normalizedUrl] ?? assetMap[fileName] ?? requestedUrl;
  };
}

function GLTFModel({
  url,
  assetMap,
  onLoad,
  onError
}: Pick<ModelLoaderR3FProps, "url" | "assetMap" | "onLoad" | "onError">) {
  const gltf = useLoader(
    GLTFLoader,
    url,
    (loader) => {
      loader.manager.setURLModifier(
        createAssetUrlResolver(assetMap) ?? ((requestedUrl) => requestedUrl)
      );
    }
  ) as { scene: Object3D };

  return <LoadedObjectModel object={gltf.scene} onError={onError} onLoad={onLoad} />;
}

function STEPModel({
  url,
  onLoad,
  onError
}: Pick<ModelLoaderR3FProps, "url" | "onLoad" | "onError">) {
  const stepObject = useLoader(StepLoader, url) as Object3D;

  return <LoadedObjectModel object={stepObject} onError={onError} onLoad={onLoad} />;
}

export function ModelLoaderR3F({
  url,
  extension,
  assetMap,
  onLoad,
  onError
}: ModelLoaderR3FProps) {
  if (extension === "glb" || extension === "gltf") {
    return <GLTFModel assetMap={assetMap} onError={onError} url={url} onLoad={onLoad} />;
  }

  if (extension === "step" || extension === "stp") {
    return <STEPModel onError={onError} url={url} onLoad={onLoad} />;
  }

  onError(new Error(`Unsupported model format: ${extension}`));
  return null;
}
