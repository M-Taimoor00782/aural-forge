import {
  PRODUCT_VARIANTS,
  PRODUCT_MATERIAL_TARGETS,
  DEFAULT_PRODUCT_VARIANT_ID,
} from "@/config/productVariants";
import {
  EARBUDS_VARIANTS,
  DEFAULT_EARBUDS_VARIANT_ID,
} from "@/config/earbudsVariants";

export const DEFAULT_PRODUCT_FAMILY_ID = "headphones";

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
        background: "#0B0B0C",
        surface: "#151517",
        text: "#F4F4F2",
        secondaryText: "#9A9AA0",
        accent: "#6EA8FF",
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
    status: "planned",

    // Set the real GLB URL when the asset is ready.
    asset: {
      url: null,
      preload: "on-demand",
    },

    // Populated from a dedicated Earbuds variant config
    // once its actual materials and finishes are defined.
    variants: EARBUDS_VARIANTS,
    defaultVariantId: DEFAULT_EARBUDS_VARIANT_ID,
    materialTargets: {},

    world: {
      id: "earbuds-finish-world",
      environmentId: "earbuds-studio",

      // Each Earbuds variant will provide a curated
      // world.palette override, including background.
      backgroundSource: "variant",

      // Temporary fallback, not the approved final world.
      palette: {
        background: "#0B0B0C",
        surface: "#151517",
        text: "#F4F4F2",
        secondaryText: "#9A9AA0",
        accent: "#6EA8FF",
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
        background: "#0B0B0C",
        surface: "#151517",
        text: "#F4F4F2",
        secondaryText: "#9A9AA0",
        accent: "#6EA8FF",
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
    PRODUCT_FAMILIES[DEFAULT_PRODUCT_FAMILY_ID]
  );
}

export function getProductFamilyVariant(
  familyId,
  variantId
) {
  const family = getProductFamily(familyId);

  return (
    family.variants.find(
      (variant) => variant.id === variantId
    ) ??
    family.variants.find(
      (variant) =>
        variant.id === family.defaultVariantId
    ) ??
    null
  );
}

export function getProductFamilyWorld(
  familyId,
  variantId
) {
  const family = getProductFamily(familyId);
  const variant = getProductFamilyVariant(
    familyId,
    variantId
  );

  const variantPalette =
    family.world.backgroundSource === "variant"
      ? variant?.world?.palette ?? {}
      : {};

  return {
    id: family.world.id,
    environmentId: family.world.environmentId,
    palette: {
      ...family.world.palette,
      ...variantPalette,
    },
  };
}

export function getReadyProductFamilies() {
  return Object.values(PRODUCT_FAMILIES).filter(
    (family) =>
      family.status === "ready" &&
      Boolean(family.asset.url)
  );
}

export function isProductFamilyReady(familyId) {
  const family = PRODUCT_FAMILIES[familyId];

  return Boolean(
    family &&
    family.status === "ready" &&
    family.asset.url
  );
}
