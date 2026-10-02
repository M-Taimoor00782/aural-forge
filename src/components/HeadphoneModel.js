"use client";

import { useGLTF } from "@react-three/drei";

const MODEL_URL = "/models/headphone/aural-forge-headphone.glb";

export default function HeadphoneModel(props) {
  const { scene } = useGLTF(MODEL_URL);

  return <primitive object={scene} {...props} />;
}

useGLTF.preload(MODEL_URL);