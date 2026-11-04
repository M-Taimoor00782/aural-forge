"use client";

import { useState } from "react";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyVariant,
  getProductFamilyWorld,
  getReadyProductFamilies,
} from "@/config/productFamilies";

import ProductParallaxBanner from "./ProductParallaxBanner";
import styles from "./StorySections.module.css";

/*
 * AURAL FORGE — FAMILY-SPECIFIC STORYTELLING
 *
 * This file controls editorial content and
 * configurator UI only.
 *
 * The following scroll section IDs are preserved:
 * hero
 * performance
 * detail
 * acoustic-reveal
 * configurator
 * finale
 *
 * 3D motion and GSAP choreography remain
 * in their existing controllers.
 */

const PRODUCT_STORIES = {
  headphones: {
    hero: {
      eyebrow: "01 / Over-ear Headphones",
      title: ["Sound,", "sculpted."],
      description:
        "A bold over-ear silhouette, considered details, and a listening experience shaped around the music.",
    },

    performance: {
      eyebrow: "02 / Listening Experience",
      title: ["Hear every", "dimension."],
      description:
        "Follow the layers of a track. From its quietest texture to its most expressive moment, discover a more intentional way to listen.",
    },

    detail: {
      eyebrow: "03 / Form & Finish",
      title: ["Made to", "be noticed."],
      description:
        "Sculpted earcups, considered proportions, and contrasting surfaces give the headphones their distinctive presence.",
    },

    reveal: {
      eyebrow: "04 / Acoustic Architecture",
      title: ["Beyond", "the surface."],
      description:
        "Go beneath the assembled form as the earcup layers separate in a controlled mechanical reveal, then return to one complete design.",
    },

    configurator: {
      eyebrow: "05 / Choose Your Style",
      title: ["Find your", "finish."],
      description:
        "Explore the available finishes and see your chosen look reflected on the real 3D headphones.",
    },

    finale: {
      eyebrow: "06 / The Final Note",
      title: ["Keep the", "feeling."],
      description:
        "An unmistakable silhouette. A personal finish. Audio equipment that makes a lasting impression.",
    },
  },

  earbuds: {
    hero: {
      eyebrow: "01 / Wireless Earbuds",
      title: ["Small form.", "Bold presence."],
      description:
        "A compact pair of wireless earbuds and a sculpted charging case, presented as one considered design.",
    },

    performance: {
      eyebrow: "02 / Everyday Listening",
      title: ["Make space", "for sound."],
      description:
        "From the first track of the morning to a moment of calm, bring your listening ritual wherever life moves.",
    },

    detail: {
      eyebrow: "03 / Compact Craft",
      title: ["Every detail", "counts."],
      description:
        "Discover the balance between the individual earbuds and the charging case that brings them together.",
    },

    reveal: {
      eyebrow: "04 / Inside the Case",
      title: ["Beyond", "the case."],
      description:
        "A closer perspective on the case, its lid, and the earbuds inside — distinct components of one cohesive form.",
    },

    configurator: {
      eyebrow: "05 / Choose Your Style",
      title: ["Your sound.", "Your shade."],
      description:
        "Choose a finish and explore its material treatment on the wireless earbuds and case in real time.",
    },

    finale: {
      eyebrow: "06 / The Everyday Edit",
      title: ["Made to", "move."],
      description:
        "Considered proportions, an effortless silhouette, and a finish that feels like your own.",
    },
  },
};

/*
 * Semantic UI tokens.
 *
 * Global Dark/Light themes change these
 * colors without modifying product materials
 * or product-family cinematic worlds.
 */

const UI = {
  text: "var(--af-text-primary, #F3F3F4)",
  secondary: "var(--af-text-secondary, #ADB3BA)",
  accent: "var(--af-accent, #F6B54E)",
  surface: "var(--af-surface, #1A1621)",
  elevated: "var(--af-surface-elevated, #25202B)",
  border: "var(--af-border, rgba(243,243,244,0.13))",
  strongBorder:
    "var(--af-border-strong, rgba(243,243,244,0.25))",

  body: "var(--af-font-body, Montserrat, sans-serif)",
  heading: "var(--af-font-heading, Saira, sans-serif)",
  button: "var(--af-font-button, Inter, sans-serif)",

  buttonBg: "var(--af-button-bg, #F6B54E)",
  buttonText: "var(--af-button-text, #0D0D0D)",
};

/* Product pricing helper */

function formatPrice(variant) {
  if (
    typeof variant?.price !== "number" ||
    !Number.isFinite(variant.price)
  ) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: variant.currency || "USD",
    maximumFractionDigits: 0,
  }).format(variant.price);
}

/*
 * Keep family switching available inside
 * the configurator.
 *
 * The premium header already provides
 * primary product-family navigation.
 */

