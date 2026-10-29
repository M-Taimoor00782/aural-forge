import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyVariant,
  getProductFamilyWorld,
  isProductFamilyReady,
} from "@/config/productFamilies";

export const FAMILY_TRANSITION_PHASES = {
  IDLE: "idle",
  EXITING: "exiting",
  SWAPPING: "swapping",
  ENTERING: "entering",
};

export const FAMILY_TRANSITION_PROFILES = {
  "cinematic-product-handoff": {
    exit: {
      duration: 0.7,
      ease: "power2.inOut",
    },

    world: {
      duration: 1.1,
      ease: "power2.inOut",
    },

    enter: {
      duration: 0.9,
      ease: "power3.out",
    },

    behavior: {
      preserveCanvas: true,
      releaseScrollOwnershipBeforeExit: true,
      swapAssetAfterExit: true,
      activateIncomingStoryAfterEnter: true,
    },
  },
};

// A resolved scene contains the data needed by
// the product stage, world backdrop, and story.
export function resolveProductScene(
  familyId,
  variantId
) {
  if (!isProductFamilyReady(familyId)) {
    return null;
  }

  const family = getProductFamily(familyId);
  const variant = getProductFamilyVariant(
    familyId,
    variantId
  );

  if (!variant) {
    return null;
  }

  const world = getProductFamilyWorld(
    familyId,
    variant.id
  );

  return {
    familyId: family.id,
    variantId: variant.id,

    asset: family.asset,
    materialTargets: family.materialTargets,

    world,
    story: family.story,

    transitionProfileId:
      family.transition.profile,
  };
}

// Build a transition plan without triggering
// animations or changing React state.
//
// Actual GSAP timelines will consume this plan
// from the experience director.
export function createFamilyTransitionPlan({
  fromFamilyId = DEFAULT_PRODUCT_FAMILY_ID,
  toFamilyId,
  selectedVariantsByFamily = {},
}) {
  // Finish changes within a family are handled by
  // material and world-variant controllers.
  if (
    !toFamilyId ||
    fromFamilyId === toFamilyId
  ) {
    return null;
  }

  const outgoing = resolveProductScene(
    fromFamilyId,
    selectedVariantsByFamily[fromFamilyId]
  );

  const incoming = resolveProductScene(
    toFamilyId,
    selectedVariantsByFamily[toFamilyId]
  );

  // Never animate toward an unavailable product.
  if (!outgoing || !incoming) {
    return null;
  }

  const profile =
    FAMILY_TRANSITION_PROFILES[
      incoming.transitionProfileId
    ];

  if (!profile) {
    return null;
  }

  return {
    fromFamilyId,
    toFamilyId,

    outgoing,
    incoming,
    profile,

    phases: [
      {
        id: FAMILY_TRANSITION_PHASES.EXITING,
        duration: profile.exit.duration,
        ease: profile.exit.ease,
        responsibility: "outgoing-product",
      },

      {
        id: FAMILY_TRANSITION_PHASES.SWAPPING,
        duration: 0,
        responsibility: "asset-and-world-handoff",
      },

      {
        id: FAMILY_TRANSITION_PHASES.ENTERING,
        duration: profile.enter.duration,
        ease: profile.enter.ease,
        responsibility: "incoming-product",
      },
    ],

    handoff: {
      preserveCanvas: true,

      incomingAssetUrl:
        incoming.asset.url,

      incomingEnvironmentId:
        incoming.world.environmentId,

      incomingWorld:
        incoming.world,

      incomingStoryId:
        incoming.story.id,
    },
  };
}
