import PolicyPage from "@/components/PolicyPage";
import { POLICIES } from "@/config/policies";

const policy = POLICIES.find(item => item.slug === "privacy-policy");

export const metadata = { title: "Privacy Policy | Aural Forge", description: policy.intro };

export default function Page() {
  return <PolicyPage policy={policy} />;
}