function ProductFamilySwitcher({
  familyId,
  onFamilyChange,
}) {
  const readyFamilies = getReadyProductFamilies();

  if (readyFamilies.length < 2) {
    return null;
  }

  return (
    <div
      aria-label="Explore Aural Forge products"
      style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        marginBottom: 20,
        pointerEvents: "auto",
      }}
    >
      <p
        style={{
          marginBottom: 12,
          color: UI.secondary,
          fontFamily: UI.body,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
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
          gap: 9,
        }}
      >
        {readyFamilies.map((family) => {
          const active = family.id === familyId;

          return (
            <button
              key={family.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                if (!active) {
                  onFamilyChange?.(family.id);
                }
              }}
              data-af-cursor="interactive"
              style={{
                flex: "1 1 140px",
                minWidth: 0,
                minHeight: 48,

                padding: "11px 14px",

                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,

                border: `1px solid ${
                  active
                    ? UI.accent
                    : UI.strongBorder
                }`,

                borderRadius: 10,

                background: active
                  ? UI.elevated
                  : UI.surface,

                color: UI.text,

                fontFamily: UI.button,
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                textAlign: "left",

                cursor: active
                  ? "default"
                  : "pointer",

                transition:
                  "border-color 180ms ease, background-color 180ms ease",
              }}
            >
              <span>{family.label}</span>

              <span
                aria-hidden="true"
                style={{
                  color: active
                    ? UI.accent
                    : UI.secondary,
                  fontSize: 10,
                }}
              >
                {family.number}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/*
 * Reusable editorial content.
 *
 * The surrounding section remains responsible
 * for its existing scroll and 3D choreography.
 */

function StoryPanel({
  id,
  content,
  position = "left",
  hero = false,
  children,
}) {
  const Heading = hero ? "h1" : "h2";

  const headingId =
    id === "acoustic-reveal"
      ? "reveal-heading"
      : `${id}-heading`;

  return (
    <div
      className={`${styles.content} ${styles[position]}`}
    >
      <span className={styles.eyebrow}>
        {content.eyebrow}
      </span>

      <Heading
        id={headingId}
        className={styles.heading}
      >
        {content.title[0]}
        <br />
        {content.title[1]}
      </Heading>

      <p className={styles.description}>
        {content.description}
      </p>

      {children}
    </div>
  );
}

/*
 * Main storytelling structure.
 *
 * Keep the same six sections in the same order.
 */

export default function StorySections({
  familyId = DEFAULT_PRODUCT_FAMILY_ID,
  variantId,
  onFamilyChange,
  onVariantChange,
}) {
  const family = getProductFamily(familyId);

  const story =
    PRODUCT_STORIES[family.id] ??
    PRODUCT_STORIES.headphones;

  const activeVariant = getProductFamilyVariant(
    family.id,
    variantId
  );

  const variantName =
    activeVariant?.name ??
    activeVariant?.label ??
    "Signature finish";

  const price = formatPrice(activeVariant);

  return (
    <main className={styles.story}>
      {/* 01 — HERO */}

      <section
        id="hero"
        className={styles.section}
        aria-labelledby="hero-heading"
      >
        <StoryPanel
          id="hero"
          content={story.hero}
          hero
        >
          <div
            aria-label="Current product selection"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px 14px",

              marginTop: 26,
              paddingTop: 15,

              borderTop: `1px solid ${UI.border}`,

              color: UI.secondary,
              fontFamily: UI.body,
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                color: UI.text,
                fontWeight: 600,
              }}
            >
              {family.label}
            </span>

            <span aria-hidden="true">/</span>

            <span>{variantName}</span>

            {price && (
              <strong
                style={{
                  color: UI.text,
                  fontWeight: 600,
                }}
              >
                {price}
              </strong>
            )}
          </div>

          <a
            href="#configurator"
            data-af-cursor="interactive"
            className="af-button"
            style={{
              marginTop: 22,
              width: "fit-content",
              maxWidth: "100%",
            }}
          >
            Explore finishes

            <span aria-hidden="true">↗</span>
          </a>
        </StoryPanel>
      </section>

      {/* 02 — PERFORMANCE */}

      <section
        id="performance"
        className={styles.section}
        aria-labelledby="performance-heading"
      >
        <StoryPanel
          id="performance"
          content={story.performance}
          position="right"
        />
      </section>

      {/* 03 — DETAIL */}

      <section
        id="detail"
        className={styles.section}
        aria-labelledby="detail-heading"
      >
        <StoryPanel
          id="detail"
          content={story.detail}
          position="right"
        />
      </section>

      {/* PRODUCT-SPECIFIC IMAGE INTERLUDE */}

      <ProductParallaxBanner
        familyId={family.id}
      />
      {/* 04 — MECHANICAL REVEAL */}

      <section
        id="acoustic-reveal"
        className={styles.section}
        aria-labelledby="reveal-heading"
      >
        <StoryPanel
          id="acoustic-reveal"
          content={story.reveal}
        />
      </section>

      {/* 05 — CONFIGURATOR */}

      <section
        id="configurator"
        className={styles.section}
        aria-labelledby="configurator-heading"
      >
        <StoryPanel
          id="configurator"
          content={story.configurator}
          position="right"
        />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "min(100%, 460px)",
            pointerEvents: "auto",
          }}
        >
          <ProductFamilySwitcher
            familyId={family.id}
            onFamilyChange={onFamilyChange}
          />

          <VariantConfigurator
            key={family.id}
            family={family}
            variantId={variantId}
            onVariantChange={onVariantChange}
          />
        </div>
      </section>

      {/* 06 — FINALE */}

      <section
        id="finale"
        className={styles.section}
        aria-labelledby="finale-heading"
      >
        <StoryPanel
          id="finale"
          content={story.finale}
        />
      </section>
    </main>
  );
}

