import { SIGNATURE_RED, ICE_SILVER, BURNISHED_COPPER } from "./productFinishes.js";

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
  SIGNATURE_RED.id;

export const EARBUDS_MATERIAL_TARGETS = {
  body: {
    materialName: "black r",
    surface: { metalness: 0.68, roughness: 0.32 },
    colorProperty: "color",
  },

  accent: {
    materialName: "emision",
    colorProperty: "emissive",
  },

  secondary: {
    materialName: "grey r",
    surface: { metalness: 0.49, roughness: 0.40 },
    colorProperty: "color",
  },
};

// "black d" is deliberately excluded.
// It retains its original dark appearance.

export const EARBUDS_VARIANTS = [
  { ...SIGNATURE_RED, description: "Red metallic shells with a deep burgundy case interior.",
    materialColors: { body: SIGNATURE_RED.swatch, secondary: "#704452", accent: "#F4C6CD" } },
  { ...ICE_SILVER, description: "Cool silver shells with a slate-blue interior.",
    materialColors: { body: ICE_SILVER.swatch, secondary: "#7B909F", accent: "#E0EFF8" } },
  { ...BURNISHED_COPPER, description: "Burnished copper shells with a deep bronze interior.",
    materialColors: { body: BURNISHED_COPPER.swatch, secondary: "#795C50", accent: "#F1D3B9" } },
].map(variant => ({ ...variant, price: 189, currency: "USD" }));

export function getEarbudsVariant(variantId) {
  return EARBUDS_VARIANTS.find(variant => variant.id === variantId) ?? EARBUDS_VARIANTS[0];
}
