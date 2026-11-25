import PolicyPage from "@/components/PolicyPage";
import { POLICIES } from "@/config/policies";

const policy = POLICIES.find(item => item.slug === "refund-policy");

export const metadata = { title: "Refund Policy | Aural Forge", description: policy.intro };

export default function Page() {
  return <PolicyPage policy={policy} />;
}

