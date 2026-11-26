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
  const reviewedCart = useRef(null);
  const dialogRef = useRef(null);
  const proceedRef = useRef(null);
  const headingRef = useRef(null);
  const backRef = useRef(null);
  const completeRef = useRef(null);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  function submit(event) {
    event.preventDefault();
    const dialog = dialogRef.current;
    if (!ready || !lines.length || submitLock.current || dialog.open) return;
    const form = event.currentTarget;
    for (const control of form.elements) {
      if (control.required && !control.value.trim()) control.setCustomValidity("Please fill in this field.");
    }
    if (!form.reportValidity()) return;

    reviewedCart.current = lines;
    setError("");
    dialog.showModal();
    backRef.current.focus();
  }

  function closeDialog() {
    dialogRef.current.close();
    reviewedCart.current = null;
    (proceedRef.current ?? headingRef.current).focus();
  }

  function keepDialogFocus(event) {
    if (event.key !== "Tab") return;
    const from = event.shiftKey ? backRef.current : completeRef.current;
    if (event.target !== from) return;
    event.preventDefault();
    const to = event.shiftKey ? completeRef.current : backRef.current;
    to.focus();
  }

  function completeOrder() {
    if (!dialogRef.current.open || submitLock.current) return;
    if (!lines.length || lines !== reviewedCart.current) {
      setError("Your cart changed. Go back to checkout to review your order summary.");
      return;
    }

    submitLock.current = true;
    let number;
    try {
      number = placeOrder(lines);
    } catch {
      submitLock.current = false;
      setError("Your order could not be saved in this browser. Check that browser storage is available and try again.");
      return;
    }

    dialogRef.current.close();
    setPlacing(true);
    router.replace(`/order-confirmation?order=${number}`);
  }

  return (
    <>
      <PremiumHeader />
      <main className={`af-container ${styles.main}`} aria-labelledby="checkout-heading">
        <Link href="/cart" className={styles.back}>Back to Cart</Link>
        <h1 id="checkout-heading" ref={headingRef} tabIndex={-1}>Checkout</h1>
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
                  <button className={`af-button ${styles.place}`} type="submit" ref={proceedRef}
                    aria-haspopup="dialog">Proceed to Payment</button>
                </div>
              </OrderSummary>
            </form>
          )}
      </main>
      <dialog ref={dialogRef} className={styles.paymentDialog} aria-modal="true"
        aria-labelledby="payment-dialog-title" aria-describedby="payment-dialog-disclosure"
        onCancel={event => { event.preventDefault(); closeDialog(); }} onKeyDown={keepDialogFocus}>
        <h2 id="payment-dialog-title">Confirm your order</h2>
        <p id="payment-dialog-disclosure">This is a demonstration checkout. No payment will be collected, and no physical order will be shipped.</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.dialogActions}>
          <button type="button" ref={backRef} className="af-button af-button--outline"
            onClick={closeDialog}>Back to Checkout</button>
          <button type="button" ref={completeRef} className="af-button"
            onClick={completeOrder}>Complete Preview Order</button>
        </div>
      </dialog>
      <ExperienceCursor />
    </>
  );
}

