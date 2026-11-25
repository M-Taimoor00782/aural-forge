"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { formatPrice, isProductFamilyReady } from "@/config/productFamilies";
import Link from "next/link";
import { getCartTotals, removeCartItem, useCart } from "@/lib/cartStore";
import CartQuantity from "./CartQuantity";
import BrandLockup from "./BrandLockup";
import styles from "./PremiumHeader.module.css";

function HeaderIcon({ name }) {
  const iconProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "search") {
    return (
      <svg {...iconProps}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    );
  }

  if (name === "cart") {
    return (
      <svg {...iconProps}>
        <path d="M3 4h2l2.2 11h11.4l2.1-8H6" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
    );
  }

  if (name === "sun") {
    return (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  if (name === "moon") {
    return (
      <svg {...iconProps}>
        <path d="M20.8 15.2A8.8 8.8 0 0 1 8.8 3.2 8.8 8.8 0 1 0 20.8 15.2Z" />
      </svg>
    );
  }

  if (name === "menu") {
    return (
      <svg {...iconProps}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

function toggleTheme() {
  const root = document.documentElement;

  const nextTheme =
    root.getAttribute("data-af-theme") === "light"
      ? "dark"
      : "light";

  root.setAttribute(
    "data-af-theme",
    nextTheme
  );

  try {
    window.localStorage.setItem(
      "aural-forge-theme",
      nextTheme
    );
  } catch {
    // Theme still changes for this session
    // if localStorage is unavailable.
  }
}

function ThemeToggle() {
  return (
    <button type="button" className={`${styles.icon} ${styles.theme}`} onClick={toggleTheme}
      aria-label="Toggle dark or light theme" title="Toggle dark or light theme">
      <span className={styles.sun}><HeaderIcon name="sun" /></span>
      <span className={styles.moon}><HeaderIcon name="moon" /></span>
    </button>
  );
}

function Drawer({ id, label, heading, open, fromLeft, onClose, children }) {
  return (
    <div className={styles.overlay} data-open={open} inert={!open}>
      <button type="button" className={styles.backdrop} aria-label={`Close ${label}`}
        tabIndex={-1} onClick={onClose} />
      <div id={id} role="dialog" aria-modal="true" aria-label={label}
        className={styles.drawer} data-side={fromLeft ? "left" : "right"}>
        <div className={styles.drawerTop}>
          <span>{heading} / AURAL FORGE</span>
          <button type="button" className={styles.close} onClick={onClose}
            aria-label={`Close ${label}`}>
            <HeaderIcon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const PANEL_IDS = {
  menu: "af-header-products",
  search: "af-header-search-panel",
  cart: "af-header-cart-panel",
};

export const HEADER_FAMILIES = [
  { id: "headphones", label: "Headphones" },
  { id: "earbuds", label: "Wireless Earbuds" },
  { id: "product-03", label: "Smartwatch" },
];

export default function PremiumHeader({ ref, families = HEADER_FAMILIES, familyId, transitioning, onSelectFamily, onHome }) {
  const [panel, setPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { lines: cart, ready } = useCart();
  const { count, subtotal, currency } = getCartTotals(cart);
  const brand = useRef(null);
  const cartOpener = useRef(null);

  useImperativeHandle(ref, () => ({
    openCart(opener) {
      cartOpener.current = opener;
      setPanel("cart");
    },
  }), []);

  useEffect(() => {
    if (!panel) return;

    const drawer = document.getElementById(PANEL_IDS[panel]);
    const trigger = document.querySelector(`[aria-controls="${drawer.id}"]`);
    const opener = panel === "cart" ? cartOpener.current ?? trigger : trigger;
    const fallback = brand.current;
    const root = document.documentElement;
    const overflow = root.style.overflowY;
    const gutter = root.style.scrollbarGutter;
    // Keep the layout width when locking a classic scrollbar. Overlay scrollbars need no gutter.
    if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = "stable";
    root.style.overflowY = "hidden";

    const initialFocus = drawer.querySelector("input") || drawer.querySelector("button");
    initialFocus.focus({ preventScroll: true });

    function handleKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setPanel(null);
      }
      if (event.key !== "Tab") return;

      const items = drawer.querySelectorAll("button:enabled, input, a[href]");
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function containFocus(event) {
      if (!drawer.contains(event.target)) initialFocus.focus({ preventScroll: true });
    }

    function closeHiddenTrigger() {
      if (!trigger.getClientRects().length) setPanel(null);
    }

    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", containFocus);
    window.addEventListener("resize", closeHiddenTrigger);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", containFocus);
      window.removeEventListener("resize", closeHiddenTrigger);
      root.style.overflowY = overflow;
      root.style.scrollbarGutter = gutter;
      cartOpener.current = null;
      const target = opener.isConnected && opener.getClientRects().length ? opener : fallback;
      target?.focus({ preventScroll: true });
    };
  }, [panel]);

  function selectFamily(id) {
    if (transitioning || !isProductFamilyReady(id)) return;
    setPanel(null);
    onSelectFamily(id);
  }

  function triggerProps(name, label) {
    return {
      type: "button",
      "aria-label": label,
      "aria-expanded": panel === name,
      "aria-controls": PANEL_IDS[name],
      "aria-haspopup": "dialog",
      onClick: () => setPanel(name),
    };
  }

  function familyAction({ id, label }, searchResult = false) {
    const ready = isProductFamilyReady(id);
    const className = searchResult ? styles.result : styles.navLink;
    const content = <>{label}{searchResult ? <span>{ready ? "Explore" : "Coming soon"}</span> :
      !ready && <span className={styles.soon}>Soon</span>}</>;
    if (!onSelectFamily && ready) {
      return <Link key={id} href={`/?family=${id}#hero`} className={className}
        aria-label={`Explore ${label}`} onNavigate={() => setPanel(null)}>{content}</Link>;
    }
    return (
      <button key={id} type="button" className={className}
        aria-pressed={familyId === id}
        aria-label={ready ? `Explore ${label}` : `${label}, coming soon`}
        disabled={!ready || transitioning}
        onClick={() => selectFamily(id)}>
        {content}
      </button>
    );
  }

  const matches = families.filter(({ label }) =>
    label.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  function searchField(id, label, placeholder) {
    return (
      <>
        <label className={styles.label} htmlFor={id}>{label}</label>
        <input id={id} className={styles.input} type="search" autoComplete="off"
          placeholder={placeholder} value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)} />
      </>
    );
  }

  return (
    <header className={styles.header}>
      <div className={`af-container ${styles.bar}`} inert={Boolean(panel)}>
        <button {...triggerProps("menu", "Open product menu")} className={`${styles.icon} ${styles.menu}`}>
          <HeaderIcon name="menu" />
        </button>
        <Link ref={brand} href={onHome ? "#hero" : "/#hero"} className={styles.brand}
          aria-label="Aural Forge, back to the beginning"
          onClick={onHome ? (event) => { event.preventDefault(); onHome(); } : undefined}>
          <BrandLockup />
        </Link>
        <nav className={styles.navigation} aria-label="Product navigation">
          {families.map(family => familyAction(family))}
        </nav>
        <div className={styles.utilities}>
          <button {...triggerProps("search", "Search products")} title="Search products"
            className={`${styles.icon} ${styles.search}`}><HeaderIcon name="search" /></button>
          <button {...triggerProps("cart", `Open cart, ${count} ${count === 1 ? "item" : "items"}`)} title="Cart"
            className={styles.icon}><HeaderIcon name="cart" />{count > 0 && <span className={styles.count} aria-hidden="true">{count > 99 ? "99+" : count}</span>}</button>
          <ThemeToggle />
        </div>
      </div>
      <Drawer id={PANEL_IDS.menu} label="Product navigation" heading="EXPLORE" fromLeft open={panel === "menu"} onClose={() => setPanel(null)}>
        {searchField("af-mobile-nav-search-field", "SEARCH PRODUCTS", "Headphones, earbuds...")}
        <p className={styles.listLabel}>OUR COLLECTION</p>
        <nav aria-label="Product families" className={styles.list}>{matches.map(family => familyAction(family))}</nav>
        {!matches.length && <p role="status" className={styles.detail}>No matching product families.</p>}
      </Drawer>
      <Drawer id={PANEL_IDS.search} label="Search products" heading="SEARCH" open={panel === "search"} onClose={() => setPanel(null)}>
        {searchField("af-header-search-input", "FIND A PRODUCT", "Search the collection...")}
        <div className={styles.results}>
          {matches.map(family => familyAction(family, true))}
          {!matches.length && <p role="status" className={styles.detail}>No matching product families.</p>}
        </div>
      </Drawer>
      <Drawer id={PANEL_IDS.cart} label="Cart" heading="YOUR BAG" open={panel === "cart"} onClose={() => setPanel(null)}>
        <h2 className={styles.cartTitle}>Cart</h2>
        {cart.length ? <>
          <ul className={styles.cartLines}>
            {cart.map(line => <li key={line.key}>
              <strong>{line.familyName}</strong>
              <span>{line.finish}<br />{formatPrice(line)} each</span>
              <b>{formatPrice({ ...line, price: line.price * line.quantity })}</b>
              <CartQuantity line={line} />
              <button type="button" className={styles.remove} data-cart-remove
                aria-label={`Remove ${line.familyName}, ${line.finish}`} onClick={event => {
                const row = event.currentTarget.closest("li");
                const next = row.nextElementSibling ?? row.previousElementSibling;
                const target = next?.querySelector("[data-cart-remove]") ?? row.closest("[role=dialog]").querySelector("button");
                target.focus({ preventScroll: true });
                removeCartItem(line.key);
              }}>Remove</button>
            </li>)}
          </ul>
          <p className={styles.subtotal} aria-live="polite"><span>Subtotal</span><strong>{formatPrice({ price: subtotal, currency })}</strong></p>
        </> : <p className={styles.detail}>{ready ? "Your cart is empty." : "Loading cart…"}</p>}
        <Link className={`af-button ${styles.viewCart}`} href="/cart" onNavigate={() => setPanel(null)}>
          View Cart
        </Link>
        <Link className={styles.collection} href={onHome ? "#products" : "/#products"} onNavigate={() => setPanel(null)}>
          Explore the collection <span aria-hidden="true">↗</span>
        </Link>
      </Drawer>
    </header>
  );
}
