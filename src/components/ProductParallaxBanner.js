"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const SHARED_IMAGE = "/images/parallax-banner.png";

const BANNER_CONTENT = {
  headphones: {
    eyebrow: "AURAL FORGE / HEADPHONES",
    title: "Sound in every detail.",
    description:
      "A distinctive form. An immersive listening experience.",
    focalPosition: "55% center",
  },

  earbuds: {
    eyebrow: "AURAL FORGE / WIRELESS EARBUDS",
    title: "Small form. Full presence.",
    description:
      "Thoughtful design for sound that moves with you.",
    focalPosition: "45% center",
  },

  "product-03": {
    eyebrow: "AURAL FORGE / SMARTWATCH",
    title: "Designed around every moment.",
    description:
      "A considered approach to everyday technology.",
    focalPosition: "65% center",
  },
};

BANNER_CONTENT.smartwatch = BANNER_CONTENT["product-03"];

export default function ProductParallaxBanner({
  familyId = "headphones",
}) {
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);

  const banner =
    BANNER_CONTENT[familyId] ??
    BANNER_CONTENT.headphones;

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const image = imageRef.current;
    const content = contentRef.current;

    if (!section || !frame || !image || !content) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const media = gsap.matchMedia();

    media.add(
      {
        mobile: "(max-width: 767px)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { mobile, reduced } = context.conditions;

        if (reduced) {
          gsap.set(frame, {
            scale: 1,
            borderRadius: 0,
          });

          gsap.set(image, {
            scale: 1,
            yPercent: 0,
          });

          gsap.set(content, {
            opacity: 1,
            y: 0,
          });

          return;
        }

        const initialScale = mobile ? 0.89 : 0.82;

        gsap.set(frame, {
          scale: initialScale,
          borderRadius: 24,
          transformOrigin: "center center",
        });

        gsap.set(image, {
          scale: 1.035,
          yPercent: -2,
          transformOrigin: "center center",
        });

        gsap.set(content, {
          opacity: 0,
          y: 26,
        });

        const timeline = gsap.timeline({
          defaults: {
            ease: "none",
          },

          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        timeline.to(
          frame,
          {
            scale: 1,
            borderRadius: 0,
            duration: 0.76,
          },
          0
        );

        timeline.to(
          image,
          {
            scale: 1.12,
            yPercent: 2,
            duration: 1,
          },
          0
        );

        timeline.to(
          content,
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
          },
          0.62
        );

        return () => {
          timeline.kill();
        };
      }
    );

    return () => {
      media.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="product-parallax-banner"
      className="af-zoom-banner"
      aria-label={`${banner.eyebrow} cinematic interlude`}
    >
      <div className="af-zoom-banner-sticky">
        <div
          ref={frameRef}
          className="af-zoom-banner-frame"
        >
          <Image
            ref={imageRef}
            src={SHARED_IMAGE}
            alt="Aural Forge audio and wearable product collection"
            fill
            sizes="100vw"
            quality={85}
            className="af-zoom-banner-image"
            style={{
              objectPosition: banner.focalPosition,
            }}
          />

          <div
            className="af-zoom-banner-shade"
            aria-hidden="true"
          />

          <div
            ref={contentRef}
            className="af-zoom-banner-content-wrap"
          >
            <div className="af-zoom-banner-content">
              <span className="af-zoom-banner-eyebrow">
                {banner.eyebrow}
              </span>

              <h2 className="af-zoom-banner-heading">
                {banner.title}
              </h2>

              <p className="af-zoom-banner-description">
                {banner.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .af-zoom-banner {
          position: relative;
          z-index: 5;

          width: 100%;
          height: 215vh;
          height: 215svh;

          background: var(--af-background);
          isolation: isolate;

          pointer-events: none;
        }

        .af-zoom-banner-sticky {
          position: sticky;
          top: 0;

          width: 100%;
          height: 100vh;
          height: 100svh;

          overflow: hidden;
        }

        .af-zoom-banner-frame {
          position: absolute;
          inset: 0;

          overflow: hidden;
          border-radius: 24px;

          background: var(--af-surface);

          transform: scale(0.82);
          transform-origin: center center;

          will-change: transform;
        }

        .af-zoom-banner-image {
          object-fit: cover;

          transform: scale(1.035);

          will-change: transform;
        }

        .af-zoom-banner-shade {
          position: absolute;
          inset: 0;
          z-index: 1;

          background:
            linear-gradient(
              90deg,
              rgba(0,0,0,0.70) 0%,
              rgba(0,0,0,0.38) 46%,
              rgba(0,0,0,0.08) 100%
            );
        }

        .af-zoom-banner-content-wrap {
          position: absolute;
          inset: 0;
          z-index: 2;

          display: flex;
          align-items: flex-end;

          padding:
            0
            max(
              var(--af-page-gutter),
              calc(
                (100vw - var(--af-container-max)) / 2
              )
            )
            clamp(62px, 11vh, 125px);

          opacity: 0;
        }

        .af-zoom-banner-content {
          width: min(100%, 560px);
        }

        .af-zoom-banner-eyebrow {
          display: block;

          margin-bottom: 19px;

          color: #F6B54E;

          font-family: var(--af-font-body);
          font-size: 11px;
          font-weight: 600;

          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .af-zoom-banner-heading {
          margin: 0;

          color: #F3F3F4;

          font-family: var(--af-font-heading);
          font-size: clamp(44px, 5.5vw, 78px);
          font-weight: 600;
          line-height: 1.07;
          letter-spacing: -0.045em;
        }

        .af-zoom-banner-description {
          max-width: 42ch;
          margin-top: 20px;

          color: #F3F3F4;

          font-family: var(--af-font-body);
          font-size: clamp(14px, 1.1vw, 17px);
          line-height: 1.7;
        }

        @media (max-width: 767px) {
          .af-zoom-banner {
            height: 170vh;
            height: 170svh;
          }

          .af-zoom-banner-frame {
            transform: scale(0.89);
          }

          .af-zoom-banner-shade {
            background:
              linear-gradient(
                0deg,
                rgba(0,0,0,0.78) 0%,
                rgba(0,0,0,0.22) 65%,
                transparent 100%
              );
          }

          .af-zoom-banner-content-wrap {
            padding:
              0
              var(--af-page-gutter)
              clamp(72px, 11vh, 115px);
          }

          .af-zoom-banner-heading {
            font-size: clamp(36px, 9vw, 53px);
          }

          .af-zoom-banner-description {
            font-size: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .af-zoom-banner-frame,
          .af-zoom-banner-image {
            transform: none;
            will-change: auto;
          }

          .af-zoom-banner-content-wrap {
            opacity: 1;
          }

          .af-zoom-banner {
            height: 100vh;
            height: 100svh;
          }
        }
      `}</style>
    </section>
  );
}
