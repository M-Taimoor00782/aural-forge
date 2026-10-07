"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import HeadphoneModel from "./HeadphoneModel";
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
  activeProductState,
  acousticRevealActive = false,
}) {
  const productRootRef = useRef(null);
  const earPadRef = useRef(null);
  const coverRef = useRef(null);

  const assembledPartsRef = useRef(null);
  const revealActiveRef = useRef(false);
  const revealTimelineRef = useRef(null);

  const invalidate = useThree((state) => state.invalidate);

  const { product } = resolveProductState(activeProductState);

 useEffect(() => {
  const productRoot = productRootRef.current;

  if (!productRoot) {
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
}, [product, invalidate]);

  useEffect(() => {
    const earPad = earPadRef.current;
    const cover = coverRef.current;

    if (!earPad || !cover) {
      return;
    }

    if (acousticRevealActive === revealActiveRef.current) {
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
        if (revealTimelineRef.current === timeline) {
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

  return (
    <group ref={productRootRef}>
      <HeadphoneModel earPadRef={earPadRef} coverRef={coverRef} />
    </group>
  );
}
