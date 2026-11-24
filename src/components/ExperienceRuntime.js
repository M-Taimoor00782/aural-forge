"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { resolveProductState } from "@/config/productStates";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyVariant,
  isProductFamilyReady,
} from "@/config/productFamilies";

import {
  FAMILY_TRANSITION_PHASES,
  createFamilyTransitionPlan,
} from "@/config/productFamilyTransitions";

import ScrollStoryController from "./ScrollStoryController";
import ProductsGallery from "./ProductsGallery";
import PremiumHeader from "./PremiumHeader";
import StorySections from "./StorySections";

import ExperienceCursor from "./ExperienceCursor";
import ProductFamilyTransitionController from "./ProductFamilyTransitionController";

const ExperienceCanvas = dynamic(
  () => import("./ExperienceCanvas"),
  {
    ssr: false,
    loading: () => null,
  }
);

const HEADER_FAMILIES = [
  { id: "headphones", label: "Headphones" },
  { id: "earbuds", label: "Wireless Earbuds" },
  { id: "product-03", label: "Smartwatch" },
];

function navigateToHero() {
  const hero = document.getElementById("hero");

  if (!hero) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  window.scrollTo({
    top: window.scrollY + hero.getBoundingClientRect().top,
    behavior: reducedMotion ? "auto" : "smooth",
  });
}

