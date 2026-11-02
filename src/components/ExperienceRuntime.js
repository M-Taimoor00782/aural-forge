"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

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
import ProductWorldBackdrop from "./ProductWorldBackdrop";
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

function PremiumHeader({
  familyId,
  transitioning,
  onSelectFamily,
}) {
  return (
    <header className="af-site-header">
      <div className="af-site-header-inner">
        <a
          href="#hero"
          className="af-site-brand"
          aria-label="Aural Forge — return to the hero"
          onClick={(event) => {
            event.preventDefault();
            navigateToHero();
          }}
        >
          <span className="af-site-mark" aria-hidden="true">
            <span className="af-site-mark-core" />
          </span>
          <span className="af-site-brand-copy">
            <span className="af-site-wordmark">AURAL FORGE</span>
            <span className="af-site-brand-caption">PERSONAL AUDIO</span>
          </span>
        </a>

        <nav
          className="af-site-navigation"
          aria-label="Product families"
        >
          {HEADER_FAMILIES.map(({ id, label }) => {
            const ready = isProductFamilyReady(id);
            const selected = familyId === id;

            return (
              <button
                type="button"
                key={id}
                className={`af-site-nav-button${selected ? " is-selected" : ""}${id === "earbuds" ? " is-earbuds" : ""}`}
                aria-pressed={selected}
                aria-label={
                  ready ? `Explore ${label}` : `${label} — coming soon`
                }
                title={ready ? label : `${label} — coming soon`}
                disabled={!ready || transitioning}
                onClick={() => onSelectFamily(id)}
                data-af-cursor="interactive"
              >
                <span>{label}</span>
                {!ready && (
                  <span className="af-site-soon">Soon</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <style>{`
        .af-site-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 70;
          padding: 18px clamp(20px, 4.5vw, 76px) 0;
          pointer-events: none;
        }
        .af-site-header-inner {
          max-width: 1540px;
          min-height: 66px;
          margin-inline: auto;
          padding: 10px clamp(13px, 2.2vw, 28px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          border: 1px solid rgba(243, 243, 244, 0.12);
          border-radius: 16px;
          background: rgba(13, 13, 13, 0.8);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
          -webkit-backdrop-filter: blur(18px);
          backdrop-filter: blur(18px);
          pointer-events: auto;
        }
        .af-site-brand {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          gap: 13px;
          min-height: 44px;
          color: #F3F3F4;
          text-decoration: none;
          border-radius: 8px;
        }
        .af-site-mark {
          width: 33px;
          height: 33px;
          display: grid;
          place-items: center;
          border: 1.5px solid #F6B54E;
          border-radius: 9px;
          transform: rotate(-15deg);
        }
        .af-site-mark-core {
          width: 15px;
          height: 15px;
          border-top: 2px solid #F6B54E;
          border-right: 2px solid #F6B54E;
          border-radius: 3px;
        }
        .af-site-brand-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .af-site-wordmark {
          font-family: var(--font-af-heading), Saira, sans-serif !important;
          font-size: 18px;
          font-weight: 650;
          letter-spacing: 0.045em;
          line-height: 1;
          white-space: nowrap;
        }
        .af-site-brand-caption {
          font-family: var(--font-af-body), Montserrat, sans-serif !important;
          color: #ADB3BA;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.24em;
          line-height: 1.4;
          white-space: nowrap;
        }
        .af-site-navigation {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: clamp(4px, 1vw, 12px);
          min-width: 0;
        }
        .af-site-nav-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 40px;
          padding: 9px clamp(10px, 1.4vw, 19px);
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: #ADB3BA;
          font-family: var(--font-af-button), Inter, sans-serif;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.2;
          white-space: nowrap;
          cursor: pointer;
          transition: color 180ms ease, background-color 180ms ease,
            border-color 180ms ease;
        }
        .af-site-nav-button:hover:not(:disabled) {
          color: #F3F3F4;
          background: rgba(243, 243, 244, 0.07);
        }
        .af-site-nav-button.is-selected {
          color: #F6B54E;
          border-color: rgba(246, 181, 78, 0.3);
          background: rgba(246, 181, 78, 0.09);
        }
        .af-site-nav-button.is-selected.is-earbuds {
          color: #C3783A;
          border-color: rgba(195, 120, 58, 0.38);
          background: rgba(195, 120, 58, 0.1);
        }
        .af-site-nav-button:disabled:not(.is-selected) {
          color: #7D868C;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .af-site-nav-button:focus-visible,
        .af-site-brand:focus-visible {
          outline: 2px solid #F6B54E;
          outline-offset: 3px;
        }
        .af-site-soon {
          color: #C3783A;
          font-family: var(--font-af-button), Inter, sans-serif !important;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        @media (max-width: 740px) {
          .af-site-header {
            padding: 10px 12px 0;
          }
          .af-site-header-inner {
            flex-direction: column;
            align-items: stretch;
            gap: 7px;
            padding: 10px 12px;
            border-radius: 13px;
          }
          .af-site-brand {
            min-height: 30px;
            gap: 10px;
          }
          .af-site-mark {
            width: 26px;
            height: 26px;
            border-radius: 7px;
          }
          .af-site-mark-core {
            width: 12px;
            height: 12px;
          }
          .af-site-wordmark {
            font-size: 15px;
          }
          .af-site-brand-caption {
            font-size: 7px;
          }
          .af-site-navigation {
            justify-content: space-between;
            gap: 3px;
            width: 100%;
          }
          .af-site-nav-button {
            flex: 1 1 auto;
            min-width: 0;
            min-height: 35px;
            padding: 7px 4px;
            gap: 4px;
            font-size: clamp(9px, 2.6vw, 11px);
          }
          .af-site-soon {
            font-size: 7px;
          }
          #hero {
            padding-top: 138px !important;
          }
          #hero [aria-label="Explore Aural Forge products"] {
            display: none !important;
          }
        }
        @media (min-width: 741px) and (max-aspect-ratio: 3/4) {
          #hero {
            padding-top: 114px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .af-site-nav-button {
            transition: none;
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

            const accent = family.id === "earbuds"
              ? "#C3783A"
              : "#F6B54E";

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
        .af-products {
          position: relative;
          z-index: 5;
          isolation: isolate;
          min-height: 100svh;
          background: #0D0D0D;
          color: #F3F3F4;
          padding: clamp(78px, 11vw, 160px) clamp(20px, 6vw, 100px);
        }

        .af-products-inner {
          max-width: 1390px;
          margin: 0 auto;
        }

        .af-products-topline {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: space-between;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(243,243,244,.17);
          color: #F6B54E;
          font: 600 10px var(--font-af-body), Montserrat, sans-serif;
          letter-spacing: .19em;
        }

        .af-products-meta {
          color: #7D868C;
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
          color: #ADB3BA;
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
          border: 1px solid rgba(243,243,244,.13);
          background: #1A1621;
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
          color: #7D868C;
          font: 600 9px var(--font-af-body), Montserrat, sans-serif;
          letter-spacing: .14em;
        }

        .af-products-finish-preview {
          min-height: 265px;
          margin: 18px 0 24px;
          position: relative;
          display: grid;
          place-items: center;
          background: #120F17;
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
          color: rgba(243,243,244,.09);
        }

        .af-products-preview-label {
          position: absolute;
          bottom: 16px;
          left: 17px;
          color: #7D868C;
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
          color: #F3F3F4;
          font: 500 14px var(--font-af-button), Inter, sans-serif;
          white-space: nowrap;
        }

        .af-products-finish-name {
          margin-top: 12px;
          min-height: 38px;
          color: #ADB3BA;
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
          border: 1px solid rgba(243,243,244,.34);
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
          border: 1px solid #F6B54E;
          border-radius: 9px;
          color: #0D0D0D;
          background: #F6B54E;
          font: 600 12px var(--font-af-button), Inter, sans-serif;
          cursor: pointer;
        }

        .af-products-explore:hover:not(:disabled) {
          background: #F3F3F4;
          border-color: #F3F3F4;
        }

        .af-products-explore:disabled,
        .af-products-swatch:disabled {
          opacity: .5;
          cursor: wait;
        }

        .af-products-unavailable {
          margin-top: auto;
          color: #C3783A;
          font: 600 11px var(--font-af-button), Inter, sans-serif;
        }

        .af-products-footnote {
          margin-top: 28px;
          color: #7D868C;
          font-size: 11px;
          line-height: 1.7;
        }

        .af-products :is(button):focus-visible {
          outline: 2px solid #F6B54E;
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
      `}</style>
    </section>
  );
}

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

  const muted = "#ADB3BA";
  const white = "#F3F3F4";
  const gold = "#F6B54E";

  const container = {
    width: "min(calc(100% - 40px), 1390px)",
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
        background: "#0D0D0D",
        color: white,
      }}
    >
      {/* NEWSLETTER */}

      <section
        id="newsletter"
        aria-labelledby="newsletter-heading"
        style={{
          paddingBlock: "clamp(80px, 10vw, 145px)",
          borderTop: "1px solid rgba(243,243,244,0.12)",
          borderBottom: "1px solid rgba(243,243,244,0.12)",
          background:
            "linear-gradient(110deg, #151117, #1A1621 55%, #0D0D0D)",
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
                  border: "1px solid rgba(243,243,244,0.2)",
                  borderRadius: 9,
                  background: "rgba(13,13,13,0.75)",
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
                  background: gold,
                  color: "#0D0D0D",
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
          background: "#0D0D0D",
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
                    fontFamily: buttonFont,
                    fontSize: 12,
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
                        color: "#C3783A",
                        fontSize: 9,
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
                  fontFamily: buttonFont,
                  fontSize: 12,
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
            borderTop: "1px solid rgba(243,243,244,0.13)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 15,
            color: "#7D868C",
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

      <ProductWorldBackdrop
        familyId={activeFamilyId}
        variantId={selectedVariantId}
      />

      <PremiumHeader
        familyId={activeFamilyId}
        transitioning={Boolean(transitionPlan)}
        onSelectFamily={handleHeaderFamilyChange}
      />

      <div
        className={`af-cinematic-layer${shoppingActive ? " is-exiting" : ""}`}
        aria-hidden={shoppingActive}
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