/*
 * Existing variant-driven 3D configurator.
 *
 * Family variant selection continues to be
 * controlled by ExperienceRuntime.
 */

function VariantConfigurator({
  family,
  variantId,
  onVariantChange,
}) {
  const [
    addedVariantId,
    setAddedVariantId,
  ] = useState(null);

  const selected = getProductFamilyVariant(
    family.id,
    variantId
  );

  if (!selected) return null;

  const selectedName =
    selected.name ??
    selected.label ??
    selected.id;

  const price = formatPrice(selected);

  const added =
    addedVariantId === selected.id;

  return (
    <div
      aria-label={`${family.label} finish configurator`}
      style={{
        position: "relative",
        zIndex: 3,

        width: "100%",
        padding: "clamp(20px, 3vw, 30px)",

        border: `1px solid ${UI.border}`,
        borderRadius: 18,

        background: UI.surface,
        color: UI.text,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              marginBottom: 11,

              color: UI.accent,
              fontFamily: UI.body,
              fontSize: 10,
              fontWeight: 600,

              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Configure / {family.number}
          </p>

          <h3
            style={{
              color: UI.text,
              fontFamily: UI.heading,

              fontSize: "clamp(23px, 3vw, 29px)",
              lineHeight: 1.2,
              fontWeight: 600,
            }}
          >
            Choose your finish
          </h3>

          <p
            style={{
              marginTop: 8,
              color: UI.secondary,
              fontSize: 11,
            }}
          >
            {family.label}
          </p>
        </div>

        {price && (
          <strong
            style={{
              color: UI.text,
              fontFamily: UI.button,
              fontSize: 19,
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
          marginTop: 24,
        }}
      >
        {family.variants.map((variant) => {
          const active =
            selected.id === variant.id;

          const name =
            variant.name ??
            variant.label ??
            variant.id;

          const swatch =
            typeof variant.swatch === "string"
              ? variant.swatch
              : getProductFamilyWorld(
                  family.id,
                  variant.id
                ).palette.accent;

          return (
            <button
              key={variant.id}
              type="button"
              aria-label={`Select ${name} finish`}
              aria-pressed={active}
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
                minHeight: 82,
                padding: "12px 14px",

                border: `1px solid ${
                  active
                    ? UI.accent
                    : UI.strongBorder
                }`,

                borderRadius: 10,

                background: active
                  ? UI.elevated
                  : "transparent",

                color: UI.text,

                fontFamily: UI.button,
                fontSize: 12,

                cursor: "pointer",
                textAlign: "left",
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
                    `2px solid ${UI.strongBorder}`,

                  boxShadow: active
                    ? `0 0 0 2px ${UI.accent}`
                    : "none",
                }}
              />

              <span>{name}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 22,
          paddingTop: 18,
          borderTop: `1px solid ${UI.border}`,
        }}
      >
        <p
          style={{
            color: UI.text,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {selectedName}
        </p>

        <p
          style={{
            margin: "7px 0 20px",

            color: UI.secondary,
            fontSize: 12,
            lineHeight: 1.65,
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
          className="af-button"
          style={{
            width: "100%",

            background: added
              ? UI.elevated
              : UI.buttonBg,

            color: added
              ? UI.text
              : UI.buttonText,

            border: added
              ? `1px solid ${UI.strongBorder}`
              : "1px solid transparent",
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
            marginTop: 12,

            color: UI.secondary,
            fontFamily: UI.body,

            fontSize: 10,
            lineHeight: 1.6,
          }}
        >
          {added
            ? `${selectedName} marked for this demo preview. No cart order has been created.`
            : "Interactive 3D preview · Demo checkout is not active yet"}
        </p>
      </div>
    </div>
  );
}

