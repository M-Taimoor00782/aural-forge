"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { resolveProductState } from "@/config/productStates";
import { animateCameraState } from "@/lib/animateCameraState";

export default function CameraStateController({ activeProductState }) {
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);

  const { camera: cameraTarget } =
    resolveProductState(activeProductState);

  useEffect(() => {
    const camera = get().camera;

    const timeline = animateCameraState({
      camera,
      cameraTarget,
      invalidate,
    });

    return () => {
      timeline.kill();
    };
  }, [get, cameraTarget, invalidate]);

  return null;
}