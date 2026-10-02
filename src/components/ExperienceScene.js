import { Suspense } from "react";
import ProductStage from "./ProductStage";

export default function ExperienceScene() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 4, 5]} intensity={3} />

      <Suspense fallback={null}>
        <ProductStage />
      </Suspense>
    </>
  );
}