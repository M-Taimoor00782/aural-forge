"use client";

import { Canvas } from "@react-three/fiber";
import ExperienceScene from "./ExperienceScene";
import { PRODUCT_STATES } from "@/config/productStates";

export default function ExperienceCanvas() {
  const { camera } = PRODUCT_STATES.neutral;

  return (
    <Canvas
      frameloop="demand"
      camera={{
        position: camera.position,
        fov: camera.fov,
        near: 0.1,
        far: 1000,
      }}
    >
      <ExperienceScene />
    </Canvas>
  );
}