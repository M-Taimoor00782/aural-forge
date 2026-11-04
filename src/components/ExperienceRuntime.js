"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { resolveProductState } from "@/config/productStates";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyVariant,
  getProductFamilyWorld,
  isProductFamilyReady,
} from "@/config/productFamilies";

import {
  FAMILY_TRANSITION_PHASES,
  createFamilyTransitionPlan,
} from "@/config/productFamilyTransitions";

import ScrollStoryController from "./ScrollStoryController";
import StorySections from "./StorySections";

import ExperienceCursor from "./ExperienceCursor";
import ProductFamilyTransitionController from "./ProductFamilyTransitionController";

const ExperienceCanvas = dynamic(
  () => import("./ExperienceCanvas"),
  {
    ssr: false,
    loading: () => null,
  }
);

const HEADER_FAMILIES = [
  { id: "headphones", label: "Headphones" },
  { id: "earbuds", label: "Wireless Earbuds" },
  { id: "product-03", label: "Smartwatch" },
];

function navigateToHero() {
  const hero = document.getElementById("hero");

  if (!hero) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  window.scrollTo({
    top: window.scrollY + hero.getBoundingClientRect().top,
    behavior: reducedMotion ? "auto" : "smooth",
  });
}

/* af-header-v2-locked */

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

