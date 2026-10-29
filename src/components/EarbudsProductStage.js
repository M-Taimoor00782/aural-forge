"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";

const Y_AXIS = new Vector3(0, 1, 0);

// Initial handoff motion.
// Final staging will be tuned against the real Earbuds GLB.
const HANDOFF = {
  enterOffset: new Vector3(-0.2, 0.18, -0.45),
  exitOffset: new Vector3(0.2, -0.18, -0.45),
  rotation: 0.1,
  scaleReduction: 0.12,
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function capturePose(root) {
  return {
    position: root.position.clone(),
    quaternion: root.quaternion.clone(),
    scale: root.scale.clone(),
  };
}

function applyTransitionPose({
  root,
  basePose,
  progress,
  entering,
  invalidate,
}) {
  const t = clamp01(progress);
  const amount = entering ? 1 - t : t;

  const offset = entering
    ? HANDOFF.enterOffset
    : HANDOFF.exitOffset;

  const yaw = entering
    ? -HANDOFF.rotation
    : HANDOFF.rotation;

  root.position
    .copy(basePose.position)
    .addScaledVector(offset, amount);

  const tilt = new Quaternion().setFromAxisAngle(
    Y_AXIS,
    yaw * amount
  );

  root.quaternion
    .copy(basePose.quaternion)
    .multiply(tilt);

  root.scale
    .copy(basePose.scale)
    .multiplyScalar(
      1 - HANDOFF.scaleReduction * amount
    );

  invalidate();
}

export default function EarbudsProductStage({
  family,
  productRootRef,
  onStageReady,
  onStageUnavailable,
  onStageMotionRegistration,
}) {
  // This component is mounted only after the registry
  // identifies a real, available Earbuds asset.
  const { scene } = useGLTF(family.asset.url);

  const invalidate = useThree(
    (state) => state.invalidate
  );

  // Keep the cached GLB source separate from
  // the actual rendered product instance.
  //
  // Geometry and materials remain shared until
  // the real mesh/material mappings are inspected.
  const modelInstance = useMemo(
    () => scene.clone(true),
    [scene]
  );

  useEffect(() => {
    const root = productRootRef.current;

    if (!root || !modelInstance) {
      return;
    }

    const basePose = capturePose(root);

    const motionApi = {
      exit(progress) {
        applyTransitionPose({
          root,
          basePose,
          progress,
          entering: false,
          invalidate,
        });
      },

      enter(progress) {
        applyTransitionPose({
          root,
          basePose,
          progress,
          entering: true,
          invalidate,
        });
      },
    };

    // Register actual stage motion before reporting
    // readiness to the transition director.
    onStageMotionRegistration?.(
      family.id,
      motionApi
    );

    onStageReady?.(family.id);

    return () => {
      onStageMotionRegistration?.(
        family.id,
        null
      );

      onStageUnavailable?.(family.id);
    };
  }, [
    family.id,
    modelInstance,
    productRootRef,
    invalidate,
    onStageReady,
    onStageUnavailable,
    onStageMotionRegistration,
  ]);

  return (
    <group ref={productRootRef}>
      <primitive object={modelInstance} />
    </group>
  );
}
