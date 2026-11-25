import { SMARTWATCH_VARIANTS, SMARTWATCH_MATERIAL_TARGETS } from "@/config/smartwatchVariants";
﻿import {
  PRODUCT_VARIANTS,
  PRODUCT_MATERIAL_TARGETS,
  DEFAULT_PRODUCT_VARIANT_ID,
} from "@/config/productVariants";

import {
  EARBUDS_VARIANTS,
  DEFAULT_EARBUDS_VARIANT_ID,
} from "@/config/earbudsVariants";

/*
 * Aural Forge — Product Family Registry
 *
 * Shared source of truth for:
 * - Product family identity
 * - GLB asset paths and readiness
 * - Variant collections
 * - Product-specific worlds
 * - Story capabilities
 * - Family transition profiles
 *
 * Locked visual direction:
 * Deep Charcoal / Midnight foundation
 * Bright White / Slate Grey typography
 * Golden Sand / Terracotta accents
 *
 * Variant-specific worlds may introduce the
 * approved light / purple palette separately.
 */

export const DEFAULT_PRODUCT_FAMILY_ID =
  "headphones";

export const PRODUCT_FAMILIES = {
  headphones: {
    id: "headphones",
    label: "Over-ear Headphones",
    description: "Soft cushions meet sculpted earcups in a pair of headphones made for a closer listen.",
    number: "01",
    status: "ready",

    asset: {
      url: "/models/headphone/aural-forge-headphone.glb",
      preload: "immediate",
    },

    variants: PRODUCT_VARIANTS,
    defaultVariantId: DEFAULT_PRODUCT_VARIANT_ID,
    materialTargets: PRODUCT_MATERIAL_TARGETS,

    world: {
      id: "headphone-studio",
      environmentId: "studio-dark",
      backgroundSource: "fixed",

      palette: {
        background: "#0D0D0D",
        surface: "#1A1621",
        text: "#F3F3F4",
        secondaryText: "#7D868C",
        accent: "#F6B54E",
      },
    },

    story: {
      id: "headphone-journey",
      supportsAcousticReveal: true,
      supportsMaterialConfigurator: true,
    },

    transition: {
      profile: "cinematic-product-handoff",
    },
  },

  earbuds: {
    id: "earbuds",
    label: "Wireless Earbuds",
    description: "Two wireless earbuds, nestled in a sculpted charging case that fits in the palm of your hand.",
    number: "02",
    status: "ready",

    asset: {
      url: "/models/earbuds/aural-forge-earbuds.glb",
      preload: "on-demand",
    },

    variants: EARBUDS_VARIANTS,
    defaultVariantId: DEFAULT_EARBUDS_VARIANT_ID,
    materialTargets: {},

    world: {
      id: "earbuds-finish-world",
      environmentId: "earbuds-studio",

      /*
       * Cinematic atmosphere belongs to
       * the product family.
       *
       * Selecting a finish must not recolor
       * the entire cinematic experience.
       *
       * Individual product materials remain
       * controlled by the variant pipeline.
       */
      backgroundSource: "fixed",

      palette: {
        background: "#0D0D0D",
        surface: "#1A1621",
        text: "#F3F3F4",
        secondaryText: "#7D868C",
        accent: "#C3783A",
      },
    },

    story: {
      id: "earbuds-journey",
      supportsAcousticReveal: true,
      supportsMaterialConfigurator: true,
    },

    transition: {
      profile: "cinematic-product-handoff",
    },
  },

  "product-03": {
    id: "product-03",
    label: "Smartwatch",
    number: "03",
    status: "ready",
    gallerySlug: "smartwatch",
    description: "A dark dial with raised hour markers, slender hands, and a curved strap.",

    asset: {
      url: "/models/smartwatch/aural-forge-smartwatch.glb",
      preload: "on-demand",
    },

    variants: SMARTWATCH_VARIANTS,
    defaultVariantId: SMARTWATCH_VARIANTS[0].id,
    materialTargets: SMARTWATCH_MATERIAL_TARGETS,

    world: {
      id: "product-03-world",
      environmentId: "watch-studio",
      backgroundSource: "fixed",

      palette: {
        background: "#0D0D0D",
        surface: "#1A1621",
        text: "#F3F3F4",
        secondaryText: "#7D868C",
        accent: "#F6B54E",
      },
    },

    story: {
      id: "watch-journey",
      supportsAcousticReveal: false,
      supportsMaterialConfigurator: true,
    },

    transition: {
      profile: "cinematic-product-handoff",
    },
  },
};

export function getProductFamily(familyId) {
  return (
    PRODUCT_FAMILIES[familyId] ??
    PRODUCT_FAMILIES[
      DEFAULT_PRODUCT_FAMILY_ID
    ]
  );
}

export function getProductFamilyVariant(
  familyId,
  variantId
) {
  const family = getProductFamily(familyId);

  return (
    family.variants.find(
      (variant) =>
        variant.id === variantId
    ) ??
    family.variants.find(
      (variant) =>
        variant.id ===
        family.defaultVariantId
    ) ??
    null
  );
}

export function getProductFinishImage(familyId, variantId) {
  const family = getProductFamily(familyId);
  return `/images/finishes/${family.gallerySlug ?? family.id}-${variantId}.webp`;
}

export function getProductFamilyWorld(
  familyId,
  variantId
) {
  const family = getProductFamily(
    familyId
  );

  const variant = getProductFamilyVariant(
    familyId,
    variantId
  );

  /*
   * Fixed worlds always use the family palette.
   *
   * Variant worlds may override individual
   * properties while inheriting the remaining
   * family defaults.
   */
  const variantPalette =
    family.world.backgroundSource ===
    "variant"
      ? variant?.world?.palette ?? {}
      : {};

  return {
    id: family.world.id,

    environmentId:
      family.world.environmentId,

    palette: {
      ...family.world.palette,
      ...variantPalette,
    },
  };
}

export function getReadyProductFamilies() {
  return Object.values(
    PRODUCT_FAMILIES
  ).filter(
    (family) =>
      family.status === "ready" &&
      Boolean(family.asset.url)
  );
}

export function isProductFamilyReady(
  familyId
) {
  const family =
    PRODUCT_FAMILIES[familyId];

  return Boolean(
    family &&
    family.status === "ready" &&
    family.asset.url
  );
}


export function formatPrice(variant) {
  if (
    typeof variant?.price !== "number" ||
    !Number.isFinite(variant.price)
  ) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: variant.currency || "USD",
    maximumFractionDigits: 0,
  }).format(variant.price);
}
