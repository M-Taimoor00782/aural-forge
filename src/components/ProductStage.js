"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import ProductInspectionController from "./ProductInspectionController";
import ScrollChoreographyController from "./ScrollChoreographyController";

export default function ProductStage({
  family, rig, productRootRef, choreographyActive, familyTransitionActive,
  onChoreographyActiveChange, onStageReady, onStageUnavailable, onStageMotionRegistration,
}) {
  const narrativeRoot = useRef(null);
  const invalidate = useThree(state => state.invalidate);
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
    onStageReady(family.id);
    return () => {
      onStageMotionRegistration(family.id, null);
      onStageUnavailable(family.id);
    };
  }, [family.id, productRootRef, invalidate, onStageMotionRegistration, onStageReady, onStageUnavailable]);

  return (
    <group ref={productRootRef} name="FamilyHandoff">
      <group ref={narrativeRoot} name="NarrativePose">
        <ProductInspectionController enabled={!choreographyActive && !familyTransitionActive}
          maxYaw={family.id === "earbuds" ? .28 : .34} maxPitch={.16}>
          <primitive object={rig.scene} dispose={null} />
        </ProductInspectionController>
      </group>
      <ScrollChoreographyController productRootRef={narrativeRoot} rig={rig}
        onChoreographyActiveChange={onChoreographyActiveChange} />
    </group>
  );
}
