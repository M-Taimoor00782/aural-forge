"use client";

import { useState as useConfiguratorState } from "react";
import {
  PRODUCT_VARIANTS,
  DEFAULT_PRODUCT_VARIANT_ID,
  getProductVariant,
} from "@/config/productVariants";


import styles from "./StorySections.module.css";

export default function StorySections({ variantId = DEFAULT_PRODUCT_VARIANT_ID, onVariantChange }) {
  return (
    <main className={styles.story}>
      {/* 01 — Product Arrival */}
      <section
        id="hero"
        className={styles.section}
        aria-labelledby="hero-heading"
      >
        <div className={`${styles.content} ${styles.left}`}>
          <span className={styles.eyebrow}>
            01 / The Arrival
          </span>

          <h1 id="hero-heading" className={styles.heading}>
            Sound,
            <br />
            sculpted.
          </h1>

          <p className={styles.description}>
            Meet Aural Forge. A new perspective on personal
            audio, where considered design meets an
            immersive listening experience.
          </p>
        </div>
      </section>

      {/* 02 — Performance */}
      <section
        id="performance"
        className={styles.section}
        aria-labelledby="performance-heading"
      >
        <div className={`${styles.content} ${styles.right}`}>
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
            Music is more than what you hear. It is depth,
            texture, and detail — a world waiting to be
            explored.
          </p>
        </div>
      </section>

      {/* 03 — Detail & Craft */}
      <section
        id="detail"
        className={styles.section}
        aria-labelledby="detail-heading"
      >
        <div className={`${styles.content} ${styles.right}`}>
          <span className={styles.eyebrow}>
            03 / The Details
          </span>

          <h2 id="detail-heading" className={styles.heading}>
            Crafted
            <br />
            to matter.
          </h2>

          <p className={styles.description}>
            From the metallic finish to the sculpted ear
            cushions, every surface contributes to a
            distinctive product identity.
          </p>
        </div>
      </section>

      {/* 04 — Acoustic Reveal */}
      <section
        id="acoustic-reveal"
        className={styles.section}
        aria-labelledby="reveal-heading"
      >
        <div className={`${styles.content} ${styles.left}`}>
          <span className={styles.eyebrow}>
            04 / Inside the Design
          </span>

          <h2 id="reveal-heading" className={styles.heading}>
            Beyond
            <br />
            the surface.
          </h2>

          <p className={styles.description}>
            Look closer as the earcup layers separate,
            revealing the construction behind the
            assembled form.
          </p>
        </div>
      </section>

      {/* 05 — Configurator */}
      <section
        id="configurator"
        className={styles.section}
        aria-labelledby="configurator-heading"
      >
        <div className={`${styles.content} ${styles.right}`}>
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
            One distinctive silhouette. A personal
            expression. Find the finish that defines
            your style.
          </p>
        </div>
      
      <VariantConfigurator variantId={variantId} onVariantChange={onVariantChange} />
</section>

      {/* 06 — Cinematic Finale */}
      <section
        id="finale"
        className={styles.section}
        aria-labelledby="finale-heading"
      >
        <div className={`${styles.content} ${styles.left}`}>
          <span className={styles.eyebrow}>
            06 / Aural Forge
          </span>

          <h2 id="finale-heading" className={styles.heading}>
            Hear
            <br />
            differently.
          </h2>

          <p className={styles.description}>
            More than a listening device. A statement of
            form, presence, and personal sound.
          </p>
        </div>
      </section>
    </main>
  );
}


function VariantConfigurator({ variantId, onVariantChange }) {
  const [addedVariantId, setAddedVariantId] =
    useConfiguratorState(null);

  const selected = getProductVariant(variantId);

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: selected.currency,
    maximumFractionDigits: 0,
  }).format(selected.price);

  const added = addedVariantId === selected.id;

  return (
    <div
      aria-label="Headphone finish configurator"
      style={{
        position: "relative",
        zIndex: 3,
        width: "min(100%, 460px)",
        boxSizing: "border-box",
        padding: "clamp(20px, 3vw, 32px)",
        border: "1px solid rgba(244,244,242,0.12)",
        borderRadius: 18,
        background: "rgba(21,21,23,0.94)",
        color: "#F4F4F2",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 12px",
              color: "#6EA8FF",
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Configure / 01
          </p>

          <h3
            style={{
              margin: 0,
              fontSize: "clamp(23px, 3vw, 30px)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
            }}
          >
            Choose your finish
          </h3>
        </div>

        <strong
          style={{
            fontSize: 21,
            fontWeight: 500,
            letterSpacing: "-0.03em",
          }}
        >
          {price}
        </strong>
      </div>

      <div
        role="group"
        aria-label="Available headphone finishes"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 125px), 1fr))",
          gap: 10,
          marginTop: 26,
        }}
      >
        {PRODUCT_VARIANTS.map((variant) => {
          const isSelected = variant.id === selected.id;

          return (
            <button
              key={variant.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Select ${variant.name} finish`}
              onClick={() => {
                onVariantChange(variant.id);
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
                border: isSelected
                  ? "1px solid #6EA8FF"
                  : "1px solid rgba(244,244,242,0.14)",
                background: isSelected
                  ? "rgba(110,168,255,0.10)"
                  : "#1C1C1F",
                color: "#F4F4F2",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                textAlign: "left",
                outlineOffset: 3,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: variant.swatch,
                  border: "2px solid rgba(255,255,255,0.25)",
                  boxShadow: isSelected
                    ? "0 0 0 2px #6EA8FF"
                    : "none",
                }}
              />

              <span>{variant.name}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid rgba(244,244,242,0.12)",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          {selected.name}
        </p>

        <p
          style={{
            margin: "0 0 22px",
            color: "#9A9AA0",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {selected.description}
        </p>

        <button
          type="button"
          onClick={() => setAddedVariantId(selected.id)}
          style={{
            width: "100%",
            minHeight: 48,
            padding: "12px 20px",
            border: 0,
            borderRadius: 8,
            background: added ? "#1C1C1F" : "#6EA8FF",
            color: added ? "#F4F4F2" : "#0B0B0C",
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {added ? "Added to Demo Bag" : selected.ctaLabel}
        </button>

        <p
          role="status"
          aria-live="polite"
          style={{
            minHeight: 18,
            margin: "12px 0 0",
            color: "#9A9AA0",
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {added
            ? `${selected.name} selected for your demo bag.`
            : "Interactive product preview · Demo checkout only"}
        </p>
      </div>
    </div>
  );
}
