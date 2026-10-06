"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import HeadphoneModel from "./HeadphoneModel";
import { resolveProductState } from "@/config/productStates";
import { PRODUCT_REVEAL } from "@/config/productReveal";

function captureLocalTransform(object) {
  return {
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
  };
}

function restoreLocalTransform(object, transform) {
  object.position.copy(transform.position);
  object.quaternion.copy(transform.quaternion);
  object.scale.copy(transform.scale);
}

export default function ProductStage({ activeProductState }) {
  const productRootRef = useRef(null);
  const earPadRef = useRef(null);
  const coverRef = useRef(null);

  const assembledPartsRef = useRef(null);
  const revealActiveRef = useRef(false);

  const invalidate = useThree((state) => state.invalidate);

  const { product } = resolveProductState(activeProductState);

  useEffect(() => {
    const productRoot = productRootRef.current;

    if (!productRoot) {
      return;
    }

    productRoot.position.set(...product.position);
    productRoot.rotation.set(...product.rotation);
    productRoot.scale.setScalar(product.scale);

    invalidate();
  }, [product, invalidate]);

  function handleRevealToggle(event) {
    event.stopPropagation();

    const earPad = earPadRef.current;
    const cover = coverRef.current;

    if (!earPad || !cover) {
      return;
    }

    if (!assembledPartsRef.current) {
      assembledPartsRef.current = {
        earPad: captureLocalTransform(earPad),
        cover: captureLocalTransform(cover),
      };
    }

    const assembled = assembledPartsRef.current;

    restoreLocalTransform(earPad, assembled.earPad);
    restoreLocalTransform(cover, assembled.cover);

    if (revealActiveRef.current) {
      revealActiveRef.current = false;
    } else {
      earPad.translateZ(PRODUCT_REVEAL.earPad.localZ);
      cover.translateZ(PRODUCT_REVEAL.cover.localZ);

      revealActiveRef.current = true;
    }

    earPad.updateMatrixWorld(true);
    cover.updateMatrixWorld(true);

    invalidate();
  }

  return (
    <group
      ref={productRootRef}
      onClick={handleRevealToggle}
    >
      <HeadphoneModel
        earPadRef={earPadRef}
        coverRef={coverRef}
      />
    </group>
  );
}