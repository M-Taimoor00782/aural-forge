"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamilyWorld,
} from "@/config/productFamilies";

const WORLD_CSS_VARIABLES = {
  background: "--af-world-background",
  surface: "--af-world-surface",
  text: "--af-world-text",
  secondaryText: "--af-world-secondary-text",
  accent: "--af-world-accent",
};

const TRANSITION_DURATION = 1.1;

export default function ProductWorldBackdrop({
  familyId = DEFAULT_PRODUCT_FAMILY_ID,
  variantId,
}) {
  const initializedRef = useRef(false);

  // Preserve any existing global theme values so this
  // component does not leave stale styles after unmounting.
  useEffect(() => {
    const root = document.documentElement;

    const previousValues = Object.values(
      WORLD_CSS_VARIABLES
    ).map((property) => ({
      property,
      value: root.style.getPropertyValue(property),
    }));

    const previousWorld = root.getAttribute(
      "data-af-world"
    );

    return () => {
      gsap.killTweensOf(
        root,
        Object.values(WORLD_CSS_VARIABLES).join(",")
      );

      previousValues.forEach(({ property, value }) => {
        if (value) {
          root.style.setProperty(property, value);
        } else {
          root.style.removeProperty(property);
        }
      });

      if (previousWorld === null) {
        root.removeAttribute("data-af-world");
      } else {
        root.setAttribute(
          "data-af-world",
          previousWorld
        );
      }

      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const world = getProductFamilyWorld(
      familyId,
      variantId
    );

    const cssValues = Object.fromEntries(
      Object.entries(WORLD_CSS_VARIABLES).map(
        ([paletteKey, cssProperty]) => [
          cssProperty,
          world.palette[paletteKey],
        ]
      )
    );

    root.setAttribute("data-af-world", world.id);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // The initial render should match the selected
    // product world immediately, without an intro flash.
    if (!initializedRef.current || reducedMotion) {
      gsap.set(root, cssValues);
      initializedRef.current = true;
      return;
    }

    // A new family or finish transitions the entire
    // palette through the existing GSAP motion system.
    const transition = gsap.to(root, {
      ...cssValues,
      duration: TRANSITION_DURATION,
      ease: "power2.inOut",
      overwrite: "auto",
    });

    return () => {
      transition.kill();
    };
  }, [familyId, variantId]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundColor:
          "var(--af-world-background, #0B0B0C)",
      }}
    />
  );
}