/* af-site-closing-theme-v2 */
function SiteClosingSections({
  activeFamilyId,
  transitioning,
  onFamilySelect,
}) {
  const [newsletterStatus, setNewsletterStatus] = useState("");

  const bodyFont =
    "var(--font-af-body), Montserrat, sans-serif";

  const headingFont =
    "var(--font-af-heading), Saira, sans-serif";

  const buttonFont =
    "var(--font-af-button), Inter, sans-serif";

  const muted = "var(--af-text-secondary)";
  const white = "var(--af-text-primary)";
  const gold = "var(--af-accent)";

  function handleSubscribe(event) {
    event.preventDefault();

    setNewsletterStatus(
      "Newsletter preview only. Subscriptions are not enabled yet; no email was saved."
    );
  }

  return (
    <div
      style={{
        position: "relative",
        zIndex: 6,
        isolation: "isolate",
        background: "var(--af-background)",
        color: white,
      }}
    >
      {/* NEWSLETTER */}

      <section
        id="newsletter"
        aria-labelledby="newsletter-heading"
        style={{
          paddingBlock: "clamp(80px, 10vw, 145px)",
          borderTop: "1px solid var(--af-border)",
          borderBottom: "1px solid var(--af-border)",
          background:
            "linear-gradient(120deg, var(--af-surface), var(--af-background))",
        }}
      >
        <div
          className="af-container"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            alignItems: "end",
            gap: "clamp(32px, 6vw, 90px)",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                marginBottom: 20,
                color: gold,
                fontFamily: bodyFont,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.2em",
              }}
            >
              STAY IN FREQUENCY
            </span>

            <h2
              id="newsletter-heading"
              style={{
                margin: 0,
                color: white,
                fontFamily: headingFont,
                fontSize: "clamp(40px, 6vw, 80px)",
                fontWeight: 600,
                lineHeight: 1.08,
                letterSpacing: "-0.045em",
              }}
            >
              A quieter kind
              <br />
              of update.
            </h2>

            <p
              style={{
                maxWidth: 460,
                marginTop: 22,
                color: muted,
                fontFamily: bodyFont,
                fontSize: 13,
                lineHeight: 1.85,
              }}
            >
              Product announcements, design notes,
              and stories from behind the sound.
              Only the essentials.
            </p>
          </div>

          <div style={{ minWidth: 0 }}>
            <form
              onSubmit={handleSubscribe}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "stretch",
                gap: 10,
              }}
            >
              <label
                htmlFor="af-newsletter-email"
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clipPath: "inset(50%)",
                }}
              >
                Email address
              </label>

              <input
                id="af-newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Your email address"
                style={{
                  flex: "1 1 210px",
                  minWidth: 0,
                  minHeight: 54,
                  padding: "14px 17px",
                  border: "1px solid var(--af-border-strong)",
                  borderRadius: 9,
                  background: "var(--af-input-bg)",
                  color: white,
                  fontFamily: bodyFont,
                  fontSize: 13,
                }}
              />

              <button
                type="submit"
                data-af-cursor="interactive"
                style={{
                  flex: "0 1 140px",
                  minHeight: 54,
                  padding: "12px 18px",
                  border: 0,
                  borderRadius: 9,
                  background: "var(--af-button-bg)",
                  color: "var(--af-button-text)",
                  fontFamily: buttonFont,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Subscribe ↗
              </button>
            </form>

            <p
              role="status"
              aria-live="polite"
              style={{
                marginTop: 14,
                color: muted,
                fontFamily: bodyFont,
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              {newsletterStatus ||
                "Newsletter preview · Signup service coming soon"}
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer
        id="site-footer"
        style={{
          padding: "clamp(70px, 8vw, 110px) 0 28px",
          background: "var(--af-background)",
        }}
      >
        <div
          className="af-container"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
            gap: "clamp(32px, 5vw, 70px)",
          }}
        >
          {/* Brand */}

          <div>
            <a
              href="#hero"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 13,
                color: white,
                fontFamily: headingFont,
                fontSize: 20,
                fontWeight: 650,
                letterSpacing: "0.04em",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 34,
                  height: 34,
                  border: `1.5px solid ${gold}`,
                  borderRadius: 9,
                  color: gold,
                  fontSize: 16,
                }}
              >
                A
              </span>

              AURAL FORGE
            </a>

            <p
              style={{
                marginTop: 22,
                color: muted,
                fontFamily: bodyFont,
                fontSize: 12,
                lineHeight: 1.9,
              }}
            >
              Sound, sculpted.
              <br />
              Designed to be experienced.
            </p>
          </div>

          {/* Products */}

          <nav
            aria-label="Footer product navigation"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 15,
            }}
          >
            <h3
              style={{
                marginBottom: 8,
                fontFamily: headingFont,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Products
            </h3>

            {HEADER_FAMILIES.map(({ id, label }) => {
              const ready = isProductFamilyReady(id);
              const selected = activeFamilyId === id;

              return (
                <button
                  type="button"
                  key={id}
                  disabled={!ready || transitioning}
                  aria-pressed={selected}
                  onClick={() => onFamilySelect(id)}
                  data-af-cursor="interactive"
                  style={{
                    padding: 0,
                    border: 0,
                    background: "transparent",
                    color: selected ? gold : muted,
                    fontFamily: bodyFont,
                    fontSize: 14,
                    textAlign: "left",
                    cursor: ready ? "pointer" : "not-allowed",
                    opacity: ready ? 1 : 0.65,
                  }}
                >
                  {label}
                  {!ready && (
                    <span
                      style={{
                        marginLeft: 8,
                        color: "var(--af-accent)",
                        fontSize: 10,
                      }}
                    >
                      SOON
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Site links */}

          <nav
            aria-label="Footer site navigation"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 15,
            }}
          >
            <h3
              style={{
                marginBottom: 8,
                fontFamily: headingFont,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Explore
            </h3>

            {[
              ["The Experience", "#hero"],
              ["The Collection", "#products"],
              ["Newsletter", "#newsletter"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                style={{
                  color: muted,
                  fontFamily: bodyFont,
                  fontSize: 14,
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Statement */}

          <div>
            <h3
              style={{
                marginBottom: 23,
                fontFamily: headingFont,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Our philosophy
            </h3>

            <p
              style={{
                color: muted,
                fontFamily: bodyFont,
                fontSize: 12,
                lineHeight: 1.9,
              }}
            >
              Considered form.
              <br />
              Immersive sound.
              <br />
              No unnecessary noise.
            </p>
          </div>
        </div>

        <div
          className="af-container"
          style={{
            marginTop: 85,
            paddingTop: 24,
            borderTop: "1px solid var(--af-border)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 15,
            color: "var(--af-text-muted)",
            fontFamily: bodyFont,
            fontSize: 10,
          }}
        >
          <span>
            © {new Date().getFullYear()} Aural Forge.
            All rights reserved.
          </span>

          <span>
            A concept product experience.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function ExperienceRuntime() {
  /*
   * af-banner-emergence-dom-v1
   *
   * Preserve the original Canvas JSX and
   * IntersectionObserver.
   *
   * ScrollTrigger owns visual presentation
   * only while the banner is in view.
   */

  useEffect(() => {
    const banner = document.getElementById(
      "product-parallax-banner"
    );

    const layer = document.querySelector(
      ".af-cinematic-layer"
    );

    if (!banner || !layer) return;

    gsap.registerPlugin(ScrollTrigger);

    const previousTransition = layer.style.transition;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const restore = () => {
      gsap.set(layer, {
        clearProps: "opacity,visibility,transform",
      });

      layer.style.transition = previousTransition;
    };

    const update = () => {
      const rect = banner.getBoundingClientRect();
      const viewport = Math.max(1, window.innerHeight);

      if (rect.top >= viewport || rect.bottom <= 0) {
        restore();
        return;
      }

      // Suppress the old CSS fade only during
      // GSAP's scroll-controlled presentation.
      layer.style.transition = "none";

      const fadeOut = gsap.utils.clamp(
        0,
        1,
        (rect.top - viewport * 0.62) /
          (viewport * 0.38)
      );

      const fadeIn = gsap.utils.clamp(
        0,
        1,
        (viewport * 0.92 - rect.bottom) /
          (viewport * 0.85)
      );

      const progress = Math.max(fadeOut, fadeIn);

      const opacity = reducedMotion.matches
        ? (
            rect.top > viewport * 0.62 ||
            rect.bottom < viewport * 0.6
              ? 1
              : 0
          )
        : progress;

      gsap.set(layer, {
        opacity,

        visibility:
          opacity <= 0.001 ? "hidden" : "visible",

        y: reducedMotion.matches
          ? 0
          : (1 - progress) *
            Math.min(85, viewport * 0.09),

        scale: reducedMotion.matches
          ? 1
          : 0.97 + progress * 0.03,
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: banner,
      start: "top bottom",
      end: "bottom top",
      invalidateOnRefresh: true,

      onEnter: update,
      onEnterBack: update,
      onUpdate: update,
      onRefresh: update,
      onLeave: restore,
      onLeaveBack: restore,
    });

    const handleMotionChange = () => update();

    reducedMotion.addEventListener(
      "change",
      handleMotionChange
    );

    update();

    return () => {
      trigger.kill();

      reducedMotion.removeEventListener(
        "change",
        handleMotionChange
      );

      restore();
    };
  }, []);

  const [activeFamilyId, setActiveFamilyId] = useState(
    DEFAULT_PRODUCT_FAMILY_ID
  );

  const [
    selectedVariantsByFamily,
    setSelectedVariantsByFamily,
  ] = useState(() => ({
    [DEFAULT_PRODUCT_FAMILY_ID]:
      getProductFamily(DEFAULT_PRODUCT_FAMILY_ID).defaultVariantId,
  }));

  const [
    activeProductState,
    setActiveProductState,
  ] = useState("neutral");

  const [
    choreographyActive,
    setChoreographyActive,
  ] = useState(false);

  const [transitionPlan, setTransitionPlan] = useState(null);

  const [transitionPhase, setTransitionPhase] = useState(
    FAMILY_TRANSITION_PHASES.IDLE
  );

  const [familyTransitionActive, setFamilyTransitionActive] =
    useState(false);

  const [readyFamilyId, setReadyFamilyId] = useState(null);
  const [shoppingActive, setShoppingActive] = useState(false);
  const [bannerActive, setBannerActive] = useState(false);

  // Keep the shared 3D scene mounted.
  // Fade its presentation when the Products section takes over.
  useEffect(() => {
    const boundary = document.getElementById("products");

    if (!boundary) return;

    let frame = 0;

    const update = () => {
      frame = 0;

      const next =
        boundary.getBoundingClientRect().top <=
        window.innerHeight * 0.82;

      setShoppingActive((current) =>
        current === next ? current : next
      );
    };

    const schedule = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();

    window.addEventListener("scroll", schedule, {
      passive: true,
    });

    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  /*
   * Product-specific parallax banner boundary.
   *
   * Hide the persistent cinematic Canvas while
   * an image banner occupies the viewport.
   *
   * Keep the Canvas mounted so the existing
   * scroll choreography and model state survive.
   *
   * The banner will use:
   * id="product-parallax-banner"
   */
  useEffect(() => {
    const banner = document.getElementById(
      "product-parallax-banner"
    );

    if (!banner) return;

    if (
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setBannerActive(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "-40px 0px -40px 0px",
        threshold: 0,
      }
    );

    observer.observe(banner);

    return () => {
      observer.disconnect();
    };
  }, []);

  const [cart, setCart] = useState([]);

  function addToCart(familyId, variantId, quantity) {
    const variant = getProductFamilyVariant(familyId, variantId);
    if (!isProductFamilyReady(familyId) || variant?.id !== variantId ||
        !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
    const key = familyId + "/" + variantId;
    setCart(lines => {
      if (lines.some(line => line.key === key)) {
        return lines.map(line => line.key === key ? { ...line, quantity: line.quantity + quantity } : line);
      }
      return [...lines, { key, familyId, variantId, familyName: getProductFamily(familyId).label,
        finish: variant.name, demoPrice: variant.demoPrice, quantity, price: variant.price, currency: variant.currency }];
    });
  }

  function selectGalleryFamily(id) {
    if (transitionPlan) return;
    if (isProductFamilyReady(id) && id !== activeFamilyId) {
      // The shopping boundary already hides the persistent stage.
      setReadyFamilyId(null);
      setActiveFamilyId(id);
    }
  }

  const stageMotionRef = useRef(null);
  const headerNavigationRef = useRef(null);

  const activeFamily = getProductFamily(activeFamilyId);

  const selectedVariantId =
    getProductFamilyVariant(
      activeFamilyId,
      selectedVariantsByFamily[activeFamilyId]
    )?.id ?? activeFamily.defaultVariantId;

  const handleCollectionVariantChange = useCallback(
    (familyId, nextVariantId) => {
      if (
        transitionPlan ||
        !isProductFamilyReady(familyId)
      ) {
        return;
      }

      const variant = getProductFamilyVariant(
        familyId,
        nextVariantId
      );

      if (!variant || variant.id !== nextVariantId) {
        return;
      }

      setSelectedVariantsByFamily((previous) => ({
        ...previous,
        [familyId]: nextVariantId,
      }));
    },
    [transitionPlan]
  );

  const handleFamilyChange = useCallback(
    (nextFamilyId) => {
      if (
        transitionPlan ||
        nextFamilyId === activeFamilyId ||
        !isProductFamilyReady(nextFamilyId)
      ) {
        return false;
      }

      const nextFamily = getProductFamily(nextFamilyId);

      if (
        !nextFamily.defaultVariantId ||
        nextFamily.variants.length === 0
      ) {
        return false;
      }

      const plan = createFamilyTransitionPlan({
        fromFamilyId: activeFamilyId,
        toFamilyId: nextFamilyId,
        selectedVariantsByFamily,
      });

      if (!plan) return false;

      setSelectedVariantsByFamily((previous) => {
        const saved = previous[nextFamilyId];

        if (
          getProductFamilyVariant(
            nextFamilyId,
            saved
          )?.id === saved
        ) {
          return previous;
        }

        return {
          ...previous,
          [nextFamilyId]:
            nextFamily.defaultVariantId,
        };
      });

      setTransitionPlan(plan);
      return true;
    },
    [
      activeFamilyId,
      selectedVariantsByFamily,
      transitionPlan,
    ]
  );

  const handleHeaderFamilyChange = useCallback(
    (nextFamilyId) => {
      if (transitionPlan) return;

      if (nextFamilyId === activeFamilyId) {
        navigateToHero();
        return;
      }

      if (handleFamilyChange(nextFamilyId)) {
        headerNavigationRef.current =
          nextFamilyId;
      }
    },
    [
      transitionPlan,
      activeFamilyId,
      handleFamilyChange,
    ]
  );

  const selectProductState = useCallback(
    (stateName) => {
      resolveProductState(stateName);
      setActiveProductState(stateName);
    },
    []
  );

  const handleStoryStateChange = useCallback(
    (storyState) => {
      if (familyTransitionActive) return;

      selectProductState(storyState.productState);

    },
    [
      familyTransitionActive,
      selectProductState,
    ]
  );

  const handleStageReady = useCallback(
    (familyId) => {
      setReadyFamilyId(familyId);
    },
    []
  );

  const handleStageUnavailable = useCallback(
    (familyId) => {
      setReadyFamilyId((current) =>
        current === familyId ? null : current
      );

      if (
        stageMotionRef.current?.familyId === familyId
      ) {
        stageMotionRef.current = null;
      }
    },
    []
  );

  const handleStageMotionRegistration = useCallback(
    (familyId, api) => {
      if (!api) {
        if (
          stageMotionRef.current?.familyId === familyId
        ) {
          stageMotionRef.current = null;
        }

        return;
      }

      stageMotionRef.current = {
        familyId,
        ...api,
      };
    },
    []
  );

  const handleReleaseScrollOwnership = useCallback(
    () => {
      setFamilyTransitionActive(true);
    },
    []
  );

  const handleExitProgress = useCallback(
    (progress, outgoing, plan) => {
      const stage = stageMotionRef.current;

      if (
        stage?.familyId !== plan.fromFamilyId
      ) {
        return;
      }

      stage.exit?.(
        progress,
        outgoing,
        plan
      );
    },
    []
  );

  const handleSwapScene = useCallback(
    (incoming) => {
      setReadyFamilyId(null);
      setActiveFamilyId(incoming.familyId);
    },
    []
  );

  const handleEnterProgress = useCallback(
    (progress, incoming, plan) => {
      const stage = stageMotionRef.current;

      if (
        stage?.familyId !== plan.toFamilyId
      ) {
        return;
      }

      stage.enter?.(
        progress,
        incoming,
        plan
      );
    },
    []
  );

  const handleTransitionComplete = useCallback(
    (completedPlan) => {
      setTransitionPlan(null);
      setFamilyTransitionActive(false);

      setTransitionPhase(
        FAMILY_TRANSITION_PHASES.IDLE
      );

      if (
        completedPlan &&
        headerNavigationRef.current ===
          completedPlan.toFamilyId
      ) {
        headerNavigationRef.current = null;

        window.requestAnimationFrame(
          navigateToHero
        );
      }
    },
    []
  );

  return (
    <>
      <ScrollStoryController
        onStoryStateChange={handleStoryStateChange}
      />

      <PremiumHeader
        cart={cart}
        onRemove={key => setCart(lines => lines.filter(line => line.key !== key))}
        families={HEADER_FAMILIES}
        onHome={navigateToHero}
        familyId={activeFamilyId}
        transitioning={Boolean(transitionPlan)}
        onSelectFamily={handleHeaderFamilyChange}
      />

      <div
        className={[
          "af-cinematic-layer",
          shoppingActive ? "is-exiting" : "",
          bannerActive ? "is-banner-hidden" : "",
        ].filter(Boolean).join(" ")}
        data-family={activeFamilyId}
        data-product-state={activeProductState}
        aria-hidden={shoppingActive || bannerActive}
      >
        <ExperienceCanvas
          familyId={activeFamilyId}
          variantId={selectedVariantId}
          choreographyActive={choreographyActive}
          familyTransitionActive={familyTransitionActive}
          onChoreographyActiveChange={setChoreographyActive}
          onStageReady={handleStageReady}
          onStageUnavailable={handleStageUnavailable}
          onStageMotionRegistration={handleStageMotionRegistration}
        />
      </div>

      <StorySections
        familyId={activeFamilyId}
        variantId={selectedVariantId}
      />

      <ProductsGallery
        familyId={activeFamilyId}
        onAdd={addToCart}
        families={HEADER_FAMILIES}
        selectedVariantsByFamily={selectedVariantsByFamily}
        onVariantChange={handleCollectionVariantChange}
        onFamilyChange={selectGalleryFamily}
        transitioning={Boolean(transitionPlan)}
      />

      <SiteClosingSections
        activeFamilyId={activeFamilyId}
        transitioning={Boolean(transitionPlan)}
        onFamilySelect={handleHeaderFamilyChange}
      />

      <ExperienceCursor />

      <ProductFamilyTransitionController
        plan={transitionPlan}
        readyFamilyId={readyFamilyId}
        onPhaseChange={setTransitionPhase}
        onReleaseScrollOwnership={handleReleaseScrollOwnership}
        onExitProgress={handleExitProgress}
        onSwapScene={handleSwapScene}
        onEnterProgress={handleEnterProgress}
        onComplete={handleTransitionComplete}
      />
    </>
  );
}