/* af-theme-component-v1 */
/* af-header-refinement-v3 */
function PremiumHeader({
  familyId,
  transitioning,
  onSelectFamily,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const searchInputRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const menuToggleRef = useRef(null);

  useEffect(() => {
    if (panel === "search") {
      searchInputRef.current?.focus();
    }
  }, [panel]);
  // Accessible right-hand drawer: focus, Escape, and scroll lock.
  useEffect(() => {
    if (!panel) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";

    const drawerId = panel === "search"
      ? "af-header-search-panel"
      : "af-header-cart-panel";

    const drawer = document.getElementById(drawerId);

    if (panel === "cart") {
      drawer?.querySelector(".af-header-drawer-close")?.focus();
    }

    const handleTab = (event) => {
      if (event.key !== "Tab" || !drawer) return;

      const items = [...drawer.querySelectorAll(
        'button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )].filter((element) => element.getClientRects().length);

      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!drawer.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => {
      document.removeEventListener("keydown", handleTab);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && previousFocus?.focus) {
        previousFocus.focus();
      }
    };
  }, [panel]);

  useEffect(() => {
    if (!menuOpen && !panel) return;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setPanel(null);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [menuOpen, panel]);

  /* Mobile drawer navigation: focus, scroll lock and keyboard support. */
  useEffect(() => {
    if (!menuOpen) return;

    const nav = document.getElementById("af-header-products");
    if (!nav) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      mobileSearchRef.current?.focus({ preventScroll: true });
    });

    const onKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const items = [...nav.querySelectorAll(
        'input:not([disabled]),button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'
      )].filter((element) => element.getClientRects().length);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!nav.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    const onResize = () => {
      if (window.innerWidth > 1020) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = previousOverflow;
      menuToggleRef.current?.focus({ preventScroll: true });
    };
  }, [menuOpen]);
  function selectFamily(nextFamilyId) {
    if (
      transitioning ||
      !isProductFamilyReady(nextFamilyId)
    ) {
      return;
    }

    setMenuOpen(false);
    setPanel(null);

    onSelectFamily(nextFamilyId);
  }

  function togglePanel(nextPanel) {
    setMenuOpen(false);
    setPanel((current) =>
      current === nextPanel ? null : nextPanel
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

  const searchResults = HEADER_FAMILIES.filter(
    ({ label }) =>
      label.toLowerCase().includes(
        searchQuery.trim().toLowerCase()
      )
  );

  return (
    <header className="af-header-v2">
      <div className="af-header-inner">
        <button
          type="button"
          className="af-header-icon-button af-header-menu-toggle"
          ref={menuToggleRef}
          aria-label={
            menuOpen
              ? "Close product menu"
              : "Open product menu"
          }
          aria-expanded={menuOpen}
          aria-controls="af-header-products"
          onClick={() => {
            setPanel(null);
            setMenuOpen((current) => !current);
          }}
          data-af-cursor="interactive"
        >
          <HeaderIcon
            name={menuOpen ? "close" : "menu"}
          />
        </button>
        <a
          href="#hero"
          className="af-header-brand"
          aria-label="Aural Forge — back to hero"
          onClick={(event) => {
            event.preventDefault();

            setMenuOpen(false);
            setPanel(null);
            navigateToHero();
          }}
        >
          <span
            className="af-header-brand-mark"
            aria-hidden="true"
          >
            <span />
          </span>

          <span className="af-header-brand-name">
            AURAL FORGE
          </span>
        </a>

        <button
          type="button"
          className={`af-mobile-nav-backdrop${menuOpen ? " is-open" : ""}`}
          aria-label="Close product navigation"
          tabIndex={-1}
          disabled={!menuOpen}
          onClick={() => setMenuOpen(false)}
        />
        <nav
          id="af-header-products"
          className={`af-header-nav${
            menuOpen ? " is-open" : ""
          }`}
          aria-label="Product navigation"
        >          <div className="af-mobile-nav-top">
            <span>EXPLORE / AURAL FORGE</span>
            <button
              type="button"
              className="af-mobile-nav-close"
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
            >
              <HeaderIcon name="close" />
            </button>
          </div>
          <div className="af-mobile-nav-search">
            <label htmlFor="af-mobile-nav-search-field">SEARCH PRODUCTS</label>
            <input
              id="af-mobile-nav-search-field"
              ref={mobileSearchRef}
              type="search"
              placeholder="Headphones, earbuds..."
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <p className="af-mobile-nav-list-label">OUR COLLECTION</p>
          {(menuOpen ? searchResults : HEADER_FAMILIES).map(({ id, label }) => {
            const ready = isProductFamilyReady(id);
            const selected = familyId === id;

            return (
              <button
                key={id}
                type="button"
                className={`af-header-nav-link${
                  selected ? " is-active" : ""
                }`}
                style={{ "--af-nav-accent": "var(--af-accent)" }}
                aria-pressed={selected}
                aria-label={
                  ready
                    ? `Explore ${label}`
                    : `${label} — coming soon`
                }
                title={
                  ready
                    ? label
                    : `${label} — coming soon`
                }
                disabled={!ready || transitioning}
                onClick={() => selectFamily(id)}
                data-af-cursor="interactive"
              >
                <span>{label}</span>

                {!ready && (
                  <span className="af-header-soon">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
          {menuOpen && searchResults.length === 0 && (
            <p className="af-mobile-nav-empty" role="status">
              No matching product families.
            </p>
          )}        </nav>


        <div className="af-header-utilities">
          <button
            type="button"
            className={`af-header-icon-button${
              panel === "search" ? " is-active" : ""
            }`}
            aria-label="Search products"
            aria-expanded={panel === "search"}
            aria-controls="af-header-search-panel"
            title="Search products"
            onClick={() => togglePanel("search")}
            data-af-cursor="interactive"
          >
            <HeaderIcon name="search" />
          </button>

          <button
            type="button"
            className={`af-header-icon-button${
              panel === "cart" ? " is-active" : ""
            }`}
            aria-label="Open demo cart information"
            aria-expanded={panel === "cart"}
            aria-controls="af-header-cart-panel"
            title="Demo cart"
            onClick={() => togglePanel("cart")}
            data-af-cursor="interactive"
          >
            <HeaderIcon name="cart" />
          </button>

          <button
            type="button"
            className="af-header-icon-button af-header-theme-toggle"
            aria-label="Toggle dark or light theme"
            title="Toggle dark or light theme"
            onClick={toggleTheme}
            data-af-cursor="interactive"
          >
            <span className="af-theme-show-dark">
              <HeaderIcon name="sun" />
            </span>

            <span className="af-theme-show-light">
              <HeaderIcon name="moon" />
            </span>
          </button>

        </div>

        {panel && (
          <button
            type="button"
            className="af-header-drawer-backdrop"
            aria-label="Close product drawer"
            tabIndex={-1}
            onClick={() => setPanel(null)}
          />
        )}
        {panel === "search" && (
          <div
            id="af-header-search-panel"
            className="af-header-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
          >
            <div className="af-header-drawer-top">
              <span>SEARCH / AURAL FORGE</span>
              <button
                type="button"
                className="af-header-drawer-close"
                aria-label="Close search drawer"
                onClick={() => setPanel(null)}
              >
                <HeaderIcon name="close" />
              </button>
            </div>
            <label
              htmlFor="af-header-search-input"
              className="af-header-panel-label"
            >
              FIND A PRODUCT
            </label>

            <input
              id="af-header-search-input"
              ref={searchInputRef}
              type="search"
              autoComplete="off"
              placeholder="Search the collection..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
              }}
              className="af-header-search-input"
            />

            <div className="af-header-search-results">
              {searchResults.length > 0 ? (
                searchResults.map(({ id, label }) => {
                  const ready = isProductFamilyReady(id);

                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!ready || transitioning}
                      onClick={() => selectFamily(id)}
                      className="af-header-result"
                    >
                      <span>{label}</span>

                      <span>
                        {ready
                          ? "Explore"
                          : "Coming soon"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="af-header-empty">
                  No matching product families.
                </p>
              )}
            </div>
          </div>
        )}

        {panel === "cart" && (
          <div
            id="af-header-cart-panel"
            className="af-header-panel af-header-cart-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="af-header-cart-title"
          >
            <div className="af-header-drawer-top">
              <span>YOUR BAG / AURAL FORGE</span>
              <button
                type="button"
                className="af-header-drawer-close"
                aria-label="Close cart drawer"
                onClick={() => setPanel(null)}
              >
                <HeaderIcon name="close" />
              </button>
            </div>
            <p className="af-header-panel-label">
              YOUR BAG
            </p>

            <h2 id="af-header-cart-title">Demo cart</h2>

            <p>
              The cart and checkout experience
              will be connected during the
              commerce implementation phase.
              Product selections are not
              stored in the cart yet.
            </p>

            <a
              href="#products"
              onClick={() => setPanel(null)}
              className="af-header-collection-link"
            >
              Explore the collection
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}
      </div>

      <style>{`
        .af-header-v2 {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 90;
          padding: 14px var(--af-page-gutter) 0;
          pointer-events: none;
        }

        .af-header-inner {
          position: relative;
          width: 100%;
          max-width: var(--af-container-max);
          min-height: 76px;
          margin-inline: auto;
          padding-inline: clamp(18px, 2.2vw, 30px);
          display: grid;
          grid-template-columns: minmax(185px, 1fr) auto minmax(185px, 1fr);
          align-items: center;
          gap: clamp(12px, 1.8vw, 26px);
          border: 1px solid rgba(243,243,244,.14);
          border-radius: 17px;
          background: #1A1819;
          color: var(--af-text-primary);
          box-shadow: 0 16px 45px rgba(0,0,0,.28),
            inset 0 1px 0 rgba(255,255,255,.045);
          /* Do not apply backdrop-filter here: fixed drawers live inside. */
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          pointer-events: auto;
          transition: background-color var(--af-transition-theme) ease,
            border-color var(--af-transition-theme) ease,
            color var(--af-transition-theme) ease,
            box-shadow var(--af-transition-theme) ease;
        }

        .af-header-brand {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          justify-self: start;
          gap: 12px;
          color: var(--af-text-primary);
          text-decoration: none;
          white-space: nowrap;
        }

        .af-header-brand-mark {
          width: 40px;
          height: 40px;
          flex-shrink: 0;

          display: grid;
          place-items: center;

          border: 1.5px solid var(--af-accent);
          border-radius: 10px;

          transform: rotate(-15deg);
        }

        .af-header-brand-mark span {
          width: 15px;
          height: 15px;
          border-top: 2px solid var(--af-accent);
          border-right: 2px solid var(--af-accent);
          border-radius: 3px;
        }

        .af-header-brand-name {
          font-family: var(--af-font-heading, Saira, sans-serif);
          font-size: clamp(18px, 1.5vw, 21px);
          font-weight: 650;
          line-height: 1.1;
          letter-spacing: .012em;
          white-space: nowrap;
        }

        .af-header-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(17px, 2.3vw, 32px);
          align-self: stretch;
        }

        .af-header-nav-link {
          position: relative;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          min-height: 48px;
          padding: 4px 0;
          border: 0;
          background: transparent;
          color: var(--af-text-secondary);
          font-family: var(--af-font-body, Montserrat, sans-serif);
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
          letter-spacing: .005em;
          white-space: nowrap;
          cursor: pointer;
          transition: color var(--af-transition-fast) ease;
        }

        .af-header-nav-link::after {
          content: "";
          position: absolute;
          bottom: 9px;
          left: 0;
          right: 0;
          height: 2px;
          border-radius: 2px;
          background: var(--af-nav-accent);
          transform: scaleX(0);
          transform-origin: center;
          transition:
            transform 340ms var(--af-ease-premium);
        }

        .af-header-nav-link:hover:not(:disabled),
        .af-header-nav-link.is-active {
          color: var(--af-text-primary);
        }

        .af-header-nav-link.is-active::after {
          transform: scaleX(1);
        }

        .af-header-nav-link:disabled {
          cursor: not-allowed;
          opacity: .62;
        }

        .af-header-soon {
          color: var(--af-accent);
          font-family: var(--af-font-button) !important;
          font-size: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        .af-header-utilities {
          display: flex;
          justify-self: end;
          align-items: center;
          gap: clamp(5px, .65vw, 9px);
        }

        .af-header-icon-button {
          position: relative;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 1px solid transparent;
          border-radius: 11px;
          background: transparent;
          color: var(--af-text-primary);
          font-family: var(--af-font-button, Inter, sans-serif);
          cursor: pointer;
          transition: color var(--af-transition-fast) ease,
            border-color var(--af-transition-fast) ease,
            background-color var(--af-transition-fast) ease,
            transform var(--af-transition-fast) ease;
        }

        .af-header-icon-button:hover,
        .af-header-icon-button.is-active {
          color: var(--af-accent);
          background: var(--af-surface-elevated);
          border-color: var(--af-border);
        }

        .af-header-icon-button:active {
          transform: scale(.94);
        }

        /* af-header-consistency-v3: identical structure, theme-specific color */
        .af-header-theme-toggle {
          border-color: rgba(246,181,78,.46);
          background: rgba(246,181,78,.075);
          color: var(--af-accent);
        }

        :root[data-af-theme="light"] .af-header-theme-toggle {
          border-color: rgba(75,0,130,.38);
          background: rgba(75,0,130,.055);
          color: var(--af-accent);
        }

        .af-header-theme-toggle:hover {
          border-color: var(--af-accent);
          background: var(--af-surface-elevated);
        }
        .af-theme-show-dark,
        .af-theme-show-light {
          display: grid;
          place-items: center;
        }

        .af-theme-show-light {
          display: none;
        }

        :root[data-af-theme="light"]
          .af-theme-show-dark {
          display: none;
        }

        :root[data-af-theme="light"]
          .af-theme-show-light {
          display: grid;
        }

        .af-header-menu-toggle {
          display: none;
        }

        /* af-header-drawers-v1 */
        .af-header-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 101;
          width: min(450px, 100vw);
          height: 100vh;
          height: 100dvh;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: clamp(26px, 3vw, 42px);
          border: 0;
          border-left: 1px solid var(--af-border-strong);
          border-radius: 0;
          background: var(--af-surface);
          color: var(--af-text-primary);
          box-shadow: -18px 0 65px rgba(0,0,0,.28);
          pointer-events: auto;
          animation: af-drawer-slide-in 360ms var(--af-ease-premium) both;
        }

        .af-header-drawer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: rgba(0,0,0,.58);
          cursor: default;
          pointer-events: auto;
          animation: af-drawer-backdrop-in 240ms ease-out both;
        }

        .af-header-inner {
          max-width: var(--af-container-max, 1390px);
        }

        .af-header-brand-name {
          font-family: var(--af-font-heading, Saira, sans-serif);
        }

        .af-header-nav-link {
          font-family: var(--af-font-body, Montserrat, sans-serif);
        }

        .af-header-icon-button,
        .af-header-drawer-close {
          font-family: var(--af-font-button, Inter, sans-serif);
        }

        :root[data-af-theme="light"] .af-header-inner {
          background: #F8F9FB;
          border-color: rgba(26,22,33,.17);
          box-shadow: 0 16px 45px rgba(26,22,33,.14),
            inset 0 1px 0 rgba(255,255,255,.8);
        }

        :root[data-af-theme="light"] .af-header-drawer-backdrop {
          background: rgba(26,22,33,.38);
        }

        .af-header-drawer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 22px;
          margin-bottom: 32px;
          border-bottom: 1px solid var(--af-border-strong);
          color: var(--af-accent);
          font-family: var(--af-font-body, Montserrat, sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .15em;
        }

        .af-header-drawer-close {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border: 1px solid var(--af-border-strong);
          border-radius: 11px;
          background: transparent;
          color: var(--af-text-primary);
          cursor: pointer;
          transition: background-color 180ms ease, color 180ms ease;
        }

        .af-header-drawer-close:hover {
          background: var(--af-surface-elevated);
          color: var(--af-accent);
        }

        @keyframes af-drawer-slide-in {
          from { opacity: .65; transform: translateX(42px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes af-drawer-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .af-header-panel-label {
          display: block;
          margin-bottom: 13px;
          color: var(--af-accent);
          font-family: var(--af-font-body);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .17em;
        }

        .af-header-search-input {
          display: block;
          width: 100%;
          min-height: 46px;
          padding: 11px 14px;
          border: 1px solid var(--af-border-strong);
          border-radius: 8px;
          background: var(--af-input-bg);
          color: var(--af-input-text);
          font-family: var(--af-font-body);
          font-size: 13px;
        }

        .af-header-search-input::placeholder {
          color: var(--af-text-muted);
        }

        .af-header-search-results {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-top: 14px;
        }

        .af-header-result {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          width: 100%;
          padding: 13px 10px;
          border: 0;
          border-bottom: 1px solid var(--af-border);
          background: transparent;
          color: var(--af-text-primary);
          font-family: var(--af-font-button);
          font-size: 12px;
          text-align: left;
          cursor: pointer;
        }

        .af-header-result span:last-child {
          color: var(--af-text-muted);
          font-size: 10px;
        }

        .af-header-result:hover:not(:disabled) {
          color: var(--af-accent);
        }

        .af-header-result:disabled {
          opacity: .58;
          cursor: not-allowed;
        }

        .af-header-empty {
          padding: 14px 0;
          color: var(--af-text-secondary);
          font-size: 12px;
        }

        .af-header-cart-panel h2 {
          margin-bottom: 11px;
          font-family: var(--af-font-heading);
          font-size: 25px;
          font-weight: 600;
        }

        .af-header-cart-panel > p:not(.af-header-panel-label) {
          color: var(--af-text-secondary);
          font-family: var(--af-font-body);
          font-size: 12px;
          line-height: 1.75;
        }

        .af-header-collection-link {
          display: inline-flex;
          align-items: center;
          gap: 18px;
          margin-top: 24px;
          color: var(--af-accent);
          font-family: var(--af-font-button);
          font-size: 12px;
          font-weight: 600;
        }

        .af-header-v2 :is(a,button,input):focus-visible {
          outline: 2px solid var(--af-focus-ring);
          outline-offset: 3px;
        }

        @media (max-width: 1020px) {
          .af-header-v2 {
            padding-top: 10px;
          }

          .af-header-inner {
            min-height: 62px;
            grid-template-columns: minmax(0,1fr) auto;
            padding-inline: 13px;
          }

          .af-header-nav {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            align-self: auto;
            flex-direction: column;
            align-items: stretch;
            gap: 2px;
            padding: 12px;
            border: 1px solid var(--af-border-strong);
            border-radius: 13px;
            background: var(--af-surface);
            box-shadow: 0 20px 50px rgba(0,0,0,.22);
          }

          .af-header-nav.is-open {
            display: flex;
          }

          .af-header-nav-link {
            min-height: 48px;
            justify-content: flex-start;
            padding: 10px 14px;
            font-size: 13px;
          }

          .af-header-nav-link::after {
            top: 10px;
            bottom: 10px;
            left: 3px;
            right: auto;
            width: 2px;
            height: auto;
            transform: scaleY(0);
          }

          .af-header-nav-link.is-active::after {
            transform: scaleY(1);
          }

          .af-header-menu-toggle {
            display: grid;
          }
        }

        @media (max-width: 480px) {
          .af-header-brand {
            gap: 8px;
          }

          .af-header-brand-name {
            font-size: 14px;
          }

          .af-header-brand-mark {
            width: 27px;
            height: 27px;
            border-radius: 7px;
          }

          .af-header-brand-mark span {
            width: 12px;
            height: 12px;
          }

          .af-header-utilities {
            gap: 0;
          }

          .af-header-icon-button {
            width: 34px;
            height: 38px;
          }

          .af-header-icon-button svg {
            width: 18px;
            height: 18px;
          }

          .af-header-panel {
            left: auto;
            right: 0;
            width: min(440px, 100vw);
            padding: 26px 22px;
          }
        }

        @media (max-aspect-ratio: 3/4) {
          #hero {
            padding-top: max(110px, 11vh) !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .af-header-v2 *,
          .af-header-v2 *::after {
            transition: none !important;
          }
          .af-header-panel,
          .af-header-drawer-backdrop {
            animation: none !important;
          }
        }
        /* af-mobile-left-navigation-v1 */
        .af-mobile-nav-backdrop,
        .af-mobile-nav-top,
        .af-mobile-nav-search,
        .af-mobile-nav-list-label,
        .af-mobile-nav-empty {
          display: none;
        }

        @media (max-width: 1020px) {
          .af-header-v2 {
            padding: 12px var(--af-page-gutter) 0;
          }

          .af-header-inner {
            min-height: 66px;
            display: grid;
            grid-template-columns: 42px minmax(0, 1fr) auto;
            gap: 6px;
            padding-inline: 14px;
            align-items: center;
          }

          .af-header-menu-toggle {
            display: grid;
            grid-column: 1;
            grid-row: 1;
            justify-self: start;
            width: 42px;
            height: 42px;
            z-index: 1;
          }

          .af-header-brand {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            justify-self: center;
            gap: 7px;
            min-width: 0;
            z-index: 1;
          }

          .af-header-brand-name {
            font-size: clamp(11px, 2.7vw, 16px);
            letter-spacing: 0;
          }

          .af-header-brand-mark {
            width: 30px;
            height: 30px;
            flex-shrink: 0;
          }

          .af-header-utilities {
            grid-column: 3;
            grid-row: 1;
            display: flex;
            align-items: center;
            justify-self: end;
            gap: 4px;
          }

          .af-header-utilities button[aria-label="Search products"] {
            display: none;
          }

          .af-header-icon-button {
            width: 40px;
            height: 40px;
          }

          .af-header-nav {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            right: auto;
            bottom: 0;
            z-index: 106;
            width: min(380px, calc(100vw - 24px));
            height: 100vh;
            height: 100dvh;
            padding: 28px 23px 40px;
            border: 0;
            border-right: 1px solid var(--af-border-strong);
            border-radius: 0;
            background: var(--af-surface);
            color: var(--af-text-primary);
            box-shadow: 18px 0 60px rgba(0,0,0,.22);
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            gap: 0;
            overflow-y: auto;
            overscroll-behavior: contain;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translate3d(-104%, 0, 0);
            transition:
              transform 420ms var(--af-ease-premium),
              opacity 280ms ease,
              visibility 0s linear 420ms;
          }

          .af-header-nav.is-open {
            display: flex;
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translate3d(0, 0, 0);
            transition:
              transform 420ms var(--af-ease-premium),
              opacity 280ms ease,
              visibility 0s;
          }

          .af-mobile-nav-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 105;
            width: 100vw;
            height: 100vh;
            height: 100dvh;
            padding: 0;
            border: 0;
            border-radius: 0;
            background: rgba(0,0,0,.58);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity 300ms ease, visibility 0s linear 300ms;
          }

          .af-mobile-nav-backdrop.is-open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transition: opacity 300ms ease, visibility 0s;
          }

          :root[data-af-theme="light"] .af-mobile-nav-backdrop {
            background: rgba(26,22,33,.38);
          }

          .af-mobile-nav-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding-bottom: 20px;
            margin-bottom: 26px;
            border-bottom: 1px solid var(--af-border);
            color: var(--af-accent);
            font: 700 11px/1.4 var(--af-font-body);
            letter-spacing: .13em;
          }

          .af-mobile-nav-close {
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border: 1px solid var(--af-border-strong);
            border-radius: 11px;
            background: transparent;
            color: var(--af-text-primary);
            cursor: pointer;
          }

          .af-mobile-nav-search {
            display: flex;
            flex-direction: column;
            gap: 11px;
            margin-bottom: 35px;
          }

          .af-mobile-nav-search label,
          .af-mobile-nav-list-label {
            font: 700 10px/1.4 var(--af-font-body);
            letter-spacing: .14em;
            color: var(--af-text-secondary);
          }

          .af-mobile-nav-search input {
            width: 100%;
            min-height: 50px;
            padding: 12px 14px;
            border: 1px solid var(--af-border-strong);
            border-radius: 10px;
            background: var(--af-input-bg);
            color: var(--af-input-text);
            font-family: var(--af-font-body);
            font-size: 14px;
          }

          .af-mobile-nav-search input::placeholder {
            color: var(--af-text-muted);
          }

          .af-mobile-nav-list-label {
            display: block;
            margin-bottom: 12px;
          }

          .af-header-nav-link {
            width: 100%;
            min-height: 57px;
            padding: 12px 15px;
            justify-content: space-between;
            font-family: var(--af-font-body);
            font-size: 15px;
            border-bottom: 1px solid var(--af-border);
          }

          .af-header-nav-link::after {
            left: 0;
            top: 9px;
            bottom: 9px;
          }

          .af-mobile-nav-empty {
            display: block;
            padding: 18px 0;
            color: var(--af-text-secondary);
            font-family: var(--af-font-body);
            font-size: 13px;
          }
        }

        @media (max-width: 400px) {
          .af-header-inner {
            grid-template-columns: 36px minmax(0, 1fr) auto;
            gap: 4px;
            padding-inline: 10px;
            min-height: 60px;
          }
          .af-header-menu-toggle,
          .af-header-icon-button {
            width: 36px;
            height: 38px;
          }
          .af-header-brand {
            gap: 5px;
          }
          .af-header-brand-mark {
            width: 25px;
            height: 25px;
          }
          .af-header-brand-name {
            font-size: clamp(10px, 3vw, 12px);
          }
          .af-header-utilities { gap: 2px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .af-header-nav,
          .af-header-nav.is-open,
          .af-mobile-nav-backdrop,
          .af-mobile-nav-backdrop.is-open {
            transition: none !important;
          }
        }
      `}</style>
    </header>
  );
}
function ProductsSection({
  selectedVariantsByFamily,
  onVariantChange,
  onExplore,
  transitioning,
}) {
  const families = HEADER_FAMILIES.map(({ id }) =>
    getProductFamily(id)
  );

  return (
    <section
      id="products"
      className="af-products"
      aria-labelledby="af-products-heading"
    >
      <div className="af-products-inner">
        <div className="af-products-topline">
          <span className="af-products-kicker">THE COLLECTION</span>
          <span className="af-products-meta">DESIGNED FOR EVERY FREQUENCY</span>
        </div>

        <div className="af-products-intro">
          <h2 id="af-products-heading">Find your frequency.</h2>
          <p>
            Explore the collection and choose a finish. Enter the
            immersive story to inspect each available product in 3D.
          </p>
        </div>

        <div className="af-products-grid">
          {families.map((family) => {
            const ready = isProductFamilyReady(family.id);
            const variant = getProductFamilyVariant(
              family.id,
              selectedVariantsByFamily[family.id]
            );

            const accent = "var(--af-accent)";

            const finishColor = variant?.swatch ??
              getProductFamilyWorld(
                family.id,
                variant?.id
              ).palette.accent;

            const price = Number.isFinite(variant?.price)
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: variant.currency ?? "USD",
                  maximumFractionDigits: 0,
                }).format(variant.price)
              : null;

            return (
              <article
                className={`af-products-card${ready ? "" : " is-upcoming"}`}
                key={family.id}
              >
                <div className="af-products-card-header">
                  <span>{family.number} / COLLECTION</span>
                  <span>{ready ? "AVAILABLE TO EXPLORE" : "COMING SOON"}</span>
                </div>

                <div
                  className="af-products-finish-preview"
                  aria-label={
                    ready
                      ? `Finish preview: ${variant?.name ?? "Default"}`
                      : "Preview unavailable"
                  }
                >
                  {ready ? (
                    <div
                      className="af-products-finish-object"
                      style={{ "--finish": finishColor }}
                      aria-hidden="true"
                    >
                      <span />
                    </div>
                  ) : (
                    <span
                      className="af-products-placeholder"
                      aria-hidden="true"
                    >
                      03
                    </span>
                  )}

                  <span className="af-products-preview-label">
                    {ready ? "FINISH PREVIEW" : "IN DEVELOPMENT"}
                  </span>
                </div>

                <div className="af-products-card-title">
                  <h3>{family.label}</h3>
                  {price && <span>{price}</span>}
                </div>

                {ready && variant ? (
                  <>
                    <p className="af-products-finish-name">
                      {variant.name ?? variant.label ?? variant.id}
                    </p>

                    <div
                      className="af-products-swatches"
                      role="group"
                      aria-label={`${family.label} finishes`}
                    >
                      {family.variants.map((option) => {
                        const color = option.swatch ??
                          getProductFamilyWorld(
                            family.id,
                            option.id
                          ).palette.accent;

                        const selected = option.id === variant.id;

                        return (
                          <button
                            type="button"
                            key={option.id}
                            aria-pressed={selected}
                            aria-label={`${option.name ?? option.id} finish`}
                            title={option.name ?? option.id}
                            onClick={() =>
                              onVariantChange(family.id, option.id)
                            }
                            disabled={transitioning}
                            className={`af-products-swatch${selected ? " is-active" : ""}`}
                            style={{
                              "--swatch": color,
                              "--accent": accent,
                            }}
                          >
                            <span />
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="af-products-explore"
                      disabled={transitioning}
                      onClick={() => onExplore(family.id)}
                    >
                      Explore in 3D
                      <span aria-hidden="true">↗</span>
                    </button>
                  </>
                ) : (
                  <>
                    <p className="af-products-finish-name">
                      A future addition to the Aural Forge collection.
                    </p>
                    <span className="af-products-unavailable">
                      In development
                    </span>
                  </>
                )}
              </article>
            );
          })}
        </div>

        <p className="af-products-footnote">
          Material swatches are previews. Full product inspection is available
          in the immersive 3D story. Shopping checkout is not active yet.
        </p>
      </div>

      <style>{`
        /* af-products-theme-v2 */
        .af-products {
          position: relative;
          z-index: 5;
          isolation: isolate;
          min-height: 100svh;
          background: var(--af-background);
          color: var(--af-text-primary);
          padding: clamp(78px, 11vw, 160px) var(--af-page-gutter);
        }

        .af-products-inner {
          max-width: var(--af-container-max);
          margin: 0 auto;
        }

        .af-products-topline {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: space-between;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--af-border);
          color: var(--af-accent);
          font: 600 10px var(--font-af-body), Montserrat, sans-serif;
          letter-spacing: .19em;
        }

        .af-products-meta {
          color: var(--af-text-muted);
        }

        .af-products-intro {
          margin: clamp(35px, 6vw, 78px) 0 55px;
          display: flex;
          justify-content: space-between;
          align-items: end;
          flex-wrap: wrap;
          gap: 24px;
        }

        .af-products-intro h2 {
          max-width: 720px;
          font: 600 clamp(42px, 6vw, 83px)/1.05
            var(--font-af-heading), Saira, sans-serif;
          letter-spacing: -.045em;
        }

        .af-products-intro p {
          max-width: 345px;
          color: var(--af-text-secondary);
          font: 400 13px/1.8
            var(--font-af-body), Montserrat, sans-serif;
        }

        .af-products-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 18px;
        }

        .af-products-card {
          min-width: 0;
          border: 1px solid var(--af-border);
          background: var(--af-surface);
          border-radius: 18px;
          padding: clamp(18px, 2vw, 27px);
          display: flex;
          flex-direction: column;
        }

        .af-products-card-header {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          color: var(--af-text-muted);
          font: 600 9px var(--font-af-body), Montserrat, sans-serif;
          letter-spacing: .14em;
        }

        .af-products-finish-preview {
          min-height: 265px;
          margin: 18px 0 24px;
          position: relative;
          display: grid;
          place-items: center;
          background: var(--af-surface-elevated);
          border-radius: 11px;
          overflow: hidden;
        }

        .af-products-finish-object {
          width: 136px;
          height: 136px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle at 31% 24%,
              rgba(255,255,255,.46),
              transparent 31%
            ),
            var(--finish);
          box-shadow:
            inset -19px -23px 34px rgba(0,0,0,.45),
            0 18px 60px rgba(0,0,0,.35);
          transform: rotate(-23deg);
          display: grid;
          place-items: center;
        }

        .af-products-finish-object span {
          width: 63%;
          height: 63%;
          border: 1px solid rgba(255,255,255,.29);
          border-radius: 50%;
        }

        .af-products-placeholder {
          font: 600 90px var(--font-af-heading), Saira, sans-serif;
          color: var(--af-border-strong);
        }

        .af-products-preview-label {
          position: absolute;
          bottom: 16px;
          left: 17px;
          color: var(--af-text-muted);
          font: 600 9px var(--font-af-body), Montserrat, sans-serif;
          letter-spacing: .18em;
        }

        .af-products-card-title {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 12px;
        }

        .af-products-card-title h3 {
          font: 600 clamp(20px, 2vw, 27px)/1.2
            var(--font-af-heading), Saira, sans-serif;
        }

        .af-products-card-title > span {
          color: var(--af-text-primary);
          font: 500 14px var(--font-af-button), Inter, sans-serif;
          white-space: nowrap;
        }

        .af-products-finish-name {
          margin-top: 12px;
          min-height: 38px;
          color: var(--af-text-secondary);
          font: 400 12px/1.6
            var(--font-af-body), Montserrat, sans-serif;
        }

        .af-products-swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 18px 0 25px;
        }

        .af-products-swatch {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border: 1px solid transparent;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
        }

        .af-products-swatch span {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--swatch);
          border: 1px solid var(--af-border-strong);
        }

        .af-products-swatch.is-active {
          border-color: var(--accent);
        }

        .af-products-explore {
          margin-top: auto;
          min-height: 46px;
          padding: 12px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          border: 1px solid var(--af-button-bg);
          border-radius: 9px;
          color: var(--af-button-text);
          background: var(--af-button-bg);
          font: 600 12px var(--font-af-button), Inter, sans-serif;
          cursor: pointer;
        }

        .af-products-explore:hover:not(:disabled) {
          background: var(--af-button-hover-bg);
          border-color: var(--af-text-primary);
        }

        .af-products-explore:disabled,
        .af-products-swatch:disabled {
          opacity: .5;
          cursor: wait;
        }

        .af-products-unavailable {
          margin-top: auto;
          color: var(--af-accent);
          font: 600 11px var(--font-af-button), Inter, sans-serif;
        }

        .af-products-footnote {
          margin-top: 28px;
          color: var(--af-text-muted);
          font-size: 11px;
          line-height: 1.7;
        }

        .af-products :is(button):focus-visible {
          outline: 2px solid var(--af-focus-ring);
          outline-offset: 4px;
        }

        .af-cinematic-layer {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 1;
          transition:
            opacity 720ms cubic-bezier(.22,1,.36,1);
        }

        .af-cinematic-layer.is-exiting {
          opacity: 0;
          visibility: hidden;
          transition:
            opacity 720ms cubic-bezier(.22,1,.36,1),
            visibility 0s linear 720ms;
        }

        /*
         * Banner-only 3D visibility.
         *
         * Different from the permanent exit
         * used by the Products section.
         */
        .af-cinematic-layer.is-banner-hidden {
          opacity: 0;
          visibility: hidden;
          transition:
            opacity 620ms cubic-bezier(.22,1,.36,1),
            visibility 0s linear 620ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .af-cinematic-layer.is-banner-hidden {
            transition: none;
          }
        }

        @media (max-width: 1040px) {
          .af-products-grid {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }
        }

        @media (max-width: 700px) {
          .af-products-grid {
            grid-template-columns: 1fr;
          }

          .af-products-intro {
            margin-bottom: 34px;
          }

          .af-products-finish-preview {
            min-height: 190px;
          }

          .af-products {
            padding-block: 72px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .af-cinematic-layer,
          .af-cinematic-layer.is-exiting {
            transition: none;
          }
        }

        /* Keep hover borders aligned with theme colors */
        .af-products-explore:hover:not(:disabled) {
          border-color: var(--af-button-hover-bg);
        }
      `}</style>
    </section>
  );
}

/* af-site-closing-theme-v2 */
function SiteClosingSections({
  activeFamilyId,
  transitioning,
  onFamilySelect,
}) {
  const [newsletterStatus, setNewsletterStatus] = useState("");

  const bodyFont =
    "var(--font-af-body), Montserrat, sans-serif";

  const headingFont =
    "var(--font-af-heading), Saira, sans-serif";

  const buttonFont =
    "var(--font-af-button), Inter, sans-serif";

  const muted = "var(--af-text-secondary)";
  const white = "var(--af-text-primary)";
  const gold = "var(--af-accent)";

  const container = {
    width: "calc(100% - var(--af-page-gutter) - var(--af-page-gutter))", maxWidth: "var(--af-container-max)",
    marginInline: "auto",
  };

  function handleSubscribe(event) {
    event.preventDefault();

    setNewsletterStatus(
      "Newsletter preview only. Subscriptions are not enabled yet; no email was saved."
    );
  }

  return (
    <div
      style={{
        position: "relative",
        zIndex: 6,
        isolation: "isolate",
        background: "var(--af-background)",
        color: white,
      }}
    >
      {/* NEWSLETTER */}

      <section
        id="newsletter"
        aria-labelledby="newsletter-heading"
        style={{
          paddingBlock: "clamp(80px, 10vw, 145px)",
          borderTop: "1px solid var(--af-border)",
          borderBottom: "1px solid var(--af-border)",
          background:
            "linear-gradient(120deg, var(--af-surface), var(--af-background))",
        }}
      >
        <div
          style={{
            ...container,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            alignItems: "end",
            gap: "clamp(32px, 6vw, 90px)",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                marginBottom: 20,
                color: gold,
                fontFamily: bodyFont,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.2em",
              }}
            >
              STAY IN FREQUENCY
            </span>

            <h2
              id="newsletter-heading"
              style={{
                margin: 0,
                color: white,
                fontFamily: headingFont,
                fontSize: "clamp(40px, 6vw, 80px)",
                fontWeight: 600,
                lineHeight: 1.08,
                letterSpacing: "-0.045em",
              }}
            >
              A quieter kind
              <br />
              of update.
            </h2>

            <p
              style={{
                maxWidth: 460,
                marginTop: 22,
                color: muted,
                fontFamily: bodyFont,
                fontSize: 13,
                lineHeight: 1.85,
              }}
            >
              Product announcements, design notes,
              and stories from behind the sound.
              Only the essentials.
            </p>
          </div>

          <div style={{ minWidth: 0 }}>
            <form
              onSubmit={handleSubscribe}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "stretch",
                gap: 10,
              }}
            >
              <label
                htmlFor="af-newsletter-email"
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clipPath: "inset(50%)",
                }}
              >
                Email address
              </label>

              <input
                id="af-newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Your email address"
                style={{
                  flex: "1 1 210px",
                  minWidth: 0,
                  minHeight: 54,
                  padding: "14px 17px",
                  border: "1px solid var(--af-border-strong)",
                  borderRadius: 9,
                  background: "var(--af-input-bg)",
                  color: white,
                  fontFamily: bodyFont,
                  fontSize: 13,
                }}
              />

              <button
                type="submit"
                data-af-cursor="interactive"
                style={{
                  flex: "0 1 140px",
                  minHeight: 54,
                  padding: "12px 18px",
                  border: 0,
                  borderRadius: 9,
                  background: "var(--af-button-bg)",
                  color: "var(--af-button-text)",
                  fontFamily: buttonFont,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Subscribe ↗
              </button>
            </form>

            <p
              role="status"
              aria-live="polite"
              style={{
                marginTop: 14,
                color: muted,
                fontFamily: bodyFont,
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              {newsletterStatus ||
                "Newsletter preview · Signup service coming soon"}
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer
        id="site-footer"
        style={{
          padding: "clamp(70px, 8vw, 110px) 0 28px",
          background: "var(--af-background)",
        }}
      >
        <div
          style={{
            ...container,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
            gap: "clamp(32px, 5vw, 70px)",
          }}
        >
          {/* Brand */}

          <div>
            <a
              href="#hero"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 13,
                color: white,
                fontFamily: headingFont,
                fontSize: 20,
                fontWeight: 650,
                letterSpacing: "0.04em",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 34,
                  height: 34,
                  border: `1.5px solid ${gold}`,
                  borderRadius: 9,
                  color: gold,
                  fontSize: 16,
                }}
              >
                A
              </span>

              AURAL FORGE
            </a>

            <p
              style={{
                marginTop: 22,
                color: muted,
                fontFamily: bodyFont,
                fontSize: 12,
                lineHeight: 1.9,
              }}
            >
              Sound, sculpted.
              <br />
              Designed to be experienced.
            </p>
          </div>

          {/* Products */}

          <nav
            aria-label="Footer product navigation"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 15,
            }}
          >
            <h3
              style={{
                marginBottom: 8,
                fontFamily: headingFont,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Products
            </h3>

            {HEADER_FAMILIES.map(({ id, label }) => {
              const ready = isProductFamilyReady(id);
              const selected = activeFamilyId === id;

              return (
                <button
                  type="button"
                  key={id}
                  disabled={!ready || transitioning}
                  aria-pressed={selected}
                  onClick={() => onFamilySelect(id)}
                  data-af-cursor="interactive"
                  style={{
                    padding: 0,
                    border: 0,
                    background: "transparent",
                    color: selected ? gold : muted,
                    fontFamily: bodyFont,
                    fontSize: 14,
                    textAlign: "left",
                    cursor: ready ? "pointer" : "not-allowed",
                    opacity: ready ? 1 : 0.65,
                  }}
                >
                  {label}
                  {!ready && (
                    <span
                      style={{
                        marginLeft: 8,
                        color: "var(--af-accent)",
                        fontSize: 10,
                      }}
                    >
                      SOON
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Site links */}

          <nav
            aria-label="Footer site navigation"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 15,
            }}
          >
            <h3
              style={{
                marginBottom: 8,
                fontFamily: headingFont,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Explore
            </h3>

            {[
              ["The Experience", "#hero"],
              ["The Collection", "#products"],
              ["Newsletter", "#newsletter"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                style={{
                  color: muted,
                  fontFamily: bodyFont,
                  fontSize: 14,
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Statement */}

          <div>
            <h3
              style={{
                marginBottom: 23,
                fontFamily: headingFont,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Our philosophy
            </h3>

            <p
              style={{
                color: muted,
                fontFamily: bodyFont,
                fontSize: 12,
                lineHeight: 1.9,
              }}
            >
              Considered form.
              <br />
              Immersive sound.
              <br />
              No unnecessary noise.
            </p>
          </div>
        </div>

        <div
          style={{
            ...container,
            marginTop: 85,
            paddingTop: 24,
            borderTop: "1px solid var(--af-border)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 15,
            color: "var(--af-text-muted)",
            fontFamily: bodyFont,
            fontSize: 10,
          }}
        >
          <span>
            © {new Date().getFullYear()} Aural Forge.
            All rights reserved.
          </span>

          <span>
            A concept product experience.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function ExperienceRuntime() {
  /*
   * af-banner-emergence-dom-v1
   *
   * Preserve the original Canvas JSX and
   * IntersectionObserver.
   *
   * ScrollTrigger owns visual presentation
   * only while the banner is in view.
   */

  useEffect(() => {
    const banner = document.getElementById(
      "product-parallax-banner"
    );

    const layer = document.querySelector(
      ".af-cinematic-layer"
    );

    if (!banner || !layer) return;

    gsap.registerPlugin(ScrollTrigger);

    const previousTransition = layer.style.transition;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const restore = () => {
      gsap.set(layer, {
        clearProps: "opacity,visibility,transform",
      });

      layer.style.transition = previousTransition;
    };

    const update = () => {
      const rect = banner.getBoundingClientRect();
      const viewport = Math.max(1, window.innerHeight);

      if (rect.top >= viewport || rect.bottom <= 0) {
        restore();
        return;
      }

      // Suppress the old CSS fade only during
      // GSAP's scroll-controlled presentation.
      layer.style.transition = "none";

      const fadeOut = gsap.utils.clamp(
        0,
        1,
        (rect.top - viewport * 0.62) /
          (viewport * 0.38)
      );

      const fadeIn = gsap.utils.clamp(
        0,
        1,
        (viewport * 0.92 - rect.bottom) /
          (viewport * 0.85)
      );

      const progress = Math.max(fadeOut, fadeIn);

      const opacity = reducedMotion.matches
        ? (
            rect.top > viewport * 0.62 ||
            rect.bottom < viewport * 0.6
              ? 1
              : 0
          )
        : progress;

      gsap.set(layer, {
        opacity,

        visibility:
          opacity <= 0.001 ? "hidden" : "visible",

        y: reducedMotion.matches
          ? 0
          : (1 - progress) *
            Math.min(85, viewport * 0.09),

        scale: reducedMotion.matches
          ? 1
          : 0.97 + progress * 0.03,
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: banner,
      start: "top bottom",
      end: "bottom top",
      invalidateOnRefresh: true,

      onEnter: update,
      onEnterBack: update,
      onUpdate: update,
      onRefresh: update,
      onLeave: restore,
      onLeaveBack: restore,
    });

    const handleMotionChange = () => update();

    reducedMotion.addEventListener(
      "change",
      handleMotionChange
    );

    update();

    return () => {
      trigger.kill();

      reducedMotion.removeEventListener(
        "change",
        handleMotionChange
      );

      restore();
    };
  }, []);

  const [activeFamilyId, setActiveFamilyId] = useState(
    DEFAULT_PRODUCT_FAMILY_ID
  );

  const [
    selectedVariantsByFamily,
    setSelectedVariantsByFamily,
  ] = useState(() => ({
    [DEFAULT_PRODUCT_FAMILY_ID]:
      getProductFamily(DEFAULT_PRODUCT_FAMILY_ID).defaultVariantId,
  }));

  const [
    activeProductState,
    setActiveProductState,
  ] = useState("neutral");

  const [
    acousticRevealActive,
    setAcousticRevealActive,
  ] = useState(false);

  const [
    choreographyActive,
    setChoreographyActive,
  ] = useState(false);

  const [transitionPlan, setTransitionPlan] = useState(null);

  const [transitionPhase, setTransitionPhase] = useState(
    FAMILY_TRANSITION_PHASES.IDLE
  );

  const [familyTransitionActive, setFamilyTransitionActive] =
    useState(false);

  const [readyFamilyId, setReadyFamilyId] = useState(null);
  const [shoppingActive, setShoppingActive] = useState(false);
  const [bannerActive, setBannerActive] = useState(false);

  // Keep the shared 3D scene mounted.
  // Fade its presentation when the Products section takes over.
  useEffect(() => {
    const boundary = document.getElementById("products");

    if (!boundary) return;

    let frame = 0;

    const update = () => {
      frame = 0;

      const next =
        boundary.getBoundingClientRect().top <=
        window.innerHeight * 0.82;

      setShoppingActive((current) =>
        current === next ? current : next
      );
    };

    const schedule = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();

    window.addEventListener("scroll", schedule, {
      passive: true,
    });

    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  /*
   * Product-specific parallax banner boundary.
   *
   * Hide the persistent cinematic Canvas while
   * an image banner occupies the viewport.
   *
   * Keep the Canvas mounted so the existing
   * scroll choreography and model state survive.
   *
   * The banner will use:
   * id="product-parallax-banner"
   */
  useEffect(() => {
    const banner = document.getElementById(
      "product-parallax-banner"
    );

    if (!banner) return;

    if (
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setBannerActive(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "-40px 0px -40px 0px",
        threshold: 0,
      }
    );

    observer.observe(banner);

    return () => {
      observer.disconnect();
    };
  }, []);

  const stageMotionRef = useRef(null);
  const headerNavigationRef = useRef(null);

  const activeFamily = getProductFamily(activeFamilyId);

  const selectedVariantId =
    getProductFamilyVariant(
      activeFamilyId,
      selectedVariantsByFamily[activeFamilyId]
    )?.id ?? activeFamily.defaultVariantId;

  const handleVariantChange = useCallback(
    (nextVariantId) => {
      if (transitionPlan) return;

      const variant = getProductFamilyVariant(
        activeFamilyId,
        nextVariantId
      );

      if (!variant || variant.id !== nextVariantId) {
        return;
      }

      setSelectedVariantsByFamily((previous) => ({
        ...previous,
        [activeFamilyId]: nextVariantId,
      }));
    },
    [activeFamilyId, transitionPlan]
  );

  const handleCollectionVariantChange = useCallback(
    (familyId, nextVariantId) => {
      if (
        transitionPlan ||
        !isProductFamilyReady(familyId)
      ) {
        return;
      }

      const variant = getProductFamilyVariant(
        familyId,
        nextVariantId
      );

      if (!variant || variant.id !== nextVariantId) {
        return;
      }

      setSelectedVariantsByFamily((previous) => ({
        ...previous,
        [familyId]: nextVariantId,
      }));
    },
    [transitionPlan]
  );

  const handleFamilyChange = useCallback(
    (nextFamilyId) => {
      if (
        transitionPlan ||
        nextFamilyId === activeFamilyId ||
        !isProductFamilyReady(nextFamilyId)
      ) {
        return false;
      }

      const nextFamily = getProductFamily(nextFamilyId);

      if (
        !nextFamily.defaultVariantId ||
        nextFamily.variants.length === 0
      ) {
        return false;
      }

      const plan = createFamilyTransitionPlan({
        fromFamilyId: activeFamilyId,
        toFamilyId: nextFamilyId,
        selectedVariantsByFamily,
      });

      if (!plan) return false;

      setSelectedVariantsByFamily((previous) => {
        const saved = previous[nextFamilyId];

        if (
          getProductFamilyVariant(
            nextFamilyId,
            saved
          )?.id === saved
        ) {
          return previous;
        }

        return {
          ...previous,
          [nextFamilyId]:
            nextFamily.defaultVariantId,
        };
      });

      setTransitionPlan(plan);
      return true;
    },
    [
      activeFamilyId,
      selectedVariantsByFamily,
      transitionPlan,
    ]
  );

  const handleHeaderFamilyChange = useCallback(
    (nextFamilyId) => {
      if (transitionPlan) return;

      if (nextFamilyId === activeFamilyId) {
        navigateToHero();
        return;
      }

      if (handleFamilyChange(nextFamilyId)) {
        headerNavigationRef.current =
          nextFamilyId;
      }
    },
    [
      transitionPlan,
      activeFamilyId,
      handleFamilyChange,
    ]
  );

  const selectProductState = useCallback(
    (stateName) => {
      resolveProductState(stateName);
      setActiveProductState(stateName);
    },
    []
  );

  const handleStoryStateChange = useCallback(
    (storyState) => {
      if (familyTransitionActive) return;

      selectProductState(storyState.productState);

      setAcousticRevealActive(
        storyState.acousticRevealActive
      );
    },
    [
      familyTransitionActive,
      selectProductState,
    ]
  );

  const handleStageReady = useCallback(
    (familyId) => {
      setReadyFamilyId(familyId);
    },
    []
  );

  const handleStageUnavailable = useCallback(
    (familyId) => {
      setReadyFamilyId((current) =>
        current === familyId ? null : current
      );

      if (
        stageMotionRef.current?.familyId === familyId
      ) {
        stageMotionRef.current = null;
      }
    },
    []
  );

  const handleStageMotionRegistration = useCallback(
    (familyId, api) => {
      if (!api) {
        if (
          stageMotionRef.current?.familyId === familyId
        ) {
          stageMotionRef.current = null;
        }

        return;
      }

      stageMotionRef.current = {
        familyId,
        ...api,
      };
    },
    []
  );

  const handleReleaseScrollOwnership = useCallback(
    () => {
      setFamilyTransitionActive(true);
    },
    []
  );

  const handleExitProgress = useCallback(
    (progress, outgoing, plan) => {
      const stage = stageMotionRef.current;

      if (
        stage?.familyId !== plan.fromFamilyId
      ) {
        return;
      }

      stage.exit?.(
        progress,
        outgoing,
        plan
      );
    },
    []
  );

  const handleSwapScene = useCallback(
    (incoming) => {
      setReadyFamilyId(null);
      setActiveFamilyId(incoming.familyId);
    },
    []
  );

  const handleEnterProgress = useCallback(
    (progress, incoming, plan) => {
      const stage = stageMotionRef.current;

      if (
        stage?.familyId !== plan.toFamilyId
      ) {
        return;
      }

      stage.enter?.(
        progress,
        incoming,
        plan
      );
    },
    []
  );

  const handleTransitionComplete = useCallback(
    (completedPlan) => {
      setTransitionPlan(null);
      setFamilyTransitionActive(false);

      setTransitionPhase(
        FAMILY_TRANSITION_PHASES.IDLE
      );

      if (
        completedPlan &&
        headerNavigationRef.current ===
          completedPlan.toFamilyId
      ) {
        headerNavigationRef.current = null;

        window.requestAnimationFrame(
          navigateToHero
        );
      }
    },
    []
  );

  return (
    <>
      <ScrollStoryController
        onStoryStateChange={handleStoryStateChange}
      />

      <PremiumHeader
        familyId={activeFamilyId}
        transitioning={Boolean(transitionPlan)}
        onSelectFamily={handleHeaderFamilyChange}
      />

      <div
        className={[
          "af-cinematic-layer",
          shoppingActive ? "is-exiting" : "",
          bannerActive ? "is-banner-hidden" : "",
        ].filter(Boolean).join(" ")}
        aria-hidden={shoppingActive || bannerActive}
      >
        <ExperienceCanvas
          familyId={activeFamilyId}
          variantId={selectedVariantId}
          activeProductState={activeProductState}
          acousticRevealActive={acousticRevealActive}
          choreographyActive={choreographyActive}
          familyTransitionActive={familyTransitionActive}
          onChoreographyActiveChange={setChoreographyActive}
          onStageReady={handleStageReady}
          onStageUnavailable={handleStageUnavailable}
          onStageMotionRegistration={handleStageMotionRegistration}
        />
      </div>

      <StorySections
        familyId={activeFamilyId}
        variantId={selectedVariantId}
        onFamilyChange={handleFamilyChange}
        onVariantChange={handleVariantChange}
      />

      <ProductsSection
        selectedVariantsByFamily={selectedVariantsByFamily}
        onVariantChange={handleCollectionVariantChange}
        onExplore={handleHeaderFamilyChange}
        transitioning={Boolean(transitionPlan)}
      />

      <SiteClosingSections
        activeFamilyId={activeFamilyId}
        transitioning={Boolean(transitionPlan)}
        onFamilySelect={handleHeaderFamilyChange}
      />

      <ExperienceCursor />

      <ProductFamilyTransitionController
        plan={transitionPlan}
        readyFamilyId={readyFamilyId}
        onPhaseChange={setTransitionPhase}
        onReleaseScrollOwnership={handleReleaseScrollOwnership}
        onExitProgress={handleExitProgress}
        onSwapScene={handleSwapScene}
        onEnterProgress={handleEnterProgress}
        onComplete={handleTransitionComplete}
      />
    </>
  );
}












