"use client";

import { useSyncExternalStore } from "react";
import { getProductFamily, isProductFamilyReady } from "@/config/productFamilies";

const STORAGE_KEY = "aural-forge-cart";
const EMPTY = [];
export const MAX_CART_QUANTITY = 99;
const listeners = new Set();
let cart;

function resolveLine({ familyId, variantId, quantity }) {
  if (typeof familyId !== "string" || typeof variantId !== "string" ||
      !isProductFamilyReady(familyId) || !Number.isInteger(quantity) || quantity < 1) return null;

  const family = getProductFamily(familyId);
  const variant = family.variants.find(item => item.id === variantId);
  if (!variant) return null;

  return {
    key: familyId + "/" + variantId,
    familyId, variantId, quantity: Math.min(quantity, MAX_CART_QUANTITY),
    familyName: family.label, finish: variant.name, demoPrice: variant.demoPrice,
    price: variant.price, currency: variant.currency,
  };
}

function readCart(value) {
  try {
    const saved = JSON.parse(value);
    if (!Array.isArray(saved)) return EMPTY;

    const lines = new Map();
    for (const item of saved) {
      const line = item && resolveLine(item);
      if (!line) continue;
      const previous = lines.get(line.key);
      if (previous) line.quantity = Math.min(previous.quantity + line.quantity, MAX_CART_QUANTITY);
      lines.set(line.key, line);
    }
    return [...lines.values()];
  } catch {
    return EMPTY;
  }
}

function getSnapshot() {
  if (!cart) {
    try {
      cart = readCart(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      cart = EMPTY;
    }
  }
  return cart;
}

function syncFromStorage(event) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  // Ignore sessionStorage events from other documents.
  try {
    if (event.storageArea !== window.localStorage) return;
  } catch {
    return;
  }
  cart = readCart(event.newValue);
  listeners.forEach(listener => listener());
}

function subscribe(listener) {
  if (listeners.size === 0) window.addEventListener("storage", syncFromStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", syncFromStorage);
  };
}

function save(lines) {
  cart = lines;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.map(
      ({ familyId, variantId, quantity }) => ({ familyId, variantId, quantity })
    )));
  } catch {
    // The current tab can still use the cart if storage is blocked.
  }
  listeners.forEach(listener => listener());
}

export function addCartItem(familyId, variantId, quantity) {
  const line = resolveLine({ familyId, variantId, quantity });
  if (!line) return 0;

  const lines = getSnapshot();
  const previous = lines.find(item => item.key === line.key);
  const next = Math.min((previous?.quantity ?? 0) + line.quantity, MAX_CART_QUANTITY);
  if (next === previous?.quantity) return 0;
  save(previous ? lines.map(item => item === previous ? { ...item, quantity: next } : item) : [...lines, line]);
  return next - (previous?.quantity ?? 0);
}

export function adjustCartQuantity(key, delta) {
  const lines = getSnapshot();
  const line = lines.find(item => item.key === key);
  if (!line || (delta !== 1 && delta !== -1)) return;
  const quantity = Math.min(MAX_CART_QUANTITY, Math.max(1, line.quantity + delta));
  if (quantity !== line.quantity) {
    save(lines.map(item => item === line ? { ...item, quantity } : item));
  }
}

export function removeCartItem(key) {
  const lines = getSnapshot();
  if (lines.some(item => item.key === key)) save(lines.filter(item => item.key !== key));
}

export function clearPlacedCart(lines) {
  if (getSnapshot() !== lines) throw new Error("The cart changed.");
  window.localStorage.setItem(STORAGE_KEY, "[]");
  cart = EMPTY;
  listeners.forEach(listener => listener());
}

export function getCartTotals(lines) {
  return {
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.quantity * line.price, 0),
    currency: lines[0]?.currency ?? "USD",
  };
}

const getServerSnapshot = () => null;

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { lines: snapshot ?? EMPTY, ready: snapshot !== null };
}

