"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

import { resolveProductState } from "@/config/productStates";
import { addCartItem } from "@/lib/cartStore";

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
import PremiumHeader, { HEADER_FAMILIES } from "./PremiumHeader";
import StorySections from "./StorySections";
import ProductFAQ from "./ProductFAQ";
import FrequencySection from "./FrequencySection";
import SiteFooter from "./SiteFooter";
import closing from "./SiteClosingSections.module.css";

import ExperienceCursor from "./ExperienceCursor";
import ProductFamilyTransitionController from "./ProductFamilyTransitionController";

const ExperienceCanvas = dynamic(
  () => import("./ExperienceCanvas"),
  {
    ssr: false,
    loading: () => null,
  }
);

function subscribeToFamilyLink(listener) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

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
    "var(--af-font-body)";

  const headingFont =
    "var(--font-af-heading), Saira, sans-serif";

  const buttonFont =
    "var(--af-font-button)";

  const muted = "var(--af-text-secondary)";
  const white = "var(--af-text-primary)";
  const gold = "var(--af-accent)";

  function handleSubscribe(event) {
    event.preventDefault();

    setNewsletterStatus(
      "Newsletter signup is a preview. Your email was not saved."
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
      <section id="about" className={closing.about} aria-labelledby="about-heading">
        <div className={`af-container ${closing.aboutLayout}`}>
          <div className={closing.editorialEntry}>
            <h2 id="about-heading" className={closing.editorialHeading}>About Aural Forge</h2>
          </div>
          <div className={closing.aboutCopy}>
            <p>Sound shapes everyday life. We bring the same care to what you hear and what you hold, from the curve of an earcup to the face of a watch.</p>
          </div>
        </div>
      </section>

      <FrequencySection onFamilySelect={onFamilySelect} />
      <ProductFAQ families={HEADER_FAMILIES} activeFamilyId={activeFamilyId} />

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
          <div className={closing.editorialEntry}>
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
              THE AURAL FORGE LETTER
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
              Notes from
              <br />
              the studio.
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
              New products, design notes, and a closer look at the details.
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
                Subscribe
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
                "Newsletter signup preview"}
            </p>
          </div>
        </div>
      </section>

      <SiteFooter families={HEADER_FAMILIES} activeFamilyId={activeFamilyId}
        transitioning={transitioning} onFamilySelect={onFamilySelect} />
    </div>
  );
}

export default function ExperienceRuntime({ initialFamilyId = DEFAULT_PRODUCT_FAMILY_ID }) {
  const getFamilyFromLink = useCallback(() => {
    const id = new URLSearchParams(window.location.search).getAll("family").at(-1);
    return isProductFamilyReady(id) ? id : initialFamilyId;
  }, [initialFamilyId]);
  const getInitialFamily = useCallback(() => initialFamilyId, [initialFamilyId]);
  const linkedFamilyId = useSyncExternalStore(subscribeToFamilyLink, getFamilyFromLink, getInitialFamily);
  const [chosenFamilyId, setActiveFamilyId] = useState(null);
  const activeFamilyId = chosenFamilyId ?? linkedFamilyId;

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

  const [inspectionSection, setInspectionSection] = useState(null);
  const inspectionRef = useRef({});

  const [transitionPlan, setTransitionPlan] = useState(null);

  const [transitionPhase, setTransitionPhase] = useState(
    FAMILY_TRANSITION_PHASES.IDLE
  );

  const [familyTransitionActive, setFamilyTransitionActive] =
    useState(false);

  const [readyFamilyId, setReadyFamilyId] = useState(null);
  const [shoppingActive, setShoppingActive] = useState(false);

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

  const headerRef = useRef(null);

  function addToCart(familyId, variantId, quantity, opener) {
    const added = addCartItem(familyId, variantId, quantity);
    headerRef.current?.openCart(opener);
    return added;
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

  const availableInspection = !shoppingActive && !familyTransitionActive &&
    !transitionPlan && readyFamilyId === activeFamilyId ? inspectionSection : null;

  return (
    <>
      <ScrollStoryController
        familyId={activeFamilyId}
        onStoryStateChange={handleStoryStateChange}
      />

      <PremiumHeader
        ref={headerRef}
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
        ].filter(Boolean).join(" ")}
        data-family={activeFamilyId}
        data-stage-ready={readyFamilyId === activeFamilyId}
        data-product-state={activeProductState}
        aria-hidden={shoppingActive}
      >
        <ExperienceCanvas
          familyId={activeFamilyId}
          variantId={selectedVariantId}
          inspectionSection={availableInspection}
          inspectionRef={inspectionRef}
          onInspectionSectionChange={setInspectionSection}
          onStageReady={handleStageReady}
          onStageUnavailable={handleStageUnavailable}
          onStageMotionRegistration={handleStageMotionRegistration}
        />
      </div>

      <StorySections
        familyId={activeFamilyId}
        variantId={selectedVariantId}
        productReady={readyFamilyId === activeFamilyId}
        inspectionSection={availableInspection}
        inspectionRef={inspectionRef}
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












