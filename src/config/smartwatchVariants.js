import { SIGNATURE_RED, ICE_SILVER, BURNISHED_COPPER } from "./productFinishes.js";

// Catalog pricing for the portfolio checkout.
const DEMO_PRICE_USD = 199;

export const SMARTWATCH_MATERIAL_TARGETS = {
  strap: { materialName: "Material.002", surface: { metalness: 0.55, roughness: 0.38 } },
  lining: { materialName: "Material.016" },
  case: { materialName: "Material.014", surface: { metalness: 0.76, roughness: 0.30 } },
};

export const SMARTWATCH_VARIANTS = [
  { ...SIGNATURE_RED, description: "A satin red strap and deep red case around a dark dial.",
    materialColors: { strap: SIGNATURE_RED.swatch, lining: "#582C38", case: "#92303E" } },
  { ...ICE_SILVER, description: "A cool silver case and strap frame the dark dial.",
    materialColors: { strap: ICE_SILVER.swatch, lining: "#7B8993", case: "#B0C2D0" } },
  { ...BURNISHED_COPPER, description: "A warm copper strap with a burnished case.",
    materialColors: { strap: BURNISHED_COPPER.swatch, lining: "#654C41", case: "#9E674B" } },
].map(variant => ({ ...variant, price: DEMO_PRICE_USD, currency: "USD", demoPrice: true }));
