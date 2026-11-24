"use client";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyVariant,
  formatPrice,
} from "@/config/productFamilies";

import ProductHero from "./ProductHero";
import ProductParallaxBanner from "./ProductParallaxBanner";
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
        "Soft cushions meet sculpted earcups in a pair of headphones made for a closer listen.",
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
      eyebrow: "05 / Profile",
      title: ["Back in", "profile."],
      description:
        "The ear pad and cover settle back into place, bringing the earcup into one continuous silhouette.",
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
      title: ["Small form.", "Full sound."],
      description:
        "Two wireless earbuds, nestled in a sculpted charging case that fits in the palm of your hand.",
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
      eyebrow: "05 / In the Case",
      title: ["Back in", "place."],
      description:
        "The earbuds settle into their sockets and the lid follows the hinge back down.",
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
}) {
  const family = getProductFamily(familyId);

  const story =
    PRODUCT_STORIES[family.id] ??
    PRODUCT_STORIES.headphones;

  const activeVariant = getProductFamilyVariant(
    family.id,
    variantId
  );

  return (
    <main className={styles.story}>
      {/* 01 — HERO */}

      <ProductHero
        family={family}
        content={story.hero}
        variant={activeVariant}
        price={formatPrice(activeVariant)}
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
      >
        <StoryPanel
          id="configurator"
          content={story.configurator}
          position="right"
        />
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
