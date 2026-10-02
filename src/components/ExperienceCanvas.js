"use client";

import { Canvas } from "@react-three/fiber";
import ExperienceScene from "./ExperienceScene";

export default function ExperienceCanvas() {
  return (
    <Canvas
      frameloop="demand"
      camera={{
        position: [0, 0, 5],
        fov: 45,
        near: 0.1,
        far: 1000,
      }}
    >
      <ExperienceScene />
    </Canvas>
  );
}