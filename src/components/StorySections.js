
import styles from "./StorySections.module.css";

export default function StorySections() {
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
