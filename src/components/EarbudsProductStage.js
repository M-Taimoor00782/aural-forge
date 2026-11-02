"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Color, Vector3 } from "three";
import gsap from "gsap";

import ProductInspectionController from "./ProductInspectionController";

import {
  getProductFamilyVariant,
  getProductFamilyWorld,
} from "@/config/productFamilies";

const MODEL_URL =
  "/models/earbuds/aural-forge-earbuds.glb";

// These are glTF source node INDICES, not runtime
// Object3D names. The indices come from the
// actual GLB inspection output.
//
// GLTFLoader can sanitize or uniquify names,
// so getObjectByName("Cube.045") is not reliable.
const SOURCE_NODE_INDICES = Object.freeze({
  caseRoot: 10,
  caseBody: 9,
  caseInterior: 0,
  firstEarbud: 2,
  firstEarTip: 1,
  secondEarbud: 4,
  secondEarTip: 3,
  hinge: 7,
  lidOuter: 5,
  lidInner: 6,
  indicator: 8,
});

const CAMERA = {
  fov: 35,
  verticalOccupancy: 0.68,
  horizontalOccupancy: 0.70,
  duration: 1.1,
};

// Each loaded GLB is inspected only once.
const inspectedGLBScenes = new WeakSet();

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function captureTransform(root) {
  return {
    position: root.position.clone(),
    quaternion: root.quaternion.clone(),
    scale: root.scale.clone(),
  };
}

function applyFamilyHandoff({
  root,
  baseline,
  progress,
  entering,
  invalidate,
}) {
  const amount = entering
    ? 1 - clamp01(progress)
    : clamp01(progress);

  const offset = entering
    ? new Vector3(-0.18, 0.24, -0.38)
    : new Vector3(0.22, -0.28, -0.48);

  root.position
    .copy(baseline.position)
    .addScaledVector(offset, amount);

  root.quaternion.copy(
    baseline.quaternion
  );

  root.scale
    .copy(baseline.scale)
    .multiplyScalar(
      1 - amount * 0.12
    );

  invalidate();
}

// Resolve actual runtime objects using
// GLTFLoader's source-node associations.
//
// Clone and source have matching traversal order
// immediately after clone(true). This lets us
// associate source node indices with objects in
// the independent renderable clone.
function resolveRuntimeNodes(gltf, clone) {
  const sourceObjects = [];
  const clonedObjects = [];

  gltf.scene.traverse((object) => {
    sourceObjects.push(object);
  });

  clone.traverse((object) => {
    clonedObjects.push(object);
  });

  const associations =
    gltf.parser?.associations;

  const runtimeByIndex = new Map();

  if (
    sourceObjects.length ===
    clonedObjects.length
  ) {
    sourceObjects.forEach((source, index) => {
      const association =
        associations?.get(source);

      // GLTFLoader stores the glTF node index
      // in association.nodes.
      const sourceNodeIndex =
        association?.nodes;

      if (
        Number.isInteger(sourceNodeIndex)
      ) {
        runtimeByIndex.set(
          sourceNodeIndex,
          clonedObjects[index]
        );
      }
    });
  }

  const parts = {};

  for (
    const [role, sourceIndex]
    of Object.entries(SOURCE_NODE_INDICES)
  ) {
    parts[role] =
      runtimeByIndex.get(sourceIndex) ?? null;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    !inspectedGLBScenes.has(gltf.scene)
  ) {
    inspectedGLBScenes.add(gltf.scene);

    console.groupCollapsed(
      "[Aural Forge] Earbuds GLB runtime node mapping"
    );

    console.table(
      Object.entries(
        SOURCE_NODE_INDICES
      ).map(([role, index]) => {
        const object =
          runtimeByIndex.get(index);

        return {
          role,
          gltfNodeIndex: index,
          sourceName:
            gltf.parser?.json?.nodes?.[index]
              ?.name ?? "(unnamed)",
          runtimeName:
            object?.name ?? "(not mapped)",
          runtimeType:
            object?.type ?? "(not mapped)",
          found: Boolean(object),
        };
      })
    );

    console.info(
      "Total runtime objects:",
      sourceObjects.length
    );

    console.info(
      "Mapped glTF nodes:",
      runtimeByIndex.size
    );

    if (
      Object.values(parts).some(
        (part) => !part
      )
    ) {
      console.warn(
        "Some mechanical parts are not mapped. " +
        "The complete model will still render. " +
        "Mechanical animation remains deferred."
      );
    }

    console.groupEnd();
  }

  return parts;
}

