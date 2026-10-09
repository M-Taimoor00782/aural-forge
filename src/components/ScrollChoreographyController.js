
"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";

import { SCROLL_CHOREOGRAPHY } from "@/config/scrollChoreography";
import { createScrollChoreographyTimeline } from "@/lib/createScrollChoreographyTimeline";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollChoreographyController({
  productRootRef,
  modelBounds,
  onChoreographyActiveChange,
}) {
  const get = useThree((state) => state.get);

  const invalidate = useThree(
    (state) => state.invalidate
  );

  const viewport = useThree(
    (state) => state.size
  );

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      onChoreographyActiveChange(false);
      return;
    }

    const productRoot = productRootRef.current;

    if (!productRoot) {
      return;
    }

    const camera = get().camera;

    const choreography = SCROLL_CHOREOGRAPHY.map(
      (segment) => {
        const fromSection = document.getElementById(
          segment.fromSectionId
        );

        const toSection = document.getElementById(
          segment.toSectionId
        );

        if (!fromSection || !toSection) {
          return null;
        }

        const timeline =
          createScrollChoreographyTimeline({
            productRoot,
            camera,
            segment,
            invalidate,
            viewport,
            modelBounds,
          });

        const trigger = ScrollTrigger.create({
          trigger: fromSection,
          endTrigger: toSection,

          start: "center center",
          end: "center center",

          scrub: true,

          onEnter: () => {
            onChoreographyActiveChange(true);
          },

          onEnterBack: () => {
            onChoreographyActiveChange(true);
          },

          onLeave: () => {
            onChoreographyActiveChange(false);
          },

          onLeaveBack: () => {
            onChoreographyActiveChange(false);
          },

          onUpdate: (self) => {
            timeline.progress(self.progress);
          },
        });

        return {
          timeline,
          trigger,
        };
      }
    ).filter(Boolean);

    return () => {
      choreography.forEach(
        ({ timeline, trigger }) => {
          trigger.kill();
          timeline.kill();
        }
      );

      onChoreographyActiveChange(false);
    };
  }, [
    get,
    invalidate,
    productRootRef,
    modelBounds,
    onChoreographyActiveChange,
    viewport,
  ]);

  return null;
}
