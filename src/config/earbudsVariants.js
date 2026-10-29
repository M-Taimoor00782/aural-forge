/**
 * Product 02 — Wireless Earbuds
 *
 * Real GLB:
 * /models/earbuds/aural-forge-earbuds.glb
 *
 * Variant finishes reuse the same model.
 * Only mapped materials change.
 */

export const DEFAULT_EARBUDS_VARIANT_ID =
  "electric-blue";

export const EARBUDS_MATERIAL_TARGETS = {
  body: {
    materialName: "black r",
    colorProperty: "color",
  },

  accent: {
    materialName: "emision",
    colorProperty: "emissive",
  },

  secondary: {
    materialName: "grey r",
    colorProperty: "color",
  },
};

// "black d" is deliberately excluded.
// It retains its original dark appearance.

export const EARBUDS_VARIANTS = [
  {
    id: "electric-blue",
    name: "Electric Blue",
    description:
      "A vivid blue finish with a bold, immersive product world.",
    swatch: "#557FFF",

    price: 189,
    currency: "USD",
    ctaLabel: "Add to Bag",

    materialColors: {
      body: "#557FFF",
      accent: "#BED7FF",
      secondary: "#91AACF",
    },

    world: {
      palette: {
        background: "#2554BD",
        surface: "#1B429A",
        text: "#FFFFFF",
        secondaryText: "#D5E2FF",
        accent: "#C1D6FF",
      },
    },
  },

  {
    id: "solar-coral",
    name: "Solar Coral",
    description:
      "A warm coral finish with an expressive, luminous atmosphere.",
    swatch: "#F3A08F",

    price: 189,
    currency: "USD",
    ctaLabel: "Add to Bag",

    materialColors: {
      body: "#F3A08F",
      accent: "#FFE1CE",
      secondary: "#E8C3BA",
    },

    world: {
      palette: {
        background: "#E77861",
        surface: "#F19A86",
        text: "#231818",
        secondaryText: "#50312D",
        accent: "#49211E",
      },
    },
  },

  {
    id: "soft-lime",
    name: "Soft Lime",
    description:
      "A fresh, understated finish with a distinctive light-toned world.",
    swatch: "#E3EBC2",

    price: 189,
    currency: "USD",
    ctaLabel: "Add to Bag",

    materialColors: {
      body: "#E3EBC2",
      accent: "#F5FFD0",
      secondary: "#C5D29F",
    },

    world: {
      palette: {
        background: "#C5D975",
        surface: "#D9E6A2",
        text: "#202617",
        secondaryText: "#424B2A",
        accent: "#304725",
      },
    },
  },
];

export function getEarbudsVariant(variantId) {
  return (
    EARBUDS_VARIANTS.find(
      (variant) => variant.id === variantId
    ) ?? EARBUDS_VARIANTS[0]
  );
}
