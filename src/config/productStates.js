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
  },

  performanceDetail: {
    product: {
      position: [0, -1.5, 0],
      rotation: [0, -0.35, 0],
      scale: 1.6,
    },
  },

  acousticReveal: {
    product: {
      position: [0, -1.5, 0],
      rotation: [0, -0.5, 0],
      scale: 1.6,
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
      position: [0, -1.5, 0],
      rotation: [0, 0.18, 0],
      scale: 1.6,
    },
  },
};


export function resolveProductState(stateName) {
  const state = PRODUCT_STATES[stateName];

  if (!state) {
    throw new Error(
      `[productStates] Unknown product state "${stateName}".`
    );
  }

  return {
    product: state.product,
    camera: state.camera ?? PRODUCT_STATES.neutral.camera,
  };
}