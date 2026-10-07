"use client";

import { Canvas } from "@react-three/fiber";
import ExperienceScene from "./ExperienceScene";
import { PRODUCT_STATES } from "@/config/productStates";

export default function ExperienceCanvas({
  activeProductState,
  acousticRevealActive,
}) {
  const { camera } = PRODUCT_STATES.neutral;

  return (
   <Canvas
  frameloop="demand"
  style={{
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 0,
  }}
  camera={{
    position: camera.position,
    fov: camera.fov,
    near: 0.1,
    far: 1000,
  }}
>
      <ExperienceScene
        activeProductState={activeProductState}
        acousticRevealActive={acousticRevealActive}
      />
    </Canvas>
  );
}