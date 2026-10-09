
"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";

import { resolveProductState } from "@/config/productStates";
import { animateCameraState } from "@/lib/animateCameraState";

export default function CameraStateController({
  activeProductState,
  choreographyActive = false,
  modelBounds,
}) {
  const get = useThree((state) => state.get);

  const invalidate = useThree(
    (state) => state.invalidate
  );

  const viewport = useThree(
    (state) => state.size
  );

  const { camera: cameraTarget } = useMemo(
    () =>
      resolveProductState(activeProductState, {
        viewport,
        modelBounds,
      }),
    [activeProductState, viewport, modelBounds]
  );

  useEffect(() => {
    const camera = get().camera;

    if (choreographyActive) {
      return;
    }

    const timeline = animateCameraState({
      camera,
      cameraTarget,
      invalidate,
    });

    return () => {
      timeline.kill();
    };
  }, [
    get,
    cameraTarget,
    choreographyActive,
    invalidate,
  ]);

  return null;
}
