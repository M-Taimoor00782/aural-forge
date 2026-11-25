import { Suspense, useMemo, useRef } from "react";

import { useThree } from "@react-three/fiber";
import { Group } from "three";

import {
  Environment,
  Lightformer,
  useGLTF,
} from "@react-three/drei";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  isProductFamilyReady,
} from "@/config/productFamilies";

import { headphoneMechanism, measureMechanism } from "@/lib/animateProductReveal";
import { useProductVariantMaterials } from "@/lib/useProductVariantMaterials";
import { measureHeadphoneBounds } from "@/lib/responsiveComposition";

import ProductStage from "./ProductStage";
import SmartwatchProductStage from "./SmartwatchProductStage";
import EarbudsProductStage from "./EarbudsProductStage";

const EARBUDS_FAMILY_ID = "earbuds";

function HeadphoneProductExperience(props) {
  const { scene: source } = useGLTF(props.family.asset.url);
  const invalidate = useThree(state => state.invalidate);
  const rig = useMemo(() => {
    const scene = source.clone(true);
    const bounds = measureHeadphoneBounds(scene);
    const presentation = new Group();
    presentation.name = "HeadphoneInspection";
    presentation.add(scene);
    const sample = headphoneMechanism(scene, presentation);
    return {
      scene: presentation, bounds, sample,
      revealRotation: [.035, -.65, -.04],
      expandedBounds: measureMechanism(presentation, sample),
      compactRevealBounds: measureMechanism(presentation, (progress, display) => sample(progress, display, true)),
    };
  }, [source]);
  useProductVariantMaterials({ scene: rig.scene, productRootRef: props.productRootRef,
    variantId: props.variantId, invalidate });
  return <ProductStage {...props} rig={rig} />;
}

function HeadphoneEnvironment() {
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
    </>
  );
}

// Earbuds initially reuse the existing neutral
// studio lighting so the black case, interiors,
// lid and earbuds remain readable.
//
// A family-specific lighting design can follow
// after the actual model is visually reviewed.
function EarbudsEnvironment() {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.8}
          position={[0, 3, 5]}
          rotation={[0, Math.PI, 0]}
          scale={[5, 3, 1]}
        />
      </Environment>

      <directionalLight
        position={[4, 5, 6]}
        intensity={2.1}
      />

      <directionalLight
        position={[-4, 2, -4]}
        intensity={0.8}
      />
    </>
  );
}

// Both product families use the same persistent
// React Three Fiber Canvas.
//
// Each family controls its own model stage;
// neither introduces a second Canvas.
const PRODUCT_STAGE_COMPONENTS = {
  [DEFAULT_PRODUCT_FAMILY_ID]:
    HeadphoneProductExperience,

  [EARBUDS_FAMILY_ID]:
    EarbudsProductStage,
  "product-03": SmartwatchProductStage,
};

const PRODUCT_ENVIRONMENT_COMPONENTS = {
  [DEFAULT_PRODUCT_FAMILY_ID]:
    HeadphoneEnvironment,

  [EARBUDS_FAMILY_ID]:
    EarbudsEnvironment,
  "product-03": EarbudsEnvironment,
};

export default function ExperienceScene({
  familyId = DEFAULT_PRODUCT_FAMILY_ID,
  variantId,
  inspectionSection,
  inspectionRef,
  onInspectionSectionChange,
  onStageReady,
  onStageUnavailable,
  onStageMotionRegistration,
}) {
  const productRootRef = useRef(null);

  const family = getProductFamily(familyId);

  const ready = isProductFamilyReady(familyId);

  const ActiveProductStage = ready
    ? PRODUCT_STAGE_COMPONENTS[family.id] ?? null
    : null;

  const ActiveEnvironment =
    PRODUCT_ENVIRONMENT_COMPONENTS[family.id] ?? null;

  if (!ActiveProductStage) {
    return null;
  }

  return (
    <>

      {ActiveEnvironment && (
        <ActiveEnvironment />
      )}

      <Suspense fallback={null}>
        <ActiveProductStage
          key={family.id}
          family={family}
          variantId={variantId}
          productRootRef={productRootRef}
          inspectionSection={inspectionSection}
          inspectionRef={inspectionRef}
          onInspectionSectionChange={onInspectionSectionChange}
          onStageReady={onStageReady}
          onStageUnavailable={onStageUnavailable}
          onStageMotionRegistration={
            onStageMotionRegistration
          }
        />
      </Suspense>
    </>
  );
}

