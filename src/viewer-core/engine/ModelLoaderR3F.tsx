import React, { useEffect, useMemo, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import {
  Box3,
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3
} from "three";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { createRenderableModelLoadResult } from "./model-load-result.ts";
import { IgesLoader } from "./IgesLoader";
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

function createFallbackStandardMaterial() {
  return new MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.12,
    roughness: 0.74,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });
}

function createGeometryObject(
  geometry: BufferGeometry,
  meshName: string
): Object3D {
  const nextGeometry = geometry.clone();

  if (nextGeometry.attributes.normal === undefined) {
    nextGeometry.computeVertexNormals();
  }

  nextGeometry.computeBoundingSphere();

  const mesh = new Mesh(nextGeometry, createFallbackStandardMaterial());
  mesh.name = meshName;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
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

function configureAssetResolver(
  loader: {
    manager: {
      setURLModifier: (modifier: (url: string) => string) => void;
    };
  },
  assetMap?: ModelAssetMap | null
) {
  loader.manager.setURLModifier(
    createAssetUrlResolver(assetMap) ?? ((requestedUrl) => requestedUrl)
  );
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
      configureAssetResolver(loader, assetMap);
    }
  ) as { scene: Object3D };

  return <LoadedObjectModel object={gltf.scene} onError={onError} onLoad={onLoad} />;
}

function FBXModel({
  url,
  assetMap,
  onLoad,
  onError
}: Pick<ModelLoaderR3FProps, "url" | "assetMap" | "onLoad" | "onError">) {
  const fbx = useLoader(
    FBXLoader,
    url,
    (loader) => {
      configureAssetResolver(loader, assetMap);
    }
  ) as Object3D;

  return <LoadedObjectModel object={fbx} onError={onError} onLoad={onLoad} />;
}

function OBJModel({
  url,
  assetMap,
  onLoad,
  onError
}: Pick<ModelLoaderR3FProps, "url" | "assetMap" | "onLoad" | "onError">) {
  const obj = useLoader(
    OBJLoader,
    url,
    (loader) => {
      configureAssetResolver(loader, assetMap);
    }
  ) as Object3D;

  return <LoadedObjectModel object={obj} onError={onError} onLoad={onLoad} />;
}

function STLModel({
  url,
  onLoad,
  onError
}: Pick<ModelLoaderR3FProps, "url" | "onLoad" | "onError">) {
  const geometry = useLoader(STLLoader, url) as BufferGeometry;
  const object = useMemo(() => createGeometryObject(geometry, "STLMesh"), [geometry]);

  return <LoadedObjectModel object={object} onError={onError} onLoad={onLoad} />;
}

function PLYModel({
  url,
  onLoad,
  onError
}: Pick<ModelLoaderR3FProps, "url" | "onLoad" | "onError">) {
  const geometry = useLoader(PLYLoader, url) as BufferGeometry;
  const object = useMemo(() => createGeometryObject(geometry, "PLYMesh"), [geometry]);

  return <LoadedObjectModel object={object} onError={onError} onLoad={onLoad} />;
}

function DAEModel({
  url,
  assetMap,
  onLoad,
  onError
}: Pick<ModelLoaderR3FProps, "url" | "assetMap" | "onLoad" | "onError">) {
  const collada = useLoader(
    ColladaLoader,
    url,
    (loader) => {
      configureAssetResolver(loader, assetMap);
    }
  ) as { scene: Object3D };

  return (
    <LoadedObjectModel object={collada.scene} onError={onError} onLoad={onLoad} />
  );
}

function STEPModel({
  url,
  onLoad,
  onError
}: Pick<ModelLoaderR3FProps, "url" | "onLoad" | "onError">) {
  const stepObject = useLoader(StepLoader, url) as Object3D;

  return <LoadedObjectModel object={stepObject} onError={onError} onLoad={onLoad} />;
}

function IGESModel({
  url,
  onLoad,
  onError
}: Pick<ModelLoaderR3FProps, "url" | "onLoad" | "onError">) {
  const igesObject = useLoader(IgesLoader, url) as Object3D;

  return <LoadedObjectModel object={igesObject} onError={onError} onLoad={onLoad} />;
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

  if (extension === "fbx") {
    return <FBXModel assetMap={assetMap} onError={onError} url={url} onLoad={onLoad} />;
  }

  if (extension === "obj") {
    return <OBJModel assetMap={assetMap} onError={onError} url={url} onLoad={onLoad} />;
  }

  if (extension === "stl") {
    return <STLModel onError={onError} url={url} onLoad={onLoad} />;
  }

  if (extension === "ply") {
    return <PLYModel onError={onError} url={url} onLoad={onLoad} />;
  }

  if (extension === "dae") {
    return <DAEModel assetMap={assetMap} onError={onError} url={url} onLoad={onLoad} />;
  }

  if (extension === "step" || extension === "stp") {
    return <STEPModel onError={onError} url={url} onLoad={onLoad} />;
  }

  if (extension === "iges" || extension === "igs") {
    return <IGESModel onError={onError} url={url} onLoad={onLoad} />;
  }

  onError(new Error(`Unsupported model format: ${extension}`));
  return null;
}
