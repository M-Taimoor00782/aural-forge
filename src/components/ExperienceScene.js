import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useThree } from "@react-three/fiber";

import {
  Environment,
  Lightformer,
  useGLTF,
} from "@react-three/drei";

import {
  Euler,
  Quaternion,
  Vector3,
} from "three";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  isProductFamilyReady,
} from "@/config/productFamilies";

import { resolveProductState } from "@/config/productStates";
import { useProductVariantMaterials } from "@/lib/useProductVariantMaterials";
import { measureHeadphoneBounds } from "@/lib/responsiveComposition";

import CameraStateController from "./CameraStateController";
import ProductStage from "./ProductStage";
import EarbudsProductStage from "./EarbudsProductStage";
import ScrollChoreographyController from "./ScrollChoreographyController";


const EARBUDS_FAMILY_ID = "earbuds";

const X_AXIS = new Vector3(1, 0, 0);

function captureTransform(root) {
  return {
    position: root.position.clone(),
    quaternion: root.quaternion.clone(),
    scale: root.scale.clone(),
  };
}

function applyHandoffTransform({
  root,
  base,
  progress,
  entering,
  invalidate,
}) {
  const p = Math.max(0, Math.min(1, progress));

  const amount = entering ? 1 - p : p;

  const offset = entering
    ? new Vector3(-0.24, 0.32, -0.48)
    : new Vector3(0.28, -0.42, -0.62);

  const angle = entering
    ? -0.16 * amount
    : 0.14 * amount;

  root.position
    .copy(base.position)
    .addScaledVector(offset, amount);

  const tilt = new Quaternion().setFromAxisAngle(
    X_AXIS,
    angle
  );

  root.quaternion
    .copy(base.quaternion)
    .multiply(tilt);

  root.scale
    .copy(base.scale)
    .multiplyScalar(1 - 0.18 * amount);

  invalidate();
}

function HeadphoneProductExperience({
  family,
  variantId,
  productRootRef,
  activeProductState,
  acousticRevealActive,
  choreographyActive,
  familyTransitionActive,
  onChoreographyActiveChange,
  onStageReady,
  onStageUnavailable,
  onStageMotionRegistration,
}) {
  const { scene } = useGLTF(family.asset.url);

  const invalidate = useThree(
    (state) => state.invalidate
  );

  const viewport = useThree(
    (state) => state.size
  );

  const modelBounds = useMemo(
    () => measureHeadphoneBounds(scene),
    [scene]
  );

  useProductVariantMaterials({
    scene,
    productRootRef,
    variantId,
    invalidate,
  });

  const storyRef = useRef(null);

  storyRef.current = {
    activeProductState,
    viewport,
    modelBounds,
  };

  const exitPoseRef = useRef(null);
  const enterPoseRef = useRef(null);

  useEffect(() => {
    const root = productRootRef.current;

    if (!root) {
      return;
    }

    const motionApi = {
      exit(progress) {
        if (
          progress <= 0 ||
          !exitPoseRef.current
        ) {
          exitPoseRef.current =
            captureTransform(root);
        }

        applyHandoffTransform({
          root,
          base: exitPoseRef.current,
          progress,
          entering: false,
          invalidate,
        });
      },

      enter(progress) {
        if (
          progress <= 0 ||
          !enterPoseRef.current
        ) {
          const {
            activeProductState: stateName,
            viewport: currentViewport,
            modelBounds: currentBounds,
          } = storyRef.current;

          const { product } = resolveProductState(
            stateName,
            {
              viewport: currentViewport,
              modelBounds: currentBounds,
            }
          );

          enterPoseRef.current = {
            position: new Vector3(
              ...product.position
            ),

            quaternion:
              new Quaternion().setFromEuler(
                new Euler(...product.rotation)
              ),

            scale: new Vector3(
              product.scale,
              product.scale,
              product.scale
            ),
          };
        }

        applyHandoffTransform({
          root,
          base: enterPoseRef.current,
          progress,
          entering: true,
          invalidate,
        });
      },
    };

    onStageMotionRegistration?.(
      family.id,
      motionApi
    );

    onStageReady?.(family.id);

    return () => {
      onStageMotionRegistration?.(
        family.id,
        null
      );

      onStageUnavailable?.(family.id);

      exitPoseRef.current = null;
      enterPoseRef.current = null;
    };
  }, [
    family.id,
    productRootRef,
    invalidate,
    onStageReady,
    onStageUnavailable,
    onStageMotionRegistration,
  ]);

  const motionOwned =
    choreographyActive || familyTransitionActive;

  return (
    <>
      <CameraStateController
        activeProductState={activeProductState}
        choreographyActive={motionOwned}
        modelBounds={modelBounds}
      />

      {!familyTransitionActive && (
        <ScrollChoreographyController
          productRootRef={productRootRef}
          modelBounds={modelBounds}
          onChoreographyActiveChange={
            onChoreographyActiveChange
          }
        />
      )}

      <ProductStage
        productRootRef={productRootRef}
        modelBounds={modelBounds}
        activeProductState={activeProductState}
        acousticRevealActive={acousticRevealActive}
        choreographyActive={motionOwned}
      />
    </>
  );
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
};

const PRODUCT_ENVIRONMENT_COMPONENTS = {
  [DEFAULT_PRODUCT_FAMILY_ID]:
    HeadphoneEnvironment,

  [EARBUDS_FAMILY_ID]:
    EarbudsEnvironment,
};

export default function ExperienceScene({
  familyId = DEFAULT_PRODUCT_FAMILY_ID,
  variantId,
  activeProductState,
  acousticRevealActive,
  choreographyActive,
  familyTransitionActive = false,
  onChoreographyActiveChange,
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
          activeProductState={activeProductState}
          acousticRevealActive={acousticRevealActive}
          choreographyActive={choreographyActive}
          familyTransitionActive={familyTransitionActive}
          onChoreographyActiveChange={
            onChoreographyActiveChange
          }
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

