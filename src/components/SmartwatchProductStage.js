"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Group, Vector3 } from "three";
import { measureMechanism, phase } from "@/lib/animateProductReveal";
import { useProductVariantMaterials } from "@/lib/useProductVariantMaterials";
import ProductStage from "./ProductStage";

function createWatchRig(source) {
  const model = source.clone(true);
  // The dial faces away from the export camera and the strap is off-origin.
  model.rotation.set(.12, -2.25, -.15);
  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model, true);
  model.position.sub(box.getCenter(new Vector3()));
  const modelScale = 2.4 / box.getSize(new Vector3()).y;
  const inspection = new Group();
  inspection.name = "WatchInspection";
  inspection.add(model);
  inspection.scale.setScalar(modelScale);
  const scene = new Group();
  scene.add(inspection);
  scene.updateMatrixWorld(true);
  const home = new Box3().setFromObject(scene, true);

  function sample(progress, display) {
    const profile = phase(progress, 0, .28);
    const dial = phase(progress, .26, .89);
    inspection.rotation.set(.06 * profile - .12 * dial, .13 * profile - .65 * dial,
      -.025 * profile + .12 * dial);
    inspection.scale.setScalar(modelScale * (1 - .09 * (1 - display) * (1 - dial)));
  }

  return {
    scene, sample, fitPortraitHero: true,
    bounds: { min: home.min.toArray(), max: home.max.toArray() },
    expandedBounds: measureMechanism(scene, sample),
    revealRotation: [-.035, -.25, .025],
    camera: ({ width, height }) => ({
      position: [0, 0, Math.max(6.4, 4.4 * height / width)], fov: 35,
    }),
  };
}

export default function SmartwatchProductStage(props) {
  const { family, variantId } = props;
  const { scene } = useGLTF(family.asset.url);
  const rig = useMemo(() => createWatchRig(scene), [scene]);
  const invalidate = useThree(state => state.invalidate);
  useProductVariantMaterials({ scene: rig.scene, familyId: family.id, variantId, invalidate });
  return <ProductStage {...props} rig={rig} />;
}
