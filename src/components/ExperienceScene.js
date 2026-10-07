import { Suspense } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import CameraStateController from "./CameraStateController";
import ProductStage from "./ProductStage";

export default function ExperienceScene({
  activeProductState,
  acousticRevealActive,
}) {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, 3, 5]}
          rotation={[0, Math.PI, 0]}
          scale={[6, 3, 1]}
        />
      </Environment>

      <directionalLight position={[4, 5, 6]} intensity={2.25} />

      <directionalLight position={[-4, 2, -4]} intensity={0.65} />

      <CameraStateController activeProductState={activeProductState} />

      <Suspense fallback={null}>
        <ProductStage
          activeProductState={activeProductState}
          acousticRevealActive={acousticRevealActive}
        />
      </Suspense>
    </>
  );
}
