"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import ProductInspectionController from "./ProductInspectionController";
import ScrollChoreographyController from "./ScrollChoreographyController";

export default function ProductStage({
  family, rig, productRootRef, inspectionSection, inspectionRef,
  onInspectionSectionChange, onStageReady, onStageUnavailable, onStageMotionRegistration,
}) {
  const narrativeRoot = useRef(null);
  const firstFrame = useRef(null);
  const invalidate = useThree(state => state.invalidate);
  useFrame(() => {
    const pending = firstFrame.current;
    if (pending && !pending.id) pending.id = requestAnimationFrame(pending.ready);
  });
  useEffect(() => {
    const outer = productRootRef.current;
    function handoff(amount, entering) {
      const earbuds = family.id === "earbuds";
      outer.position.set(
        (entering ? -.24 : .28) * amount,
        (entering ? .32 : -.42) * amount,
        -.56 * amount
      );
      outer.rotation.x = earbuds ? 0 : (entering ? -.16 : .14) * amount;
      outer.scale.setScalar(1 - (earbuds ? .12 : .18) * amount);
      invalidate();
    }
    onStageMotionRegistration(family.id, {
      exit: p => handoff(p, false), enter: p => handoff(1 - p, true),
    });
    // Wait for the first family frame to be submitted to WebGL before blending in.
    const pending = { id: 0, ready: () => onStageReady(family.id) };
    firstFrame.current = pending;
    invalidate();
    return () => {
      cancelAnimationFrame(pending.id);
      firstFrame.current = null;
      onStageMotionRegistration(family.id, null);
      onStageUnavailable(family.id);
    };
  }, [family.id, productRootRef, invalidate, onStageMotionRegistration, onStageReady, onStageUnavailable]);

  return (
    <group ref={productRootRef} name="FamilyHandoff">
      <group ref={narrativeRoot} name="NarrativePose">
        <ProductInspectionController section={inspectionSection} inspectionRef={inspectionRef}
          revealBounds={rig.expandedBounds}>
          <primitive object={rig.scene} dispose={null} />
        </ProductInspectionController>
      </group>
      <ScrollChoreographyController productRootRef={narrativeRoot} rig={rig}
        inspectionRef={inspectionRef} onInspectionSectionChange={onInspectionSectionChange} />
    </group>
  );
}
