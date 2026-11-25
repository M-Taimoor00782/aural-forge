import PolicyPage from "@/components/PolicyPage";
import { POLICIES } from "@/config/policies";

const policy = POLICIES.find(item => item.slug === "terms-of-service");

export const metadata = { title: "Terms of Service | Aural Forge", description: policy.intro };

export default function Page() {
  return <PolicyPage policy={policy} />;
}

