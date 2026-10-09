
import { resolveProductState } from "@/config/productStates";

export const SCROLL_CHOREOGRAPHY = [
  {
    id: "hero-to-performance",
    fromSectionId: "hero",
    toSectionId: "performance",
    fromState: "hero",
    toState: "performanceDetail",

    timing: {
      position: {
        start: 0,
        duration: 1,
      },
      rotation: {
        start: 0.08,
        duration: 0.78,
      },
      scale: {
        start: 0.18,
        duration: 0.62,
      },
      camera: {
        start: 0.05,
        duration: 0.9,
      },
    },
  },

  {
    id: "performance-to-detail",
    fromSectionId: "performance",
    toSectionId: "detail",
    fromState: "performanceDetail",
    toState: "performanceDetail",

    timing: {
      position: {
        start: 0,
        duration: 1,
      },
      rotation: {
        start: 0,
        duration: 1,
      },
      scale: {
        start: 0,
        duration: 1,
      },
      camera: {
        start: 0,
        duration: 1,
      },
    },
  },

  {
    id: "detail-to-acoustic-reveal",
    fromSectionId: "detail",
    toSectionId: "acoustic-reveal",
    fromState: "performanceDetail",
    toState: "acousticReveal",

    timing: {
      position: {
        start: 0,
        duration: 1,
      },
      rotation: {
        start: 0.04,
        duration: 0.86,
      },
      scale: {
        start: 0.16,
        duration: 0.84,
      },
      camera: {
        start: 0,
        duration: 1,
      },
    },
  },

  {
    id: "reveal-to-configurator",
    fromSectionId: "acoustic-reveal",
    toSectionId: "configurator",
    fromState: "acousticReveal",
    toState: "configurator",

    timing: {
      position: {
        start: 0.55,
        duration: 0.45,
      },
      rotation: {
        start: 0.58,
        duration: 0.42,
      },
      scale: {
        start: 0.62,
        duration: 0.38,
      },
      camera: {
        start: 0.55,
        duration: 0.45,
      },
    },
  },

  {
    id: "configurator-to-finale",
    fromSectionId: "configurator",
    toSectionId: "finale",
    fromState: "configurator",
    toState: "finale",

    timing: {
      position: {
        start: 0,
        duration: 1,
      },
      rotation: {
        start: 0.12,
        duration: 0.88,
      },
      scale: {
        start: 0.22,
        duration: 0.78,
      },
      camera: {
        start: 0.08,
        duration: 0.92,
      },
    },
  },
];

export function resolveChoreographySegment(
  segment,
  { viewport = null, modelBounds = null } = {}
) {
  return {
    from: resolveProductState(segment.fromState, {
      viewport,
      modelBounds,
    }),
    to: resolveProductState(segment.toState, {
      viewport,
      modelBounds,
    }),
  };
}
