"use client";

import { useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import OrderSummary from "@/components/OrderSummary";
import { getOrderSnapshot, parseOrder } from "@/lib/orderStore";
import styles from "../checkout/Checkout.module.css";

const subscribe = () => () => {};
const getServerSnapshot = () => undefined;

export default function Confirmation() {
  const number = useSearchParams().get("order");
  const snapshot = useSyncExternalStore(subscribe, () => getOrderSnapshot(number), getServerSnapshot);

  if (snapshot === undefined) return <p role="status">Loading order…</p>;

  const order = parseOrder(snapshot, number);
  return (
    <div className={`${styles.layout} ${styles.confirmation}`}>
      <div className={styles.receipt}>
        {order ? (
          <>
            <dl><dt>Order Number</dt><dd>{order.number}</dd></dl>
            <p>Your order was recorded in this browser. No payment was taken and no shipment was created.</p>
          </>
        ) : <p>We couldn’t find this order on this browser.</p>}
        <Link href="/#products" className="af-button">Continue Shopping</Link>
      </div>
      {order && <OrderSummary lines={order.lines} subtotal={order.subtotal} currency={order.currency} />}
    </div>
  );
}

