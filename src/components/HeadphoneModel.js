"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

const MODEL_URL = "/models/headphone/aural-forge-headphone.glb";

export default function HeadphoneModel({
  earPadRef,
  coverRef,
  ...props
}) {
  const { scene } = useGLTF(MODEL_URL);

  useEffect(() => {
    if (earPadRef) {
      earPadRef.current = scene.getObjectByName("Ear_Pad");
    }

    if (coverRef) {
      coverRef.current = scene.getObjectByName("Cover");
    }

    return () => {
      if (earPadRef) {
        earPadRef.current = null;
      }

      if (coverRef) {
        coverRef.current = null;
      }
    };
  }, [scene, earPadRef, coverRef]);

  return <primitive object={scene} {...props} />;
}

useGLTF.preload(MODEL_URL);