function createEarbudsRig(gltf) {
  // Keep Drei's cached source untouched.
  const scene = gltf.scene.clone(true);

  // Resolve runtime names and objects from
  // the real GLTFLoader association data.
  // No literal Blender mesh-name lookups.
  const parts = resolveRuntimeNodes(
    gltf,
    scene
  );

  const materialClones = new Map();
  const materialsByName = new Map();

  scene.traverse((object) => {
    if (!object.isMesh) return;

    function ownMaterial(material) {
      if (!materialClones.has(material)) {
        materialClones.set(
          material,
          material.clone()
        );
      }

      const owned =
        materialClones.get(material);

      if (owned.name) {
        materialsByName.set(
          owned.name,
          owned
        );
      }

      return owned;
    }

    object.material = Array.isArray(
      object.material
    )
      ? object.material.map(ownMaterial)
      : ownMaterial(object.material);
  });

  // Measure the actual imported geometry
  // rather than guessing the case dimensions.
  scene.updateMatrixWorld(true);

  const bounds = new Box3().setFromObject(
    scene
  );

  const center = new Vector3();
  const size = new Vector3();

  if (!bounds.isEmpty()) {
    bounds.getCenter(center);
    bounds.getSize(size);

    // Move the complete imported scene together.
    // This does not change the individual
    // lid, hinge, or earbud transforms.
    scene.position.sub(center);
    scene.updateMatrixWorld(true);
  } else {
    size.set(1, 1, 1);
  }

  return {
    scene,
    parts,
    modelSize: size,
    materialsByName,
    ownedMaterials: [
      ...materialClones.values(),
    ],
  };
}

function resolveVariantColor(
  family,
  variantId
) {
  const variant = getProductFamilyVariant(
    family.id,
    variantId
  );

  const signature = [
    variant?.id,
    variant?.name,
    variant?.label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    signature.includes("coral") ||
    signature.includes("solar")
  ) {
    return new Color("#E77861");
  }

  if (signature.includes("lime")) {
    return new Color("#C5D975");
  }

  if (signature.includes("blue")) {
    return new Color("#2554BD");
  }

  const accent = getProductFamilyWorld(
    family.id,
    variantId
  ).palette.accent;

  return new Color(
    accent ?? "#2554BD"
  );
}

function applyVariantMaterials({
  rig,
  family,
  variantId,
  invalidate,
}) {
  const accent = resolveVariantColor(
    family,
    variantId
  );

  const secondary = new Color(
    "#C3C9D4"
  ).lerp(accent, 0.16);

  const luminous = accent
    .clone()
    .lerp(
      new Color("#F4F7FF"),
      0.18
    );

  const targets = [
    {
      material:
        rig.materialsByName.get("black r"),
      property: "color",
      color: accent,
    },
    {
      material:
        rig.materialsByName.get("grey r"),
      property: "color",
      color: secondary,
    },
    {
      material:
        rig.materialsByName.get("emision"),
      property: "emissive",
      color: luminous,
    },
  ];

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reducedMotion) {
    targets.forEach(
      ({ material, property, color }) => {
        const target = material?.[property];

        if (target?.isColor) {
          target.copy(color);
        }
      }
    );

    invalidate();
    return null;
  }

  const timeline = gsap.timeline({
    onUpdate: invalidate,
  });

  targets.forEach(
    ({ material, property, color }) => {
      const target = material?.[property];

      if (!target?.isColor) return;

      timeline.to(
        target,
        {
          r: color.r,
          g: color.g,
          b: color.b,
          duration: 0.78,
          ease: "power2.inOut",
          overwrite: true,
        },
        0
      );
    }
  );

  return timeline;
}

function getCameraDistance(
  size,
  viewport
) {
  const aspect = Math.max(
    0.35,
    viewport.width /
      Math.max(1, viewport.height)
  );

  const tangent = Math.tan(
    (CAMERA.fov * Math.PI) / 360
  );

  const verticalDistance =
    size.y /
    (
      2 *
      tangent *
      CAMERA.verticalOccupancy
    );

  const horizontalDistance =
    size.x /
    (
      2 *
      tangent *
      aspect *
      CAMERA.horizontalOccupancy
    );

  return (
    Math.max(
      verticalDistance,
      horizontalDistance
    ) +
    size.z * 0.5 +
    0.65
  );
}

