"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import ProductInspectionController from "./ProductInspectionController";
import ScrollChoreographyController from "./ScrollChoreographyController";

export default function ProductStage({
  family, rig, productRootRef, inspectionSection, inspectionRef,
  onInspectionSectionChange, onStageReady, onStageUnavailable, onStageMotionRegistration,
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
    // A mounted GLB is not necessarily in view. Wait until a mesh from this
    // family has actually drawn before fading out its loading still.
    const restore = [];
    let firstFrame;
    function restoreDrawHooks() {
      restore.splice(0).forEach(undo => undo());
    }
    rig.scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      const previous = mesh.onAfterRender;
      mesh.onAfterRender = function (...args) {
        previous.apply(this, args);
        if (firstFrame !== undefined) return;
        firstFrame = requestAnimationFrame(() => {
          restoreDrawHooks();
          onStageReady(family.id);
        });
      };
      restore.push(() => { mesh.onAfterRender = previous; });
    });
    invalidate();
    return () => {
      cancelAnimationFrame(firstFrame);
      restoreDrawHooks();
      onStageMotionRegistration(family.id, null);
      onStageUnavailable(family.id);
    };
  }, [family.id, rig.scene, productRootRef, invalidate, onStageMotionRegistration, onStageReady, onStageUnavailable]);

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
