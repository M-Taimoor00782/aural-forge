"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Color, Vector3 } from "three";
import gsap from "gsap";
import { EARBUDS_MATERIAL_TARGETS } from "@/config/earbudsVariants";

import ProductStage from "./ProductStage";
import { earbudsMechanism, measureMechanism } from "@/lib/animateProductReveal";

import { getProductFamilyVariant } from "@/config/productFamilies";

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
        "Earbud GLB node mapping is incomplete."
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

  const sample = earbudsMechanism(parts);
  const centered = new Box3().setFromObject(scene);
  return {
    scene, sample,
    bounds: { min: centered.min.toArray(), max: centered.max.toArray() },
    expandedBounds: measureMechanism(scene, sample),
    camera: viewport => ({ position: [0, 0, getCameraDistance(size, viewport)], fov: CAMERA.fov }),
    materialsByName,
    ownedMaterials: [
      ...materialClones.values(),
    ],
  };
}

function applyVariantMaterials({
  rig,
  family,
  variantId,
  invalidate,
}) {
  const variant = getProductFamilyVariant(family.id, variantId);
  const targets = Object.entries(EARBUDS_MATERIAL_TARGETS).map(([key, mapping]) => ({
    material: rig.materialsByName.get(mapping.materialName),
    property: mapping.colorProperty,
    color: new Color(variant.materialColors[key]),
  }));

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

export default function EarbudsProductStage(props) {
  const { family, variantId } = props;
  const gltf = useGLTF(MODEL_URL);
  const invalidate = useThree(state => state.invalidate);
  const rig = useMemo(() => createEarbudsRig(gltf), [gltf]);
  const materialTimelineRef = useRef(null);

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

  return <ProductStage {...props} rig={rig} />;
}

useGLTF.preload(MODEL_URL);
