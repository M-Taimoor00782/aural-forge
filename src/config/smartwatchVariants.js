// Prototype pricing only. Every watch price surface identifies this as a demo value.
const DEMO_PRICE_USD = 199;

export const SMARTWATCH_MATERIAL_TARGETS = {
  strap: { materialName: "Material.002" },
  lining: { materialName: "Material.016" },
  case: { materialName: "Material.014" },
};

export const SMARTWATCH_VARIANTS = [
  { id: "black", name: "Black", finish: "black", swatch: "#292B30",
    description: "A graphite strap with a charcoal case.",
    materialColors: { strap: "#292B30", lining: "#25262A", case: "#36383D" } },
  { id: "white", name: "White", finish: "white", swatch: "#EEEDE8",
    description: "A soft white strap around a dark dial.",
    materialColors: { strap: "#EEEDE8", lining: "#C9C7C0", case: "#AAAAA6" } },
  { id: "red", name: "Red", finish: "red", swatch: "#AE3535",
    description: "A red strap with a dark case and dial.",
    materialColors: { strap: "#AE3535", lining: "#752F35", case: "#3E3638" } },
].map(variant => ({ ...variant, price: DEMO_PRICE_USD, currency: "USD", demoPrice: true }));
