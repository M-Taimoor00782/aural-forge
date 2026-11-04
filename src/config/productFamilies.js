import {
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
      supportsAcousticReveal: false,
      supportsMaterialConfigurator: true,
    },

    transition: {
      profile: "cinematic-product-handoff",
    },
  },

  /*
   * Third product family is reserved.
   *
   * Do not activate Smartwatch until its
   * real GLB, variant configuration, and
   * product experience are implemented.
   */
  "product-03": {
    id: "product-03",
    label: "Product 03",
    number: "03",
    status: "reserved",

    asset: {
      url: null,
      preload: "on-demand",
    },

    variants: [],
    defaultVariantId: null,
    materialTargets: {},

    world: {
      id: "product-03-world",
      environmentId: null,
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
      id: null,
      supportsAcousticReveal: false,
      supportsMaterialConfigurator: false,
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

