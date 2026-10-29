export const PRODUCT_MATERIAL_TARGETS = {
  body: {
    materialName: "Anodized Metal_WebPBR",
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
  {
    id: "studio-original",
    name: "Studio Original",
    description: "The original factory material finish.",
    swatch: "#42464D",
    price: 299,
    currency: "USD",
    ctaLabel: "Add to Bag",

    // Null means retain the imported GLB materials.
    materialColors: null,
  },

  {
    id: "glacier-silver",
    name: "Glacier Silver",
    description: "Cool metallic surfaces with refined silver detailing.",
    swatch: "#ACBBC8",
    price: 319,
    currency: "USD",
    ctaLabel: "Add to Bag",

    materialColors: {
      body: "#9CAEBF",
      hardware: "#D7E0E8",
    },
  },

  {
    id: "midnight-blue",
    name: "Midnight Blue",
    description: "Deep blue anodized metal with muted steel accents.",
    swatch: "#294668",
    price: 329,
    currency: "USD",
    ctaLabel: "Add to Bag",

    materialColors: {
      body: "#294668",
      hardware: "#859CB6",
    },
  },
];

export const DEFAULT_PRODUCT_VARIANT_ID =
  "studio-original";

export function getProductVariant(variantId) {
  return (
    PRODUCT_VARIANTS.find(
      (variant) => variant.id === variantId
    ) ?? PRODUCT_VARIANTS[0]
  );
}
