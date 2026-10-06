"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { resolveProductState } from "@/config/productStates";

export default function CameraStateController({ activeProductState }) {
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);

  const { camera: cameraTarget } =
    resolveProductState(activeProductState);

  useEffect(() => {
    const camera = get().camera;

    camera.position.set(...cameraTarget.position);
    camera.fov = cameraTarget.fov;
    camera.updateProjectionMatrix();

    invalidate();
  }, [get, cameraTarget, invalidate]);

  return null;
}