export default function EarbudsProductStage({
  family,
  variantId,
  productRootRef,
  choreographyActive = false,
  familyTransitionActive = false,
  onStageReady,
  onStageUnavailable,
  onStageMotionRegistration,
}) {
  const gltf = useGLTF(MODEL_URL);

  const camera = useThree(
    (state) => state.camera
  );

  const viewport = useThree(
    (state) => state.size
  );

  const invalidate = useThree(
    (state) => state.invalidate
  );

  const rig = useMemo(
    () => createEarbudsRig(gltf),
    [gltf]
  );

  const materialTimelineRef = useRef(null);
  const exitPoseRef = useRef(null);
  const enterPoseRef = useRef(null);

  // Keep the existing variant system working
  // on the actual cloned GLB materials.
  useEffect(() => {
    materialTimelineRef.current?.kill();

    const timeline = applyVariantMaterials({
      rig,
      family,
      variantId,
      invalidate,
    });

    materialTimelineRef.current = timeline;

    return () => {
      timeline?.kill();

      if (
        materialTimelineRef.current === timeline
      ) {
        materialTimelineRef.current = null;
      }
    };
  }, [
    rig,
    family,
    variantId,
    invalidate,
  ]);

  // Camera framing starts only after the
  // active family handoff releases ownership.
  useEffect(() => {
    if (
      familyTransitionActive ||
      !camera.isPerspectiveCamera
    ) {
      return;
    }

    const distance = getCameraDistance(
      rig.modelSize,
      viewport
    );

    function updateCamera() {
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      invalidate();
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      camera.position.set(
        0,
        0,
        distance
      );

      camera.fov = CAMERA.fov;

      updateCamera();
      return;
    }

    const timeline = gsap.timeline({
      onUpdate: updateCamera,
      onComplete: updateCamera,
    });

    timeline.to(
      camera.position,
      {
        x: 0,
        y: 0,
        z: distance,
        duration: CAMERA.duration,
        ease: "power2.inOut",
        overwrite: true,
      },
      0
    );

    timeline.to(
      camera,
      {
        fov: CAMERA.fov,
        duration: CAMERA.duration,
        ease: "power2.inOut",
        overwrite: true,
      },
      0
    );

    return () => timeline.kill();
  }, [
    camera,
    viewport.width,
    viewport.height,
    rig,
    familyTransitionActive,
    invalidate,
  ]);

  // Register the mounted product with the
  // existing family transition controller.
  useEffect(() => {
    const root = productRootRef.current;

    if (!root || !family?.id) {
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

        applyFamilyHandoff({
          root,
          baseline: exitPoseRef.current,
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
          enterPoseRef.current =
            captureTransform(root);
        }

        applyFamilyHandoff({
          root,
          baseline: enterPoseRef.current,
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
    invalidate();

    return () => {
      onStageMotionRegistration?.(
        family.id,
        null
      );

      onStageUnavailable?.(
        family.id
      );

      exitPoseRef.current = null;
      enterPoseRef.current = null;
    };
  }, [
    family?.id,
    productRootRef,
    invalidate,
    onStageReady,
    onStageUnavailable,
    onStageMotionRegistration,
  ]);

  // Only dispose material clones owned by
  // this stage. The GLB cache stays reusable.
  useEffect(() => {
    return () => {
      materialTimelineRef.current?.kill();

      rig.ownedMaterials.forEach(
        (material) => {
          material.dispose();
        }
      );
    };
  }, [rig]);

  return (
    <group
      ref={productRootRef}
      name="AuralForgeEarbudsCinematicRoot"
    >
      <ProductInspectionController
        enabled={
          !choreographyActive &&
          !familyTransitionActive
        }
        maxYaw={0.28}
        maxPitch={0.16}
      >
        {/* Entire verified GLB renders intact.
            No mechanical parts are reparented
            or animated in this mounting pass. */}
        <primitive
          object={rig.scene}
          dispose={null}
        />
      </ProductInspectionController>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
