import { Suspense } from "react";
import CameraStateController from "./CameraStateController";
import ProductStage from "./ProductStage";

export default function ExperienceScene({ activeProductState }) {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 4, 5]} intensity={3} />
      <directionalLight position={[-3, 2, 4]} intensity={1.25} />

      <CameraStateController activeProductState={activeProductState} />

      <Suspense fallback={null}>
        <ProductStage activeProductState={activeProductState} />
      </Suspense>
    </>
  );
}