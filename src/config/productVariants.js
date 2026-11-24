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
    name: "Original Red / Black", finish: "red",
    description: "Red anodized metal with black cushioned ear pads.",
    swatch: "#B53928",
    price: 299,
    currency: "USD",
    ctaLabel: "Add to Bag",

    // Null means retain the imported GLB materials.
    materialColors: null,
  },

  {
    id: "white",
    name: "White", finish: "white",
    description: "White earcups with contrasting dark cushions.",
    swatch: "#EDEEE9",
    price: 319,
    currency: "USD",
    ctaLabel: "Add to Bag",

    materialColors: {
      body: "#F2F1EB",
      hardware: "#D7D8D4",
    },
  },

  {
    id: "clean-blue",
    name: "Clean Blue", finish: "blue",
    description: "Blue anodized metal with cool steel detailing.",
    swatch: "#3363B7",
    price: 329,
    currency: "USD",
    ctaLabel: "Add to Bag",

    materialColors: {
      body: "#3363B7",
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
