import Image from "next/image";
import { getProductFinishImage } from "@/config/productFamilies";
import styles from "./ProductHero.module.css";

export default function ProductHero({ family, content, variant, price, inspection, inspectionRef, productReady }) {
  const finish = variant?.name ?? variant?.label;

  const headphones = family.id === "headphones";
  const interactive = inspection ? inspectionRef : null;
  const overControl = event => event.target.closest("a, button, input, select, textarea, label, [contenteditable]");

  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-heading" tabIndex={-1}
      onPointerDown={event => { if (!overControl(event)) interactive?.current.api?.down(event); }}
      onPointerMove={event => {
        if (event.pointerType !== "mouse") return;
        const api = interactive?.current.api;
        if (overControl(event)) api?.leave();
        else api?.follow(2 * event.clientX / innerWidth - 1, 2 * event.clientY / innerHeight - 1);
      }}
      onPointerLeave={() => interactive?.current.api?.leave()}>
      <picture className={styles.set}>
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

      {variant && (headphones ? (
        <div className={styles.headphoneFrame} data-hero-model-frame>
          <Image src={"/images/hero-headphones/" + variant.id + ".webp"} alt="" fill unoptimized
            loading="eager" fetchPriority="high" className={styles.headphoneStill}
            data-hero-still data-ready={productReady} />
        </div>
      ) : <Image
        src={getProductFinishImage(family.id, variant.id)}
        alt=""
        width={920}
        height={920}
        unoptimized
        loading="eager"
        fetchPriority="high"
        className={styles.still}
        data-hero-still
        data-family={family.id}
        data-ready={productReady}
      />)}

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
        Explore finishes
      </a>

      {inspection}
      <div className={styles.caption}>
        <div className={styles.selection} aria-label="Current product selection">
          {finish && (
            <>
              <span className={styles.finishLabel}>Finish</span>
              <span>{finish}</span>
            </>
          )}
          {price && <strong>{price}</strong>}
        </div>
        <a href="#performance" className={styles.next}>
          <span className={styles.nextLabel}>{family.id === "product-03" ? "Explore the dial" : "The listening experience"}</span>
          <span className={`af-chevron ${styles.nextIcon}`} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
