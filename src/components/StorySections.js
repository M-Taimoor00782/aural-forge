"use client";

import { useState } from "react";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyVariant,
  getProductFamilyWorld,
  getReadyProductFamilies,
} from "@/config/productFamilies";

import styles from "./StorySections.module.css";

// Shared UI tokens. Family worlds and finish
// colors remain controlled by their own configs.
const UI = {
  text: "var(--af-bright-white, #F3F3F4)",
  muted: "var(--af-text-secondary, #ADB3BA)",
  subtle: "var(--af-slate-grey, #7D868C)",
  gold: "var(--af-golden-sand, #F6B54E)",
  terracotta: "var(--af-terracotta, #C3783A)",
  charcoal: "var(--af-deep-charcoal, #0D0D0D)",
  elevated: "var(--af-surface-elevated, #25202B)",
  border: "var(--af-border, rgba(243,243,244,0.13))",
  borderStrong: "var(--af-border-strong, rgba(243,243,244,0.23))",
  bodyFont: "var(--font-af-body), Montserrat, sans-serif",
  headingFont: "var(--font-af-heading), Saira, sans-serif",
  buttonFont: "var(--font-af-button), Inter, sans-serif",
};

function getFamilyAccent(familyId) {
  return familyId === "earbuds"
    ? UI.terracotta
    : UI.gold;
}

