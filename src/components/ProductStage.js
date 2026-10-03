"use client";

import { useRef } from "react";
import HeadphoneModel from "./HeadphoneModel";
import { PRODUCT_STATES } from "@/config/productStates";

export default function ProductStage() {
  const productRootRef = useRef(null);
  const earPadRef = useRef(null);
  const coverRef = useRef(null);

  const { product } = PRODUCT_STATES.neutral;

  return (
    <group
      ref={productRootRef}
      position={product.position}
      rotation={product.rotation}
      scale={product.scale}
    >
      <HeadphoneModel
        earPadRef={earPadRef}
        coverRef={coverRef}
      />
    </group>
  );
}
