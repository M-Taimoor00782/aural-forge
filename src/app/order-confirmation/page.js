import { Suspense } from "react";
import PremiumHeader from "@/components/PremiumHeader";
import ExperienceCursor from "@/components/ExperienceCursor";
import Confirmation from "./Confirmation";
import styles from "../checkout/Checkout.module.css";

export const metadata = { title: "Order Confirmation | Aural Forge" };

export default function Page() {
  return (
    <>
      <PremiumHeader />
      <main className={`af-container ${styles.main}`} aria-labelledby="confirmation-heading">
        <h1 id="confirmation-heading">Order Confirmation</h1>
        <Suspense fallback={<p role="status">Loading order…</p>}>
          <Confirmation />
        </Suspense>
      </main>
      <ExperienceCursor />
    </>
  );
}

