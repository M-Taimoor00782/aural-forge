"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import HeadphoneModel from "./HeadphoneModel";
import { resolveProductState } from "@/config/productStates";

export default function ProductStage({ activeProductState }) {
  const productRootRef = useRef(null);
  const earPadRef = useRef(null);
  const coverRef = useRef(null);
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

  return (
    <group ref={productRootRef}>
      <HeadphoneModel
        earPadRef={earPadRef}
        coverRef={coverRef}
      />
    </group>
  );
}