import { clearPlacedCart, getCartTotals } from "./cartStore";

const KEY_PREFIX = "aural-forge-order:";
const NUMBER_PATTERN = /^AF[0-9A-F]{16}$/;

export function placeOrder(cart) {
  if (!cart.length) throw new Error("Your cart is empty.");

  const number = "AF" + Array.from(crypto.getRandomValues(new Uint8Array(8)),
    byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  const key = KEY_PREFIX + number;
  const order = { number, lines: cart, ...getCartTotals(cart) };
  window.localStorage.setItem(key, JSON.stringify(order));

  try {
    clearPlacedCart(cart);
  } catch (error) {
    window.localStorage.removeItem(key);
    throw error;
  }

  return number;
}

export function getOrderSnapshot(number) {
  if (!NUMBER_PATTERN.test(number ?? "")) return null;
  try {
    return window.localStorage.getItem(KEY_PREFIX + number);
  } catch {
    return null;
  }
}

export function parseOrder(value, number) {
  try {
    const order = JSON.parse(value);
    if (order?.number !== number || !Array.isArray(order.lines) || !order.lines.length ||
        order.currency !== "USD" || !Number.isFinite(order.subtotal) ||
        !order.lines.every(line => line && typeof line.familyId === "string" &&
          typeof line.variantId === "string" && typeof line.familyName === "string" &&
          typeof line.finish === "string" && Number.isInteger(line.quantity) && line.quantity > 0 &&
          Number.isFinite(line.price) && line.price >= 0 && line.currency === order.currency)) return null;
    const totals = getCartTotals(order.lines);
    return totals.subtotal === order.subtotal ? order : null;
  } catch {
    return null;
  }
}

