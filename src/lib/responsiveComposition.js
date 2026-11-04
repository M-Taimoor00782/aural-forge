import {
  Box3,
  Euler,
  Quaternion,
  Vector3,
} from "three";

import { PRODUCT_REVEAL } from "@/config/productReveal";

const DESIGN_ASPECT = 1.6;
const MAX_TEXT_WIDTH = 440;
const MAX_CONFIGURATOR_WIDTH = 460;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getBoxCorners(bounds) {
  const [minX, minY, minZ] = bounds.min;
  const [maxX, maxY, maxZ] = bounds.max;

  return [
    [minX, minY, minZ],
    [minX, minY, maxZ],
    [minX, maxY, minZ],
    [minX, maxY, maxZ],
    [maxX, minY, minZ],
    [maxX, minY, maxZ],
    [maxX, maxY, minZ],
    [maxX, maxY, maxZ],
  ];
}

export function measureHeadphoneBounds(scene) {
  scene.updateWorldMatrix(true, true);

  const bounds = new Box3().setFromObject(scene);

  const revealParts = [
    {
      name: "Ear_Pad",
      localZ: PRODUCT_REVEAL.earPad.localZ,
    },
    {
      name: "Cover",
      localZ: PRODUCT_REVEAL.cover.localZ,
    },
  ];

  for (const partConfig of revealParts) {
    const part = scene.getObjectByName(
      partConfig.name
    );

    if (!part) continue;

    const offset = new Vector3(
      0,
      0,
      partConfig.localZ
    ).applyQuaternion(
      part.getWorldQuaternion(
        new Quaternion()
      )
    );

    bounds.union(
      new Box3()
        .setFromObject(part)
        .translate(offset)
    );
  }

  return {
    min: bounds.min.toArray(),
    max: bounds.max.toArray(),
  };
}

// Preserve the current authored product states.
//
// Hero, Reveal and Finale place text on the left.
// Performance and Detail place text on the right.
// The neutral pose is also used by Configurator,
// whose larger right-side UI needs extra clearance.
function getCompositionIntent(product) {
  const x = product.position[0];
  const yaw = product.rotation[1];

  if (
    Math.abs(x) < 0.2 &&
    Math.abs(yaw) < 0.06
  ) {
    return {
      productSide: "left",
      configurator: true,
      hero: false,
    };
  }

  if (x < -0.25) {
    return {
      productSide: "left",
      configurator: false,
      hero: false,
    };
  }

  if (
    Math.abs(x) < 0.25 &&
    yaw < 0
  ) {
    return {
      productSide: "right",
      configurator: false,
      hero: true,
    };
  }

  return {
    productSide: "right",
    configurator: false,
    hero: false,
  };
}

function getSafeScreenRegion(
  viewport,
  intent
) {
  const width = Math.max(
    1,
    viewport.width
  );

  const height = Math.max(
    1,
    viewport.height
  );

  const aspect = width / height;

  /*
   * af-shared-grid-alignment-v2
   *
   * Match the responsive gutters defined
   * in globals.css and StorySections.module.css.
   *
   * Content and 3D product must respect
   * the same centered 1390px site container.
   */

  const pageGutter =
    width <= 380
      ? 18
      : width <= 768
        ? 20
        : clamp(width * 0.05, 20, 88);

  const containerInset = Math.max(
    pageGutter,
    (width - 1390) / 2
  );

  const edgeX = Math.max(
    clamp(width * 0.045, 18, 84),
    containerInset
  );

  const edgeY = clamp(
    height * 0.045,
    18,
    60
  );

  const gap = clamp(
    width * 0.042,
    26,
    68
  );

  // Match the current portrait CSS breakpoint.
  // Text is anchored above the product, so reserve
  // vertical space instead of forcing side-by-side
  // composition on a narrow screen.
  if (aspect <= 0.75) {
    const estimatedContentHeight =
      intent.configurator
        ? 590
        : intent.hero
          ? 375
          : 260;

    return {
      left: edgeX,
      right: width - edgeX,

      top: Math.min(
        height * 0.75,
        estimatedContentHeight
      ),

      bottom: height - edgeY,
      vertical: true,
    };
  }

  // On wider screens reserve a real horizontal
  // lane for editorial text and product controls.
  const textWidth = intent.configurator
    ? MAX_CONFIGURATOR_WIDTH
    : MAX_TEXT_WIDTH;

  if (intent.productSide === "left") {
    return {
      left: edgeX,

      right: Math.max(
        edgeX + 1,
        width -
          edgeX -
          textWidth -
          gap
      ),

      top: edgeY,
      bottom: height - edgeY,
      vertical: false,
    };
  }

  return {
    left: Math.min(
      width - edgeX - 1,
      edgeX + textWidth + gap
    ),

    right: width - edgeX,
    top: edgeY,
    bottom: height - edgeY,
    vertical: false,
  };
}

