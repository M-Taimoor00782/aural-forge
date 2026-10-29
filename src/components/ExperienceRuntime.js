"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";

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
import StorySections from "./StorySections";
import ProductWorldBackdrop from "./ProductWorldBackdrop";
import ExperienceCursor from "./ExperienceCursor";
import ProductFamilyTransitionController from "./ProductFamilyTransitionController";

const ExperienceCanvas = dynamic(
  () => import("./ExperienceCanvas"),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function ExperienceRuntime() {
  const [activeFamilyId, setActiveFamilyId] = useState(
    DEFAULT_PRODUCT_FAMILY_ID
  );

  const [
    selectedVariantsByFamily,
    setSelectedVariantsByFamily,
  ] = useState(() => ({
    [DEFAULT_PRODUCT_FAMILY_ID]:
      getProductFamily(
        DEFAULT_PRODUCT_FAMILY_ID
      ).defaultVariantId,
  }));

  // Existing headphone story state.
  const [
    activeProductState,
    setActiveProductState,
  ] = useState("neutral");

  const [
    acousticRevealActive,
    setAcousticRevealActive,
  ] = useState(false);

  const [
    choreographyActive,
    setChoreographyActive,
  ] = useState(false);

  // Family-transition lifecycle.
  const [transitionPlan, setTransitionPlan] =
    useState(null);

  const [transitionPhase, setTransitionPhase] =
    useState(FAMILY_TRANSITION_PHASES.IDLE);

  const [
    familyTransitionActive,
    setFamilyTransitionActive,
  ] = useState(false);

  const [readyFamilyId, setReadyFamilyId] =
    useState(null);

  // The mounted 3D stage will register its own
  // exit/enter animation interface here.
  const stageMotionRef = useRef(null);

  const activeFamily = getProductFamily(
    activeFamilyId
  );

  const selectedVariantId =
    getProductFamilyVariant(
      activeFamilyId,
      selectedVariantsByFamily[activeFamilyId]
    )?.id ?? activeFamily.defaultVariantId;

  const handleVariantChange = useCallback(
    (nextVariantId) => {
      if (transitionPlan) return;

      const variant = getProductFamilyVariant(
        activeFamilyId,
        nextVariantId
      );

      if (!variant || variant.id !== nextVariantId) {
        return;
      }

      setSelectedVariantsByFamily((previous) => ({
        ...previous,
        [activeFamilyId]: nextVariantId,
      }));
    },
    [activeFamilyId, transitionPlan]
  );

  const handleFamilyChange = useCallback(
    (nextFamilyId) => {
      if (
        transitionPlan ||
        nextFamilyId === activeFamilyId ||
        !isProductFamilyReady(nextFamilyId)
      ) {
        return;
      }

      const nextFamily = getProductFamily(
        nextFamilyId
      );

      if (
        !nextFamily.defaultVariantId ||
        nextFamily.variants.length === 0
      ) {
        return;
      }

      const plan = createFamilyTransitionPlan({
        fromFamilyId: activeFamilyId,
        toFamilyId: nextFamilyId,
        selectedVariantsByFamily,
      });

      if (!plan) return;

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

      // The active family does not change here.
      // It changes only at the scene-swap phase.
      setTransitionPlan(plan);
    },
    [
      activeFamilyId,
      selectedVariantsByFamily,
      transitionPlan,
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
      // Do not allow scroll-story updates to compete
      // with an active product-family handoff.
      if (familyTransitionActive) return;

      selectProductState(storyState.productState);

      setAcousticRevealActive(
        storyState.acousticRevealActive
      );
    },
    [familyTransitionActive, selectProductState]
  );

  // Called by a mounted product stage after its
  // actual 3D content is available.
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

  // Every family stage will provide its own motion
  // implementation through this shared interface.
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

      if (stage?.familyId !== plan.fromFamilyId) {
        return;
      }

      stage.exit?.(progress, outgoing, plan);
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

      if (stage?.familyId !== plan.toFamilyId) {
        return;
      }

      stage.enter?.(progress, incoming, plan);
    },
    []
  );

  const handleTransitionComplete = useCallback(
    () => {
      setTransitionPlan(null);
      setFamilyTransitionActive(false);
      setTransitionPhase(
        FAMILY_TRANSITION_PHASES.IDLE
      );
    },
    []
  );

  return (
    <>
      <ScrollStoryController
        onStoryStateChange={handleStoryStateChange}
      />

      <ProductWorldBackdrop
        familyId={activeFamilyId}
        variantId={selectedVariantId}
      />

      <ExperienceCanvas
        familyId={activeFamilyId}
        variantId={selectedVariantId}
        activeProductState={activeProductState}
        acousticRevealActive={acousticRevealActive}
        choreographyActive={choreographyActive}
        familyTransitionActive={familyTransitionActive}
        onChoreographyActiveChange={
          setChoreographyActive
        }
        onStageReady={handleStageReady}
        onStageUnavailable={
          handleStageUnavailable
        }
        onStageMotionRegistration={
          handleStageMotionRegistration
        }
      />

      <StorySections
        familyId={activeFamilyId}
        variantId={selectedVariantId}
        onFamilyChange={handleFamilyChange}
        onVariantChange={handleVariantChange}
      />

      <ExperienceCursor />

      <ProductFamilyTransitionController
        plan={transitionPlan}
        readyFamilyId={readyFamilyId}
        onPhaseChange={setTransitionPhase}
        onReleaseScrollOwnership={
          handleReleaseScrollOwnership
        }
        onExitProgress={handleExitProgress}
        onSwapScene={handleSwapScene}
        onEnterProgress={handleEnterProgress}
        onComplete={handleTransitionComplete}
      />
    </>
  );
}
