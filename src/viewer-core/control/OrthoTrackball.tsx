import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  OrthographicCamera,
  Vector3,
  type OrthographicCamera as OrthographicCameraInstance
} from "three";
import { TrackballControls as TrackballControlsImpl } from "three/examples/jsm/controls/TrackballControls.js";
import type { SceneBounds } from "../types";

export type OrthoTrackballHandle = {
  fitView: (bounds: SceneBounds) => void;
  reset: () => void;
};

type OrthoTrackballProps = {
  position?: [number, number, number];
  target?: [number, number, number];
};

const DEFAULT_POSITION: [number, number, number] = [8, 8, 8];
const DEFAULT_TARGET: [number, number, number] = [0, 0, 0];

export const OrthoTrackball = forwardRef<
  OrthoTrackballHandle,
  OrthoTrackballProps
>(function OrthoTrackball(
  {
    position = DEFAULT_POSITION,
    target = DEFAULT_TARGET
  },
  forwardedRef
) {
  const { gl, set, size } = useThree();
  const cameraRef = useRef<OrthographicCameraInstance>(
    new OrthographicCamera(-8, 8, 8, -8, 0.1, 4000)
  );
  const controlsRef = useRef<TrackballControlsImpl | null>(null);
  const baseDirection = useMemo(
    () => new Vector3(1, 1, 1).normalize(),
    []
  );

  const applyFitView = (bounds: SceneBounds) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (controls === null || size.width === 0 || size.height === 0) {
      return;
    }

    const center = new Vector3(...bounds.center);
    const sizeVector = new Vector3(...bounds.size);
    const radius = Math.max(sizeVector.length() * 0.5, 1);
    const aspect = size.width / size.height;
    const halfHeight = radius * 1.35;
    const halfWidth = halfHeight * aspect;
    const distance = radius * 3.2;

    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.near = Math.max(0.1, distance / 20);
    camera.far = Math.max(2000, distance * 20);
    camera.zoom = 1;
    camera.position.copy(center.clone().addScaledVector(baseDirection, distance));
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    controls.target.copy(center);
    controls.update();
  };

  useImperativeHandle(
    forwardedRef,
    () => ({
      fitView: applyFitView,
      reset: () => {
        applyFitView({
          center: DEFAULT_TARGET,
          size: [8, 8, 8]
        });
      }
    }),
    [size.height, size.width]
  );

  useEffect(() => {
    const camera = cameraRef.current;

    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    set({ camera });
  }, [position, set, target]);

  useEffect(() => {
    const controls = new TrackballControlsImpl(cameraRef.current, gl.domElement);

    controls.rotateSpeed = 3.2;
    controls.panSpeed = 0.9;
    controls.zoomSpeed = 1.1;
    controls.dynamicDampingFactor = 0.12;
    controls.target.set(...target);
    controls.update();
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [gl, target]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return <primitive object={cameraRef.current} />;
});
