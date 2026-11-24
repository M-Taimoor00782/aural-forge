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
  "clean-blue";

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
    id: "clean-blue", name: "Clean Blue", finish: "blue", swatch: "#3363B7",
    description: "Cool blue shells with a pale indicator.", price: 189, currency: "USD",
    materialColors: { body: "#3363B7", secondary: "#B5C1D2", accent: "#BFD6F5" },
  },
  {
    id: "black", name: "Black", finish: "black", swatch: "#25272D",
    description: "Graphite shells with a dark interior.", price: 189, currency: "USD",
    materialColors: { body: "#27292F", secondary: "#595D65", accent: "#CBD0D5" },
  },
  {
    id: "white", name: "White", finish: "white", swatch: "#EDEEE9",
    description: "Soft white shells with contrasting dark tips.", price: 189, currency: "USD",
    materialColors: { body: "#EFEFEA", secondary: "#CBCDCB", accent: "#F6F6F1" },
  },
];

export function getEarbudsVariant(variantId) {
  return EARBUDS_VARIANTS.find(variant => variant.id === variantId) ?? EARBUDS_VARIANTS[0];
}
