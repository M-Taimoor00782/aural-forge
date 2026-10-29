"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Color } from "three";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyVariant,
} from "@/config/productFamilies";

export function useProductVariantMaterials({
  scene = null,
  productRootRef = null,
  familyId = DEFAULT_PRODUCT_FAMILY_ID,
  variantId,
  invalidate,
}) {
  const materialsRef = useRef([]);

  useLayoutEffect(() => {
    // Always prefer the actual mounted product.
    // Never modify the shared GLB source when a
    // product root has been explicitly provided.
    const root = productRootRef
      ? productRootRef.current
      : scene;

    if (!root) {
      return;
    }

    const family = getProductFamily(familyId);

    const targets = Object.entries(
      family.materialTargets ?? {}
    );

    const originalAssignments = [];
    const configurableMaterials = [];

    // Reuse one cloned material when multiple meshes
    // reference the same original material.
    const materialCloneCache = new Map();

    root.traverse((object) => {
      if (!object.isMesh || !object.material) {
        return;
      }

      const originalMaterial = object.material;

      const materialArray = Array.isArray(
        originalMaterial
      )
        ? originalMaterial
        : [originalMaterial];

      let modified = false;

      const assignedMaterials = materialArray.map(
        (material) => {
          const target = targets.find(
            ([, configuration]) =>
              configuration.materialName ===
              material.name
          );

          if (!target) {
            return material;
          }

          const cached = materialCloneCache.get(
            material
          );

          if (cached) {
            modified = true;
            return cached;
          }

          const [targetKey, configuration] =
            target;

          const requestedProperty =
            configuration.colorProperty ===
            "emissive"
              ? "emissive"
              : "color";

          // Some GLB material types do not expose
          // an emissive channel. Fall back safely
          // to base color where available.
          const colorProperty =
            material[requestedProperty]?.isColor
              ? requestedProperty
              : material.color?.isColor
                ? "color"
                : null;

          if (!colorProperty) {
            return material;
          }

          const clonedMaterial = material.clone();

          materialCloneCache.set(
            material,
            clonedMaterial
          );

          configurableMaterials.push({
            material: clonedMaterial,
            targetKey,
            colorProperty,
            originalColor:
              material[colorProperty].clone(),
          });

          modified = true;

          return clonedMaterial;
        }
      );

      if (!modified) {
        return;
      }

      originalAssignments.push({
        mesh: object,
        originalMaterial,
      });

      object.material = Array.isArray(
        originalMaterial
      )
        ? assignedMaterials
        : assignedMaterials[0];
    });

    materialsRef.current = configurableMaterials;

    invalidate();

    return () => {
      configurableMaterials.forEach(
        ({ material, colorProperty }) => {
          gsap.killTweensOf(
            material[colorProperty]
          );
        }
      );

      originalAssignments.forEach(
        ({ mesh, originalMaterial }) => {
          mesh.material = originalMaterial;
        }
      );

      configurableMaterials.forEach(
        ({ material }) => {
          material.dispose();
        }
      );

      materialsRef.current = [];

      invalidate();
    };
  }, [
    scene,
    productRootRef,
    familyId,
    invalidate,
  ]);

  useEffect(() => {
    const variant = getProductFamilyVariant(
      familyId,
      variantId
    );

    if (!variant) {
      return;
    }

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    const duration = reducedMotion
      ? 0
      : 0.65;

    const activeTweens = [];

    materialsRef.current.forEach(
      ({
        material,
        targetKey,
        colorProperty,
        originalColor,
      }) => {
        const selectedColor =
          variant.materialColors?.[targetKey];

        const targetColor = selectedColor
          ? new Color(selectedColor)
          : originalColor;

        const materialColor =
          material[colorProperty];

        gsap.killTweensOf(materialColor);

        if (duration === 0) {
          materialColor.copy(targetColor);
          invalidate();
          return;
        }

        const tween = gsap.to(
          materialColor,
          {
            r: targetColor.r,
            g: targetColor.g,
            b: targetColor.b,
            duration,
            ease: "power2.inOut",
            onUpdate: invalidate,
            onComplete: invalidate,
          }
        );

        activeTweens.push(tween);
      }
    );

    return () => {
      activeTweens.forEach(
        (tween) => tween.kill()
      );
    };
  }, [
    familyId,
    variantId,
    invalidate,
  ]);
}
