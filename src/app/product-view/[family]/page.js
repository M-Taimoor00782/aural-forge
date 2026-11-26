import ExperienceRuntime from "@/components/ExperienceRuntime";
import { DEFAULT_PRODUCT_FAMILY_ID, getReadyProductFamilies } from "@/config/productFamilies";

export const dynamicParams = false;

export function generateStaticParams() {
  return getReadyProductFamilies()
    .filter(({ id }) => id !== DEFAULT_PRODUCT_FAMILY_ID)
    .map(({ id }) => ({ family: id }));
}

export default async function ProductView({ params }) {
  const { family } = await params;
  return <ExperienceRuntime initialFamilyId={family} />;
}
