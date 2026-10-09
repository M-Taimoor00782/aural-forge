
import { composeResponsiveProductState } from "@/lib/responsiveComposition";

export const PRODUCT_STATES = {
  neutral: {
    product: {
      position: [0, -1.5, 0],
      rotation: [0, 0, 0],
      scale: 1.6,
    },
    camera: {
      position: [0, 0, 5],
      fov: 45,
    },
  },

  hero: {
    product: {
      position: [0, -1.5, 0],
      rotation: [0, -0.12, 0],
      scale: 1.6,
    },
    camera: {
      position: [0, 0, 4.7],
      fov: 42,
    },
  },

  performanceDetail: {
    product: {
      position: [-0.7, -1.42, 0],
      rotation: [0, -0.35, 0],
      scale: 1.64,
    },
    camera: {
      position: [0, 0, 4.45],
      fov: 40,
    },
  },

  acousticReveal: {
    product: {
      position: [0.65, -1.42, 0],
      rotation: [0, -0.5, 0],
      scale: 1.68,
    },
    camera: {
      position: [0, 0, 4.45],
      fov: 40,
    },
  },

  configurator: {
    product: {
      position: [0, -1.5, 0],
      rotation: [0, 0, 0],
      scale: 1.6,
    },
  },

  finale: {
    product: {
      position: [0.55, -1.38, 0],
      rotation: [0, 0.18, 0],
      scale: 1.72,
    },
    camera: {
      position: [0, 0, 4.7],
      fov: 42,
    },
  },
};

export function resolveProductState(
  stateName,
  { viewport = null, modelBounds = null } = {}
) {
  const state = PRODUCT_STATES[stateName];

  if (!state) {
    throw new Error(
      `[productStates] Unknown product state "${stateName}".`
    );
  }

  const resolved = {
    product: state.product,
    camera:
      state.camera ?? PRODUCT_STATES.neutral.camera,
  };

  if (!viewport || !modelBounds) {
    return resolved;
  }

  return composeResponsiveProductState(resolved, {
    viewport,
    modelBounds,
  });
}