// Fit the entire rotated 3D bounding box inside
// the product's screen-space region.
//
// This solves a different problem from the old
// viewport-only safe-frame calculation: a model
// can fit on screen yet overlap the actual text.
function getAllowedRootPosition({
  scale,
  corners,
  camera,
  aspect,
  viewport,
  region,
  productZ,
}) {
  const tanHalfFov = Math.tan(
    (camera.fov * Math.PI) / 360
  );

  const leftNdc =
    (2 * region.left) / viewport.width - 1;

  const rightNdc =
    (2 * region.right) / viewport.width - 1;

  const topNdc =
    1 -
    (2 * region.top) / viewport.height;

  const bottomNdc =
    1 -
    (2 * region.bottom) / viewport.height;

  let xMin = -Infinity;
  let xMax = Infinity;
  let yMin = -Infinity;
  let yMax = Infinity;

  for (const corner of corners) {
    const depth =
      camera.position[2] -
      productZ -
      corner.z * scale;

    if (depth <= 0.05) {
      return null;
    }

    const halfHeight =
      depth * tanHalfFov;

    const halfWidth =
      halfHeight * aspect;

    xMin = Math.max(
      xMin,
      camera.position[0] +
        leftNdc * halfWidth -
        corner.x * scale
    );

    xMax = Math.min(
      xMax,
      camera.position[0] +
        rightNdc * halfWidth -
        corner.x * scale
    );

    yMin = Math.max(
      yMin,
      camera.position[1] +
        bottomNdc * halfHeight -
        corner.y * scale
    );

    yMax = Math.min(
      yMax,
      camera.position[1] +
        topNdc * halfHeight -
        corner.y * scale
    );
  }

  if (
    xMin > xMax ||
    yMin > yMax
  ) {
    return null;
  }

  return {
    xMin,
    xMax,
    yMin,
    yMax,
  };
}

export function composeResponsiveProductState(
  state,
  { viewport, modelBounds }
) {
  const width = Math.max(
    1,
    viewport.width
  );

  const height = Math.max(
    1,
    viewport.height
  );

  const aspect = width / height;

  const {
    product,
    camera: baseCamera,
  } = state;

  const narrowness = clamp(
    (1.55 - aspect) / 1.1,
    0,
    1
  );

  const shortness = clamp(
    (760 - height) / 520,
    0,
    1
  );

  // Preserve the existing responsive
  // camera-distance and FOV adjustments.
  const camera = {
    position: [
      baseCamera.position[0],
      baseCamera.position[1],
      baseCamera.position[2] +
        0.75 * narrowness +
        0.2 * shortness,
    ],

    fov: clamp(
      baseCamera.fov +
        8 * narrowness +
        3 * shortness,
      baseCamera.fov,
      60
    ),
  };

  const rotation = new Euler(
    ...product.rotation
  );

  const corners = getBoxCorners(
    modelBounds
  ).map((corner) =>
    new Vector3(
      ...corner
    ).applyEuler(rotation)
  );

  const center = new Vector3(
    (
      modelBounds.min[0] +
      modelBounds.max[0]
    ) / 2,

    (
      modelBounds.min[1] +
      modelBounds.max[1]
    ) / 2,

    (
      modelBounds.min[2] +
      modelBounds.max[2]
    ) / 2
  ).applyEuler(rotation);

  const intent = getCompositionIntent(
    product
  );

  const region = getSafeScreenRegion(
    { width, height },
    intent
  );

  // Preserve the original general scale behavior.
  // The safe-region fit below adds the new
  // content-aware protection.
  const scaleFactor = clamp(
    Math.sqrt(
      Math.min(
        1,
        aspect / DESIGN_ASPECT
      )
    ) *
      Math.sqrt(
        Math.min(
          1,
          height / 800
        )
      ),
    0.5,
    1
  );

  let scale =
    product.scale * scaleFactor;

  const fit = (candidateScale) =>
    getAllowedRootPosition({
      scale: candidateScale,
      corners,
      camera,
      aspect,
      viewport: {
        width,
        height,
      },
      region,
      productZ: product.position[2],
    });

  let allowed = fit(scale);

  // Scale down only when the true projected
  // geometry cannot fit inside its dedicated
  // region beside or below the content.
  if (!allowed) {
    let low = 0;
    let high = scale;

    for (
      let i = 0;
      i < 28;
      i += 1
    ) {
      const middle =
        (low + high) / 2;

      if (fit(middle)) {
        low = middle;
      } else {
        high = middle;
      }
    }

    scale = low;
    allowed = fit(scale);
  }

  if (!allowed) {
    // Defensive fallback for malformed bounds.
    return {
      product: {
        ...product,
      },

      camera,
    };
  }

  const tanHalfFov = Math.tan(
    (camera.fov * Math.PI) / 360
  );

  const depth = Math.max(
    0.1,
    camera.position[2] -
      product.position[2] -
      center.z * scale
  );

  // Aim for the center of the free product lane,
  // rather than the center of the full viewport.
  const targetPixelX =
    (region.left + region.right) / 2;

  const authoredDepth = Math.max(
    0.1,
    baseCamera.position[2] -
      product.position[2] -
      center.z * product.scale
  );

  const authoredTan = Math.tan(
    (baseCamera.fov * Math.PI) / 360
  );

  // Preserve authored vertical placement
  // on desktop/laptop.
  const authoredNdcY = clamp(
    (
      product.position[1] +
      center.y * product.scale -
      baseCamera.position[1]
    ) /
      (
        authoredDepth *
        authoredTan
      ) -
      0.06,
    -0.18,
    0.08
  );

  // In portrait, place the product in the
  // remaining region beneath the text.
  const targetPixelY = region.vertical
    ? (
        region.top +
        region.bottom
      ) / 2
    : (
        height *
        (1 - authoredNdcY)
      ) / 2;

  const desiredX =
    camera.position[0] +
    (
      (2 * targetPixelX) /
        width -
      1
    ) *
      depth *
      tanHalfFov *
      aspect -
    center.x * scale;

  const desiredY =
    camera.position[1] +
    (
      1 -
      (2 * targetPixelY) /
        height
    ) *
      depth *
      tanHalfFov -
    center.y * scale;

  return {
    product: {
      position: [
        clamp(
          desiredX,
          allowed.xMin,
          allowed.xMax
        ),

        clamp(
          desiredY,
          allowed.yMin,
          allowed.yMax
        ),

        product.position[2],
      ],

      rotation: product.rotation,
      scale,
    },

    camera,
  };
}

