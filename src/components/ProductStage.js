"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";

import HeadphoneModel from "./HeadphoneModel";
import ProductInspectionController from "./ProductInspectionController";

import { resolveProductState } from "@/config/productStates";
import { animateProductReveal } from "@/lib/animateProductReveal";
import { animateProductState } from "@/lib/animateProductState";

function captureLocalTransform(object) {
  return {
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
  };
}

export default function ProductStage({
  productRootRef,
  modelBounds,
  activeProductState,
  acousticRevealActive = false,
  choreographyActive = false,
}) {
  const earPadRef = useRef(null);
  const coverRef = useRef(null);

  const assembledPartsRef = useRef(null);
  const revealActiveRef = useRef(false);
  const revealTimelineRef = useRef(null);

  const invalidate = useThree(
    (state) => state.invalidate
  );

  const viewport = useThree(
    (state) => state.size
  );

  const { product } = useMemo(
    () =>
      resolveProductState(activeProductState, {
        viewport,
        modelBounds,
      }),
    [activeProductState, viewport, modelBounds]
  );

  // Keep GSAP's ownership of the cinematic
  // product root completely unchanged.
  useEffect(() => {
    const productRoot = productRootRef.current;

    if (!productRoot || choreographyActive) {
      return;
    }

    const timeline = animateProductState({
      productRoot,
      productTarget: product,
      invalidate,
    });

    return () => {
      timeline.kill();
    };
  }, [
    product,
    choreographyActive,
    invalidate,
    productRootRef,
  ]);

  // Preserve the existing acoustic reveal.
  //
  // Ear-pad and cover refs still point directly
  // to the original model parts. The inspection
  // pivot does not replace those references.
  useEffect(() => {
    const earPad = earPadRef.current;
    const cover = coverRef.current;

    if (!earPad || !cover) {
      return;
    }

    if (
      acousticRevealActive === revealActiveRef.current
    ) {
      return;
    }

    if (!assembledPartsRef.current) {
      assembledPartsRef.current = {
        earPad: captureLocalTransform(earPad),
        cover: captureLocalTransform(cover),
      };
    }

    revealTimelineRef.current?.kill();

    const timeline = animateProductReveal({
      earPad,
      cover,
      assembled: assembledPartsRef.current,
      reveal: acousticRevealActive,
      invalidate,
      onComplete: () => {
        if (
          revealTimelineRef.current === timeline
        ) {
          revealTimelineRef.current = null;
        }
      },
    });

    revealTimelineRef.current = timeline;
    revealActiveRef.current = acousticRevealActive;
  }, [acousticRevealActive, invalidate]);

  useEffect(() => {
    return () => {
      revealTimelineRef.current?.kill();
    };
  }, []);

  // Inspection is a separate nested transform.
  //
  // During active cinematic choreography or
  // acoustic disassembly, the inspection system
  // returns to neutral and gives priority to
  // the authored product animation.
  const inspectionEnabled =
    !choreographyActive &&
    !acousticRevealActive;

  return (
    <group
      ref={productRootRef}
      name="AuralForgeCinematicProductRoot"
    >
      <ProductInspectionController
        enabled={inspectionEnabled}
        maxYaw={0.34}
        maxPitch={0.19}
      >
        <HeadphoneModel
          earPadRef={earPadRef}
          coverRef={coverRef}
        />
      </ProductInspectionController>
    </group>
  );
}
