"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import CartQuantity from "@/components/CartQuantity";
import ExperienceCursor from "@/components/ExperienceCursor";
import PremiumHeader from "@/components/PremiumHeader";
import { formatPrice, getProductFinishImage } from "@/config/productFamilies";
import { getCartTotals, removeCartItem, useCart } from "@/lib/cartStore";
import styles from "./CartPage.module.css";

export default function CartPage() {
  const { lines, ready } = useCart();
  const { count, subtotal, currency } = getCartTotals(lines);
  const heading = useRef(null);

  function remove(event, key) {
    const row = event.currentTarget.closest("li");
    const nextRow = row.nextElementSibling ?? row.previousElementSibling;
    const target = nextRow?.querySelector("[data-cart-remove]") ?? heading.current;
    target.focus({ preventScroll: true });
    removeCartItem(key);
  }

  return (
    <>
      <PremiumHeader />
      <main className={`af-container ${styles.cart}`} aria-labelledby="cart-page-heading">
        <div className={styles.intro}>
          <Link href="/#products" className={styles.back}>Continue Shopping</Link>
          <h1 id="cart-page-heading" ref={heading} tabIndex={-1}>Your cart.</h1>
          {ready && count > 0 && <p>{count} {count === 1 ? "item" : "items"}</p>}
        </div>
        {!ready ? (
          <p role="status" className={styles.loading}>Loading cart…</p>
        ) : lines.length === 0 ? (
          <section className={styles.empty} aria-labelledby="empty-cart-heading">
            <h2 id="empty-cart-heading">Your cart is empty.</h2>
            <p>Explore the collection and find a finish to make your own.</p>
            <Link href="/#products" className="af-button">Continue Shopping</Link>
          </section>
        ) : (
          <div className={styles.layout}>
            <ul aria-label="Cart items" className={styles.lines}>
              {lines.map(line => (
                <li key={line.key} className={styles.line}>
                  <Image src={getProductFinishImage(line.familyId, line.variantId)}
                    alt="" width={128} height={128} unoptimized className={styles.image} />
                  <div className={styles.lineDetails}>
                    <h2>{line.familyName}</h2>
                    <p className={styles.finish}>{line.finish}</p>
                    <p>{formatPrice(line)} each</p>
                  </div>
                  <strong className={styles.lineTotal}>
                    {formatPrice({ price: line.price * line.quantity, currency: line.currency })}
                  </strong>
                  <div className={styles.actions}>
                    <CartQuantity line={line} />
                    <button type="button" className={styles.remove} data-cart-remove
                      aria-label={`Remove ${line.familyName}, ${line.finish}`}
                      onClick={event => remove(event, line.key)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <aside className={styles.summary} aria-labelledby="cart-summary-heading">
              <h2 id="cart-summary-heading">Order Summary</h2>
              <p className={styles.subtotal} aria-live="polite">
                <span>Subtotal</span>
                <strong>{formatPrice({ price: subtotal, currency })} <small>{currency}</small></strong>
              </p>
              <Link href="/checkout" className={`af-button ${styles.checkout}`}>Checkout</Link>
            </aside>
          </div>
        )}
      </main>
      <ExperienceCursor />
    </>
  );
}

