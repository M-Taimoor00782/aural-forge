"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PremiumHeader from "@/components/PremiumHeader";
import ExperienceCursor from "@/components/ExperienceCursor";
import OrderSummary from "@/components/OrderSummary";
import { getCartTotals, useCart } from "@/lib/cartStore";
import { placeOrder } from "@/lib/orderStore";
import styles from "./Checkout.module.css";

const CONTACT_FIELDS = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email address", autoComplete: "email", type: "email" },
  { name: "phone", label: "Phone number", autoComplete: "tel", type: "tel", optional: true },
];

const SHIPPING_FIELDS = [
  { name: "address", label: "Street address", autoComplete: "shipping address-line1", wide: true },
  { name: "unit", label: "Apartment or suite", autoComplete: "shipping address-line2", optional: true, wide: true },
  { name: "city", label: "City", autoComplete: "shipping address-level2" },
  { name: "region", label: "State or region", autoComplete: "shipping address-level1", optional: true },
  { name: "postalCode", label: "Postal code", autoComplete: "shipping postal-code" },
  { name: "country", label: "Country or territory", autoComplete: "shipping country-name" },
];

function Fields({ title, fields }) {
  return (
    <fieldset className={styles.fields}>
      <legend>{title}</legend>
      <div className={styles.fieldGrid}>
        {fields.map(({ name, label, type = "text", autoComplete, optional, wide }) => (
          <label key={name} className={wide ? styles.wide : undefined}>
            {label}{optional && <small> (optional)</small>}
            <input name={name} type={type} autoComplete={autoComplete} required={!optional} maxLength={254}
              onInput={event => event.currentTarget.setCustomValidity("")} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Checkout() {
  const { lines, ready } = useCart();
  const router = useRouter();
  const submitLock = useRef(false);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (submitLock.current) return;
    const form = event.currentTarget;
    for (const control of form.elements) {
      if (control.required && !control.value.trim()) control.setCustomValidity("Please fill in this field.");
    }
    if (!form.reportValidity()) return;

    submitLock.current = true;
    setError("");
    setPlacing(true);
    let number;
    try {
      number = placeOrder(lines);
    } catch {
      submitLock.current = false;
      setPlacing(false);
      setError("Your order could not be saved in this browser. Check that browser storage is available and try again.");
      return;
    }

    router.replace(`/order-confirmation?order=${number}`);
  }

  return (
    <>
      <PremiumHeader />
      <main className={`af-container ${styles.main}`} aria-labelledby="checkout-heading">
        <Link href="/cart" className={styles.back}>Back to Cart</Link>
        <h1 id="checkout-heading">Checkout</h1>
        {!ready || placing ? <p role="status">{placing ? "Saving your order…" : "Loading cart…"}</p>
          : lines.length === 0 ? (
            <div className={styles.empty}><p>Your cart is empty.</p>
              <Link href="/#products" className="af-button">Continue Shopping</Link></div>
          ) : (
            <form method="post" className={styles.layout} onSubmit={submit}>
              <div className={styles.formSections}>
                <Fields title="Contact Information" fields={CONTACT_FIELDS} />
                <Fields title="Shipping Information" fields={SHIPPING_FIELDS} />
              </div>
              <OrderSummary lines={lines} {...getCartTotals(lines)}>
                <div className={styles.submit}>
                  <p id="checkout-disclosure">This checkout is a portfolio preview. No payment will be collected and no physical order will be fulfilled.</p>
                  <button className={`af-button ${styles.place}`} type="submit"
                    aria-describedby="checkout-disclosure">Place Order</button>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                </div>
              </OrderSummary>
            </form>
          )}
      </main>
      <ExperienceCursor />
    </>
  );
}

