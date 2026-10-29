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
  const invalidate = useThree((state) => state.invalidate);
  const viewport = useThree((state) => state.size);

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

    // One connected journey from Hero through Finale.
    const sectionIds = [
      SCROLL_CHOREOGRAPHY[0].fromSectionId,
      ...SCROLL_CHOREOGRAPHY.map(
        (segment) => segment.toSectionId
      ),
    ];

    const sections = sectionIds.map((id) =>
      document.getElementById(id)
    );

    if (sections.some((section) => !section)) {
      return;
    }

    // Reuse semantic anchors and existing phased timing.
    const timelines = SCROLL_CHOREOGRAPHY.map(
      (segment) =>
        createScrollChoreographyTimeline({
          productRoot,
          camera,
          segment,
          invalidate,
          viewport,
          modelBounds,
        })
    );

    // Measure section centers in document scroll coordinates.
    function measureSectionCenters() {
      return sections.map((section) => {
        const rect = section.getBoundingClientRect();

        return (
          window.scrollY +
          rect.top +
          rect.height / 2 -
          window.innerHeight / 2
        );
      });
    }

    let sectionCenters = measureSectionCenters();

    function updateJourney(scrollPosition) {
      const lastSegmentIndex = timelines.length - 1;

      let segmentIndex = 0;

      // Select the active segment along the connected path.
      while (
        segmentIndex < lastSegmentIndex &&
        scrollPosition >=
          sectionCenters[segmentIndex + 1]
      ) {
        segmentIndex += 1;
      }

      const start = sectionCenters[segmentIndex];
      const end = sectionCenters[segmentIndex + 1];

      const distance = Math.max(1, end - start);

      const progress = gsap.utils.clamp(
        0,
        1,
        (scrollPosition - start) / distance
      );

      // Only the current segment writes product/camera transforms.
      timelines[segmentIndex].progress(progress);
    }

    const trigger = ScrollTrigger.create({
      trigger: sections[0],
      endTrigger: sections[sections.length - 1],

      start: "center center",
      end: "center center",

      scrub: true,

      // Keep choreography ownership across the whole journey.
      onToggle: (self) => {
        onChoreographyActiveChange(self.isActive);
      },

      onUpdate: (self) => {
        updateJourney(self.scroll());
      },

      onRefresh: (self) => {
        sectionCenters = measureSectionCenters();

        if (self.isActive) {
          updateJourney(self.scroll());
        }
      },
    });

    return () => {
      trigger.kill();

      timelines.forEach((timeline) => {
        timeline.kill();
      });

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
