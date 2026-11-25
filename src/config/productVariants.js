import { SIGNATURE_RED, ICE_SILVER, BURNISHED_COPPER } from "./productFinishes.js";

export const PRODUCT_MATERIAL_TARGETS = {
  body: {
    materialName: "Anodized Metal_WebPBR",
    surface: { metalness: 0.84, roughness: 0.32 },
    sourceMeshNames: [
      "Cylinder.003",
      "Cylinder.007",
    ],
  },

  hardware: {
    materialName: "Stainless Steel_WebPBR",
    sourceMeshNames: [
      "Cylinder.005",
      "Cylinder.006",
    ],
  },
};

export const PRODUCT_VARIANTS = [
  { ...SIGNATURE_RED, price: 299, description: "Deep red metal with black cushioned ear pads.",
    materialColors: { body: SIGNATURE_RED.swatch, hardware: "#786D76" } },
  { ...ICE_SILVER, price: 319, description: "Cool silver metal with contrasting dark cushions.",
    materialColors: { body: ICE_SILVER.swatch, hardware: "#8F9FAE" } },
  { ...BURNISHED_COPPER, price: 329, description: "Warm copper earcups with darker bronze hardware.",
    materialColors: { body: BURNISHED_COPPER.swatch, hardware: "#846958" } },
].map(variant => ({ ...variant, currency: "USD" }));

export const DEFAULT_PRODUCT_VARIANT_ID = SIGNATURE_RED.id;

export function getProductVariant(variantId) {
  return (
    PRODUCT_VARIANTS.find(
      (variant) => variant.id === variantId
    ) ?? PRODUCT_VARIANTS[0]
  );
}
