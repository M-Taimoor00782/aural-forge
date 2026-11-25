"use client";

import { adjustCartQuantity, MAX_CART_QUANTITY } from "@/lib/cartStore";
import styles from "./CartQuantity.module.css";

export default function CartQuantity({ line }) {
  const item = line.familyName + ", " + line.finish;
  return (
    <div className={styles.stepper} role="group" aria-label={"Quantity for " + item}>
      <button type="button" aria-label={"Decrease quantity for " + item} disabled={line.quantity <= 1}
        onClick={() => adjustCartQuantity(line.key, -1)}>−</button>
      <output aria-label={"Quantity for " + item}>{line.quantity}</output>
      <button type="button" aria-label={"Increase quantity for " + item} disabled={line.quantity >= MAX_CART_QUANTITY}
        onClick={() => adjustCartQuantity(line.key, 1)}>+</button>
    </div>
  );
}

