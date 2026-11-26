"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ProductParallaxBanner.module.css";

const BANNER_CONTENT = {
  headphones: ["Headphones", "Sound takes shape.", "Sculpted earcups, soft cushions, and a finish with depth."],
  earbuds: ["Wireless Earbuds", "A place for every detail.", "Two earbuds and a case shaped around them."],
  "product-03": ["Smartwatch", "Time in focus.", "A square dial framed by a curved strap."],
};

// Blend the velocity change at each sticky boundary. At the far end of
// this distance, both the offset and its slope return to zero.
function stickyOffset(distance, length) {
  const remaining = 1 - gsap.utils.clamp(0, 1, distance / length);
  return distance * remaining ** 2;
}

gsap.registerPlugin(ScrollTrigger);

export default function ProductParallaxBanner({ familyId }) {
  const section = useRef(null);
  const frame = useRef(null);
  const [artReady, setArtReady] = useState(false);
  const [label, title, description] = BANNER_CONTENT[familyId] ?? BANNER_CONTENT.headphones;

  useLayoutEffect(() => {
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const element = section.current;
      const surface = frame.current;
      const stage = surface.parentElement;
      const detail = element.previousElementSibling?.querySelector("#detail");
      const portrait = matchMedia("(max-aspect-ratio: 3/4)");
      const travel = () => element.getBoundingClientRect().height - stage.getBoundingClientRect().height;
      const blend = () => gsap.utils.clamp(56, 136, stage.offsetHeight * .16);
      let pinStart, pinEnd, expansion, transition, copyStart, copyEnd;

      function draw(scroll) {
        const progress = gsap.utils.clamp(0, 1, (scroll - pinStart) / expansion);
        // Smoother endpoints without a time-based scrub. Position is the
        // same at a given scroll offset in both directions.
        const open = progress * progress * (3 - 2 * progress);
        const offset = scroll < pinStart ? -stickyOffset(pinStart - scroll, transition)
          : stickyOffset(Math.max(0, scroll - pinEnd), transition);
        surface.style.setProperty("--banner-open", open);
        surface.style.setProperty("--banner-offset", `${offset}px`);
        const exit = gsap.utils.clamp(0, 1, (scroll - copyStart) / (copyEnd - copyStart));
        detail?.style.setProperty("--detail-exit", exit * exit * (3 - 2 * exit));
      }

      ScrollTrigger.create({
        trigger: element,
        start: "top bottom",
        end: () => `top top-=${travel() + blend()}`,
        onRefresh(self) {
          const scroll = self.scroll();
          pinStart = scroll + element.getBoundingClientRect().top;
          pinEnd = pinStart + travel();
          expansion = travel() * .78;
          transition = blend();
          const height = self.end - self.start - travel() - transition;
          copyStart = pinStart - height * (portrait.matches ? .48 : .62);
          copyEnd = pinStart - height * (portrait.matches ? .10 : .22);
          draw(scroll);
        },
        onUpdate: self => draw(self.scroll()),
      });

      return () => {
        surface.style.removeProperty("--banner-open");
        surface.style.removeProperty("--banner-offset");
        detail?.style.removeProperty("--detail-exit");
      };
    });

    return () => media.revert();
  }, []);

  return (
    <section ref={section} id="product-parallax-banner" className={styles.section} aria-labelledby="banner-heading">
      <div className={styles.stage}>
        <div ref={frame} className={styles.frame} data-banner-frame data-art-ready={artReady}>
          <picture className={styles.art}>
            <source
              media="(max-width: 850px), (max-aspect-ratio: 3/4)"
              srcSet="/images/parallax-collection-compact.webp"
            />
            <Image
              className={styles.image}
              src="/images/parallax-collection-wide.webp"
              alt="Signature Red headphones, Ice Silver wireless earbuds, and a Burnished Copper smartwatch"
              fill
              unoptimized
              loading="eager"
              fetchPriority="low"
              onLoad={() => setArtReady(true)}
              onError={() => setArtReady(true)}
            />
          </picture>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Aural Forge / {label}</p>
            <h2 id="banner-heading">{title}</h2>
            <p className={styles.description}>{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
