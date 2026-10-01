"use client";

import { Canvas } from "@react-three/fiber";
import ExperienceScene from "./ExperienceScene";

export default function ExperienceCanvas() {
  return (
    <Canvas frameloop="demand">
      <ExperienceScene />
    </Canvas>
  );
}