"use client";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyVariant,
  formatPrice,
} from "@/config/productFamilies";

import ProductHero from "./ProductHero";
import ProductParallaxBanner from "./ProductParallaxBanner";
import ProductInspectionControls from "./ProductInspectionControls";
import styles from "./StorySections.module.css";

/*
 * AURAL FORGE — FAMILY-SPECIFIC STORYTELLING
 *
 * Editorial content for the six cinematic chapters.
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
  "product-03": {
    hero: { title: ["Time,","in profile."], description: "A curved strap frames a square dial. Follow the hands, hour markers, and crown around the watch." },
    performance: { eyebrow: "02 / Dial", title: ["Read the", "face."], description: "Slender hands sit against a dark dial, ringed by twelve raised hour markers." },
    detail: { eyebrow: "03 / Case", title: ["Around", "the edge."], description: "The case curves around the dial, with a short crown projecting from its side." },
    reveal: { eyebrow: "04 / Dial Inspection", title: ["A closer", "look."], description: "Follow the turn from the edge of the case to the dial and the hands above it." },
    configurator: { eyebrow: "05 / Strap", title: ["One curved", "profile."], description: "The strap wraps behind the case and passes through the keepers on the opposite side." },
    finale: { eyebrow: "06 / Smartwatch", title: ["Face", "forward."], description: "The dark dial brings the hour markers and hands back into view." },
  },
  headphones: {
    hero: {
      title: ["Sound,", "sculpted."],
      description:
        "Sculpted earcups and soft cushions frame a closer listen.",
    },

    performance: {
      eyebrow: "02 / Listening Experience",
      title: ["Hear every", "dimension."],
      description:
        "Settle into a track and listen for the details between the notes.",
    },

    detail: {
      eyebrow: "03 / Form & Finish",
      title: ["Made to", "be noticed."],
      description:
        "Metallic cups sit beside dark cushions, tracing the shape of the earcup.",
    },

    reveal: {
      eyebrow: "04 / Acoustic Architecture",
      title: ["Beyond", "the surface."],
      description:
        "Watch the ear pads and outer covers draw away from the earcups, then settle back into place.",
    },

    configurator: {
      eyebrow: "05 / Profile",
      title: ["Back in", "profile."],
      description:
        "The ear pad and cover settle back into place, bringing the earcup into one continuous silhouette.",
    },

    finale: {
      eyebrow: "06 / The Final Note",
      title: ["Keep the", "feeling."],
      description:
        "Choose a finish that brings out the curve of the earcups and headband.",
    },
  },

  earbuds: {
    hero: {
      title: ["Small form.", "Full sound."],
      description:
        "Two wireless earbuds, nestled in a sculpted charging case that fits in the palm of your hand.",
    },

    performance: {
      eyebrow: "02 / Everyday Listening",
      title: ["Make space", "for sound."],
      description:
        "Take your listening from the first track of the morning to the last stop of the day.",
    },

    detail: {
      eyebrow: "03 / Compact Craft",
      title: ["Every detail", "counts."],
      description:
        "The sculpted case holds two earbuds beneath a hinged lid.",
    },

    reveal: {
      eyebrow: "04 / Inside the Case",
      title: ["Beyond", "the case."],
      description:
        "Follow the hinge as the lid opens and the earbuds rise from their sockets.",
    },

    configurator: {
      eyebrow: "05 / In the Case",
      title: ["Back in", "place."],
      description:
        "The earbuds settle into their sockets and the lid follows the hinge back down.",
    },

    finale: {
      eyebrow: "06 / The Everyday Edit",
      title: ["Made to", "move."],
      description:
        "The case closes into a compact profile. The finish is yours to choose.",
    },
  },
};

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
}) {
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

      <h2
        id={headingId}
        className={styles.heading}
      >
        {content.title[0]}
        <br />
        {content.title[1]}
      </h2>

      <p className={styles.description}>
        {content.description}
      </p>
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
  inspectionSection,
  inspectionRef,
}) {
  const family = getProductFamily(familyId);

  const story =
    PRODUCT_STORIES[family.id] ??
    PRODUCT_STORIES.headphones;

  const activeVariant = getProductFamilyVariant(
    family.id,
    variantId
  );
  const inspection = section => inspectionSection === section
    ? <ProductInspectionControls section={section} inspectionRef={inspectionRef} />
    : null;

  return (
    <main className={styles.story}>
      {/* 01 — HERO */}

      <ProductHero
        family={family}
        content={story.hero}
        variant={activeVariant}
        price={formatPrice(activeVariant)}
        inspection={inspection("hero")}
      />

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

      <div className={styles.detailTrack} data-detail-track>
        <section
          id="detail"
          className={`${styles.section} ${styles.pinnedDetail}`}
          aria-labelledby="detail-heading"
        >
          <StoryPanel
            id="detail"
            content={story.detail}
            position="right"
          />
        </section>
      </div>

      {/* PRODUCT-SPECIFIC IMAGE INTERLUDE */}

      <ProductParallaxBanner
        familyId={family.id}
      />
      {/* 04 — MECHANICAL REVEAL */}

      <section
        id="acoustic-reveal"
        className={styles.reveal}
        aria-labelledby="reveal-heading"
      >
        <div className={styles.revealFrame} data-reveal-frame>
          <div className={styles.modelSlot} data-reveal-slot aria-hidden="true" />
          <StoryPanel id="acoustic-reveal" content={story.reveal} position="right" />
        </div>
      </section>

      {/* 05 — CONFIGURATOR */}

      <section
        id="configurator"
        className={styles.section}
        aria-labelledby="configurator-heading"
        tabIndex={-1}
      >
        <StoryPanel
          id="configurator"
          content={story.configurator}
          position="right"
        />
        {inspection("configurator")}
      </section>

      {/* 06 — FINALE */}

      <section
        id="finale"
        className={styles.section}
        aria-labelledby="finale-heading"
        tabIndex={-1}
      >
        <StoryPanel
          id="finale"
          content={story.finale}
        />
        {inspection("finale")}
      </section>
    </main>
  );
}
