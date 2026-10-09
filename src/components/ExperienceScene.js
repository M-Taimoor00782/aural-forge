
import { Suspense, useMemo, useRef } from "react";
import {
  Environment,
  Lightformer,
  useGLTF,
} from "@react-three/drei";

import CameraStateController from "./CameraStateController";
import ProductStage from "./ProductStage";
import ScrollChoreographyController from "./ScrollChoreographyController";

import { measureHeadphoneBounds } from "@/lib/responsiveComposition";

const MODEL_URL =
  "/models/headphone/aural-forge-headphone.glb";

function ProductExperience({
  productRootRef,
  activeProductState,
  acousticRevealActive,
  choreographyActive,
  onChoreographyActiveChange,
}) {
  const { scene } = useGLTF(MODEL_URL);

  const modelBounds = useMemo(
    () => measureHeadphoneBounds(scene),
    [scene]
  );

  return (
    <>
      <CameraStateController
        activeProductState={activeProductState}
        choreographyActive={choreographyActive}
        modelBounds={modelBounds}
      />

      <ScrollChoreographyController
        productRootRef={productRootRef}
        modelBounds={modelBounds}
        onChoreographyActiveChange={
          onChoreographyActiveChange
        }
      />

      <ProductStage
        productRootRef={productRootRef}
        modelBounds={modelBounds}
        activeProductState={activeProductState}
        acousticRevealActive={acousticRevealActive}
        choreographyActive={choreographyActive}
      />
    </>
  );
}

export default function ExperienceScene({
  activeProductState,
  acousticRevealActive,
  choreographyActive,
  onChoreographyActiveChange,
}) {
  const productRootRef = useRef(null);

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

      <directionalLight
        position={[4, 5, 6]}
        intensity={2.25}
      />

      <directionalLight
        position={[-4, 2, -4]}
        intensity={0.65}
      />

      <Suspense fallback={null}>
        <ProductExperience
          productRootRef={productRootRef}
          activeProductState={activeProductState}
          acousticRevealActive={acousticRevealActive}
          choreographyActive={choreographyActive}
          onChoreographyActiveChange={
            onChoreographyActiveChange
          }
        />
      </Suspense>
    </>
  );
}
