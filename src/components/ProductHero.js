import Image from "next/image";
import styles from "./ProductHero.module.css";

export default function ProductHero({ family, content, variant, price }) {
  const finish = variant?.name ?? variant?.label;

  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.set} aria-hidden="true">
        <picture>
          <source
            media="(max-aspect-ratio: 3/4)"
            srcSet="/images/hero-listening-room-portrait.webp"
          />
          <Image
            src="/images/hero-listening-room.webp"
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className={styles.photograph}
          />
        </picture>
      </div>

      <div className={styles.copy} data-hero-copy>
        <p className={styles.eyebrow}>
          <span>{family.number}</span>
          {family.label}
        </p>
        <h1 id="hero-heading" className={styles.headline}>
          {content.title[0]}{" "}
          <span>{content.title[1]}</span>
        </h1>
        <p className={styles.description}>{content.description}</p>
      </div>

      <a href="#products" data-hero-action className={`af-button ${styles.action}`}>
        Explore finishes <span aria-hidden="true">↗</span>
      </a>

      <div className={styles.caption}>
        <div className={styles.selection} aria-label="Current product selection">
          {finish && (
            <>
              <span className={styles.finishLabel}>Finish</span>
              <span>{finish}</span>
            </>
          )}
          {price && <strong>{variant?.demoPrice && "Demo price "}{price}</strong>}
        </div>
        <a href="#performance" className={styles.next}>
          <span>{family.id === "product-03" ? "Explore the dial" : "The listening experience"}</span>
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
