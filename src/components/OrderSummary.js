import Image from "next/image";
import { formatPrice, getProductFinishImage } from "@/config/productFamilies";
import styles from "./OrderSummary.module.css";

export default function OrderSummary({ lines, subtotal, currency, children }) {
  return (
    <aside className={styles.summary} aria-labelledby="order-summary">
      <h2 id="order-summary">Order Summary</h2>
      <ul aria-label="Order items">
        {lines.map(line => (
          <li key={line.familyId + "/" + line.variantId}>
            <Image src={getProductFinishImage(line.familyId, line.variantId)} alt=""
              width={54} height={54} unoptimized />
            <div>
              <strong>{line.familyName}</strong>
              <p>{line.finish}</p>
              <p>Quantity {line.quantity}</p>
            </div>
            <b>{formatPrice({ price: line.price * line.quantity, currency: line.currency })}</b>
          </li>
        ))}
      </ul>
      <p className={styles.total}>
        <span>Subtotal</span>
        <strong>{formatPrice({ price: subtotal, currency })} <small>{currency}</small></strong>
      </p>
      {children}
    </aside>
  );
}

