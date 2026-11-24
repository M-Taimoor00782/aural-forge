import { useEffect, useRef, useState } from "react";
import { formatPrice, isProductFamilyReady } from "@/config/productFamilies";
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

export default function PremiumHeader({ families, familyId, transitioning, onSelectFamily, onHome, cart, onRemove }) {
  const [panel, setPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.quantity * line.price, 0);
  const brand = useRef(null);

  useEffect(() => {
    if (!panel) return;

    const drawer = document.getElementById(PANEL_IDS[panel]);
    const trigger = document.querySelector(`[aria-controls="${drawer.id}"]`);
    const fallback = brand.current;
    const root = document.documentElement;
    const overflow = root.style.overflowY;
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
      const target = trigger.getClientRects().length ? trigger : fallback;
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

  function familyButton({ id, label }) {
    const ready = isProductFamilyReady(id);
    return (
      <button key={id} type="button" className={styles.navLink}
        aria-pressed={familyId === id}
        aria-label={ready ? `Explore ${label}` : `${label} — coming soon`}
        disabled={!ready || transitioning}
        onClick={() => selectFamily(id)}>
        {label}
        {!ready && <span className={styles.soon}>Soon</span>}
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
        <a ref={brand} href="#hero" className={styles.brand} aria-label="Aural Forge — back to hero"
          onClick={(event) => { event.preventDefault(); onHome(); }}>
          <span className={styles.mark} aria-hidden="true"><span /></span>
          AURAL FORGE
        </a>
        <nav className={styles.navigation} aria-label="Product navigation">
          {families.map(familyButton)}
        </nav>
        <div className={styles.utilities}>
          <button {...triggerProps("search", "Search products")} title="Search products"
            className={`${styles.icon} ${styles.search}`}><HeaderIcon name="search" /></button>
          <button {...triggerProps("cart", `Open demo cart, ${count} ${count === 1 ? "item" : "items"}`)} title="Demo cart"
            className={styles.icon}><HeaderIcon name="cart" />{count > 0 && <span className={styles.count} aria-hidden="true">{count > 99 ? "99+" : count}</span>}</button>
          <button type="button" className={`${styles.icon} ${styles.theme}`} onClick={toggleTheme}
            aria-label="Toggle dark or light theme" title="Toggle dark or light theme">
            <span className={styles.sun}><HeaderIcon name="sun" /></span>
            <span className={styles.moon}><HeaderIcon name="moon" /></span>
          </button>
        </div>
      </div>
      <Drawer id={PANEL_IDS.menu} label="Product navigation" heading="EXPLORE" fromLeft open={panel === "menu"} onClose={() => setPanel(null)}>
        {searchField("af-mobile-nav-search-field", "SEARCH PRODUCTS", "Headphones, earbuds...")}
        <p className={styles.listLabel}>OUR COLLECTION</p>
        <nav aria-label="Product families" className={styles.list}>{matches.map(familyButton)}</nav>
        {!matches.length && <p role="status" className={styles.detail}>No matching product families.</p>}
      </Drawer>
      <Drawer id={PANEL_IDS.search} label="Search products" heading="SEARCH" open={panel === "search"} onClose={() => setPanel(null)}>
        {searchField("af-header-search-input", "FIND A PRODUCT", "Search the collection...")}
        <div className={styles.results}>
          {matches.map(({ id, label }) => (
            <button key={id} type="button" disabled={!isProductFamilyReady(id) || transitioning}
              onClick={() => selectFamily(id)} className={styles.result}>
              {label}<span>{isProductFamilyReady(id) ? "Explore" : "Coming soon"}</span>
            </button>
          ))}
          {!matches.length && <p role="status" className={styles.detail}>No matching product families.</p>}
        </div>
      </Drawer>
      <Drawer id={PANEL_IDS.cart} label="Demo cart" heading="YOUR BAG" open={panel === "cart"} onClose={() => setPanel(null)}>
        <h2 className={styles.cartTitle}>Demo cart</h2>
        {cart.length ? <>
          <ul className={styles.cartLines}>
            {cart.map(line => <li key={line.key}>
              <strong>{line.familyName}</strong>
              <span>{line.finish} · {line.quantity} × {formatPrice(line)}{line.demoPrice && " (demo price)"}</span>
              <b>{formatPrice({ ...line, price: line.price * line.quantity })}</b>
              <button type="button" aria-label={`Remove ${line.familyName}, ${line.finish}`} onClick={event => {
                const row = event.currentTarget.closest("li");
                const next = row.nextElementSibling ?? row.previousElementSibling;
                const target = next?.querySelector("button") ?? row.closest("[role=dialog]").querySelector("button");
                target.focus({ preventScroll: true });
                onRemove(line.key);
              }}>Remove</button>
            </li>)}
          </ul>
          <p className={styles.subtotal}><span>Subtotal</span><strong>{formatPrice({ price: subtotal, currency: cart[0].currency })}</strong></p>
        </> : <p className={styles.detail}>Your cart is empty.</p>}
        <a className={styles.collection} href="#products" onClick={() => setPanel(null)}>
          Explore the collection <span aria-hidden="true">↗</span>
        </a>
      </Drawer>
    </header>
  );
}
