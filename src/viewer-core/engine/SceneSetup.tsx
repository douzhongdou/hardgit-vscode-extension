import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  ACESFilmicToneMapping,
  DoubleSide,
  ShadowMaterial,
  SRGBColorSpace
} from "three";
import type { SceneSetupProps } from "../types";

const DARK_BACKGROUND = "#0f1722";
const LIGHT_BACKGROUND = "#eef3f9";

export function SceneSetup({
  backgroundMode = "dark",
  sceneBounds = null
}: SceneSetupProps) {
  const { gl, scene } = useThree();
  const backgroundColor =
    backgroundMode === "light" ? LIGHT_BACKGROUND : DARK_BACKGROUND;
  const hemisphereColors =
    backgroundMode === "light"
      ? (["#ffffff", "#c7d2de", 0.62] as const)
      : (["#dcecff", "#101926", 0.28] as const);
  const gridPositionY =
    sceneBounds === null ? -0.001 : -(sceneBounds.size[1] * 0.5 + 0.03);
  const shadowScale =
    sceneBounds === null
      ? 10
      : Math.max(sceneBounds.size[0], sceneBounds.size[2]) * 1.8;

  useEffect(() => {
    scene.background = null;
    scene.backgroundBlurriness = 0;
    gl.shadowMap.enabled = true;
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = backgroundMode === "light" ? 1.12 : 1.08;
  }, [backgroundMode, gl, scene]);

  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <ambientLight intensity={backgroundMode === "light" ? 0.24 : 0.16} />
      <hemisphereLight args={hemisphereColors} />
      <directionalLight
        castShadow
        intensity={backgroundMode === "light" ? 3.4 : 3.9}
        position={[10, 13, 9]}
        shadow-bias={-0.00012}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
        shadow-normalBias={0.018}
      />
      <directionalLight
        intensity={backgroundMode === "light" ? 0.34 : 0.42}
        position={[-8, 3.5, -7]}
      />
      <directionalLight
        intensity={backgroundMode === "light" ? 0.9 : 1.15}
        position={[4, 7, -11]}
      />
      {sceneBounds !== null ? (
        <mesh
          position={[0, gridPositionY + 0.012, 0]}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[shadowScale, shadowScale]} />
          <primitive
            attach="material"
            object={new ShadowMaterial({
              opacity: backgroundMode === "light" ? 0.18 : 0.3,
              side: DoubleSide
            })}
          />
        </mesh>
      ) : null}
    </>
  );
}