function ProductFamilySwitcher({
  familyId,
  onFamilyChange,
  compact = false,
}) {
  const families = getReadyProductFamilies();
  const activeFamily = getProductFamily(familyId);

  if (families.length < 2) return null;

  return (
    <div
      aria-label="Explore Aural Forge products"
      style={{
        position: "relative",
        zIndex: 10,
        width: "min(100%, 460px)",
        marginTop: compact ? 0 : 28,
        marginBottom: compact ? 20 : 0,
        pointerEvents: "auto",
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontFamily: UI.bodyFont,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: UI.muted,
        }}
      >
        Explore the collection
      </p>

      <div
        role="group"
        aria-label="Choose a product family"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {families.map((family) => {
          const selected =
            family.id === activeFamily.id;

          const familyAccent =
            getFamilyAccent(family.id);

          return (
            <button
              key={family.id}
              type="button"
              aria-pressed={selected}
              aria-label={`View ${family.label}`}
              onClick={() => {
                if (!selected) {
                  onFamilyChange?.(family.id);
                }
              }}
              data-af-cursor="interactive"
              style={{
                flex: "1 1 150px",
                minWidth: 0,
                minHeight: 54,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: `1px solid ${
                  selected
                    ? familyAccent
                    : UI.borderStrong
                }`,
                borderRadius: 11,
                background: selected
                  ? family.id === "earbuds"
                    ? "rgba(195,120,58,0.14)"
                    : "rgba(246,181,78,0.11)"
                  : "rgba(26,22,33,0.94)",
                color: UI.text,
                cursor: selected
                  ? "default"
                  : "pointer",
                fontFamily: UI.buttonFont,
                fontSize: 12,
                fontWeight: selected ? 600 : 500,
                textAlign: "left",
                outlineOffset: 4,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                transition:
                  "border-color 180ms ease, background-color 180ms ease",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  color: selected
                    ? familyAccent
                    : UI.subtle,
                  fontSize: 11,
                  fontFamily: UI.buttonFont,
                }}
              >
                {family.number}
              </span>

              <span style={{ flex: 1 }}>
                {family.label}
              </span>

              {selected && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: familyAccent,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {!compact && (
        <p
          role="status"
          aria-live="polite"
          style={{
            margin: "10px 0 0",
            color: UI.muted,
            fontFamily: UI.bodyFont,
            fontSize: 11,
          }}
        >
          Viewing {activeFamily.label}
        </p>
      )}
    </div>
  );
}

export default function StorySections({
  familyId = DEFAULT_PRODUCT_FAMILY_ID,
  variantId,
  onFamilyChange,
  onVariantChange,
}) {
  const family = getProductFamily(familyId);
  const isEarbuds = family.id === "earbuds";

  return (
    <main className={styles.story}>
      {/* 01 — Product Arrival */}
      <section
        id="hero"
        className={styles.section}
        aria-labelledby="hero-heading"
      >
        <div
          className={`${styles.content} ${styles.left}`}
        >
          <span className={styles.eyebrow}>
            01 / The Arrival
          </span>

          <h1
            id="hero-heading"
            className={styles.heading}
          >
            Sound,
            <br />
            sculpted.
          </h1>

          <p className={styles.description}>
            Meet Aural Forge. A new perspective on
            personal audio, where considered design
            meets an immersive listening experience.
          </p>

          <ProductFamilySwitcher
            familyId={familyId}
            onFamilyChange={onFamilyChange}
          />
        </div>
      </section>

      {/* 02 — Performance */}
      <section
        id="performance"
        className={styles.section}
        aria-labelledby="performance-heading"
      >
        <div
          className={`${styles.content} ${styles.right}`}
        >
          <span className={styles.eyebrow}>
            02 / Performance
          </span>

          <h2
            id="performance-heading"
            className={styles.heading}
          >
            Feel every
            <br />
            layer.
          </h2>

          <p className={styles.description}>
            Music is more than what you hear. It is
            depth, texture, and detail — a world
            waiting to be explored.
          </p>
        </div>
      </section>

      {/* 03 — Detail & Craft */}
      <section
        id="detail"
        className={styles.section}
        aria-labelledby="detail-heading"
      >
        <div
          className={`${styles.content} ${styles.right}`}
        >
          <span className={styles.eyebrow}>
            03 / The Details
          </span>

          <h2
            id="detail-heading"
            className={styles.heading}
          >
            Crafted
            <br />
            to matter.
          </h2>

          <p className={styles.description}>
            {isEarbuds
              ? "From the charging case to the sculpted earbuds, every surface is designed with precision and purpose."
              : "From the metallic finish to the sculpted ear cushions, every surface contributes to a distinctive product identity."}
          </p>
        </div>
      </section>

      {/* 04 — Acoustic / Mechanical Reveal */}
      <section
        id="acoustic-reveal"
        className={styles.section}
        aria-labelledby="reveal-heading"
      >
        <div
          className={`${styles.content} ${styles.left}`}
        >
          <span className={styles.eyebrow}>
            04 / Inside the Design
          </span>

          <h2
            id="reveal-heading"
            className={styles.heading}
          >
            Beyond
            <br />
            the surface.
          </h2>

          <p className={styles.description}>
            {isEarbuds
              ? "Discover the details of the charging case as its lid opens and the earbuds emerge."
              : "Look closer as the earcup layers separate, revealing the construction behind the assembled form."}
          </p>
        </div>
      </section>

      {/* 05 — Family-aware Configurator */}
      <section
        id="configurator"
        className={styles.section}
        aria-labelledby="configurator-heading"
      >
        <div
          className={`${styles.content} ${styles.right}`}
        >
          <span className={styles.eyebrow}>
            05 / Choose Your Style
          </span>

          <h2
            id="configurator-heading"
            className={styles.heading}
          >
            Make it
            <br />
            yours.
          </h2>

          <p className={styles.description}>
            One distinctive design. A personal
            expression. Find the finish that defines
            your style.
          </p>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "min(100%, 460px)",
            pointerEvents: "auto",
          }}
        >
          <ProductFamilySwitcher
            familyId={familyId}
            onFamilyChange={onFamilyChange}
            compact
          />

          <VariantConfigurator
            key={family.id}
            family={family}
            variantId={variantId}
            onVariantChange={onVariantChange}
          />
        </div>
      </section>

      {/* 06 — Cinematic Finale */}
      <section
        id="finale"
        className={styles.section}
        aria-labelledby="finale-heading"
      >
        <div
          className={`${styles.content} ${styles.left}`}
        >
          <span className={styles.eyebrow}>
            06 / Aural Forge
          </span>

          <h2
            id="finale-heading"
            className={styles.heading}
          >
            Hear
            <br />
            differently.
          </h2>

          <p className={styles.description}>
            More than a listening device. A statement
            of form, presence, and personal sound.
          </p>
        </div>
      </section>
    </main>
  );
}

function VariantConfigurator({
  family,
  variantId,
  onVariantChange,
}) {
  const [addedVariantId, setAddedVariantId] =
    useState(null);

  const selected = getProductFamilyVariant(
    family.id,
    variantId
  );

  if (!selected) return null;

  const familyAccent = getFamilyAccent(
    family.id
  );

  const selectedName =
    selected.name ??
    selected.label ??
    selected.id;

  const added = addedVariantId === selected.id;

  const price =
    typeof selected.price === "number" &&
    Number.isFinite(selected.price)
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: selected.currency ?? "USD",
          maximumFractionDigits: 0,
        }).format(selected.price)
      : null;

  return (
    <div
      aria-label={`${family.label} finish configurator`}
      style={{
        position: "relative",
        zIndex: 3,
        width: "100%",
        boxSizing: "border-box",
        padding: "clamp(20px, 3vw, 32px)",
        border: `1px solid ${UI.border}`,
        borderRadius: 18,
        background: "rgba(26,22,33,0.96)",
        color: UI.text,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 12px",
              color: UI.gold,
              fontFamily: UI.bodyFont,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Configure / {family.number}
          </p>

          <h3
            style={{
              margin: 0,
              fontFamily: UI.headingFont,
              fontSize: "clamp(23px, 3vw, 30px)",
              fontWeight: 600,
              letterSpacing: "-0.035em",
              lineHeight: 1.2,
              color: UI.text,
            }}
          >
            Choose your finish
          </h3>

          <p
            style={{
              margin: "9px 0 0",
              color: UI.muted,
              fontFamily: UI.bodyFont,
              fontSize: 11,
            }}
          >
            {family.label}
          </p>
        </div>

        {price && (
          <strong
            style={{
              fontFamily: UI.buttonFont,
              fontSize: 21,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: UI.text,
            }}
          >
            {price}
          </strong>
        )}
      </div>

      <div
        role="group"
        aria-label={`Available ${family.label} finishes`}
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 125px), 1fr))",
          gap: 10,
          marginTop: 26,
        }}
      >
        {family.variants.map((variant) => {
          const isSelected =
            variant.id === selected.id;

          const variantName =
            variant.name ??
            variant.label ??
            variant.id;

          const variantWorld =
            getProductFamilyWorld(
              family.id,
              variant.id
            );

          const swatch =
            typeof variant.swatch === "string"
              ? variant.swatch
              : variantWorld.palette.accent;

          return (
            <button
              key={variant.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Select ${variantName} finish`}
              data-af-cursor="interactive"
              onClick={() => {
                onVariantChange?.(variant.id);
                setAddedVariantId(null);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: 10,
                minHeight: 83,
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${
                  isSelected
                    ? familyAccent
                    : UI.borderStrong
                }`,
                background: isSelected
                  ? "rgba(246,181,78,0.10)"
                  : "rgba(13,13,13,0.55)",
                color: UI.text,
                cursor: "pointer",
                fontFamily: UI.buttonFont,
                fontSize: 12,
                textAlign: "left",
                outlineOffset: 3,
                transition:
                  "border-color 180ms ease, background-color 180ms ease",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: swatch,
                  border:
                    "2px solid rgba(243,243,244,0.25)",
                  boxShadow: isSelected
                    ? `0 0 0 2px ${familyAccent}`
                    : "none",
                }}
              />

              <span>{variantName}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: `1px solid ${UI.border}`,
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontFamily: UI.bodyFont,
            fontWeight: 600,
            fontSize: 15,
            color: UI.text,
          }}
        >
          {selectedName}
        </p>

        <p
          style={{
            margin: "0 0 22px",
            color: UI.muted,
            fontFamily: UI.bodyFont,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {selected.description ??
            `Explore the ${selectedName} finish.`}
        </p>

        <button
          type="button"
          data-af-cursor="interactive"
          onClick={() => {
            setAddedVariantId(selected.id);
          }}
          style={{
            width: "100%",
            minHeight: 48,
            padding: "12px 20px",
            border: `1px solid ${
              added ? UI.borderStrong : "transparent"
            }`,
            borderRadius: 8,
            background: added
              ? UI.elevated
              : UI.gold,
            color: added
              ? UI.text
              : UI.charcoal,
            fontFamily: UI.buttonFont,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            outlineOffset: 3,
            transition:
              "background-color 180ms ease, color 180ms ease",
          }}
        >
          {added
            ? "Added to Demo Bag"
            : selected.ctaLabel ??
              "Add to Demo Bag"}
        </button>

        <p
          role="status"
          aria-live="polite"
          style={{
            minHeight: 18,
            margin: "12px 0 0",
            color: UI.muted,
            fontFamily: UI.bodyFont,
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {added
            ? `${selectedName} selected for your demo bag.`
            : "Interactive 3D product preview · Demo checkout only"}
        </p>
      </div>
    </div>
  );
}
