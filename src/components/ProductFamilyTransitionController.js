"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import {
  FAMILY_TRANSITION_PHASES,
} from "@/config/productFamilyTransitions";

/**
 * Coordinates family-level transitions.
 *
 * The controller owns the transition timeline,
 * but delegates actual 3D transforms to each
 * product stage through progress callbacks.
 *
 * readyFamilyId must be reported by the mounted
 * incoming stage, not merely by family selection.
 */
export default function ProductFamilyTransitionController({
  plan = null,
  readyFamilyId = null,
  onPhaseChange,
  onReleaseScrollOwnership,
  onExitProgress,
  onSwapScene,
  onEnterProgress,
  onComplete,
}) {
  const activeTransitionRef = useRef(null);
  const readyFamilyIdRef = useRef(readyFamilyId);
  const callbacksRef = useRef(null);

  readyFamilyIdRef.current = readyFamilyId;

  callbacksRef.current = {
    onPhaseChange,
    onReleaseScrollOwnership,
    onExitProgress,
    onSwapScene,
    onEnterProgress,
    onComplete,
  };

  useEffect(() => {
    if (
      !plan ||
      plan.fromFamilyId === plan.toFamilyId
    ) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const transition = {
      plan,
      phase: FAMILY_TRANSITION_PHASES.EXITING,
      exitTween: null,
      enterTween: null,
      startEnter: null,
    };

    activeTransitionRef.current = transition;

    const isCurrent = () =>
      activeTransitionRef.current === transition;

    function setPhase(phase) {
      if (!isCurrent()) return;

      transition.phase = phase;

      callbacksRef.current.onPhaseChange?.(
        phase,
        plan
      );
    }

    function finish() {
      if (!isCurrent()) return;

      setPhase(FAMILY_TRANSITION_PHASES.IDLE);
      callbacksRef.current.onComplete?.(plan);
    }

    function startEnter() {
      if (!isCurrent()) return;

      if (
        transition.phase !==
        FAMILY_TRANSITION_PHASES.SWAPPING
      ) {
        return;
      }

      // Do not animate an asset that has not mounted.
      if (
        readyFamilyIdRef.current !==
        plan.toFamilyId
      ) {
        return;
      }

      setPhase(FAMILY_TRANSITION_PHASES.ENTERING);

      const progress = { value: 0 };

      callbacksRef.current.onEnterProgress?.(
        0,
        plan.incoming,
        plan
      );

      if (reducedMotion) {
        callbacksRef.current.onEnterProgress?.(
          1,
          plan.incoming,
          plan
        );

        finish();
        return;
      }

      transition.enterTween = gsap.to(progress, {
        value: 1,
        duration: plan.profile.enter.duration,
        ease: plan.profile.enter.ease,

        onUpdate: () => {
          if (!isCurrent()) return;

          callbacksRef.current.onEnterProgress?.(
            progress.value,
            plan.incoming,
            plan
          );
        },

        onComplete: finish,
      });
    }

    transition.startEnter = startEnter;

    function swapScene() {
      if (!isCurrent()) return;

      setPhase(FAMILY_TRANSITION_PHASES.SWAPPING);

      // Parent commits incoming asset, environment,
      // and world identity during this handoff.
      callbacksRef.current.onSwapScene?.(
        plan.incoming,
        plan
      );

      // If already mounted, enter immediately.
      // Otherwise wait for readyFamilyId.
      startEnter();
    }

    // The parent must disable the active product's
    // scroll choreography before applying exit motion.
    callbacksRef.current.onReleaseScrollOwnership?.(
      plan
    );

    setPhase(FAMILY_TRANSITION_PHASES.EXITING);

    const exitProgress = { value: 0 };

    callbacksRef.current.onExitProgress?.(
      0,
      plan.outgoing,
      plan
    );

    if (reducedMotion) {
      callbacksRef.current.onExitProgress?.(
        1,
        plan.outgoing,
        plan
      );

      swapScene();
    } else {
      transition.exitTween = gsap.to(
        exitProgress,
        {
          value: 1,
          duration: plan.profile.exit.duration,
          ease: plan.profile.exit.ease,

          onUpdate: () => {
            if (!isCurrent()) return;

            callbacksRef.current.onExitProgress?.(
              exitProgress.value,
              plan.outgoing,
              plan
            );
          },

          onComplete: swapScene,
        }
      );
    }

    return () => {
      transition.exitTween?.kill();
      transition.enterTween?.kill();

      if (isCurrent()) {
        activeTransitionRef.current = null;
      }
    };
  }, [plan]);

  // React signals when the newly mounted product is
  // genuinely ready. This resumes the paused handoff.
  useEffect(() => {
    activeTransitionRef.current?.startEnter?.();
  }, [readyFamilyId]);

  return null;
}
