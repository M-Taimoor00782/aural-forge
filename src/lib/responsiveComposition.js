
import { Box3, Euler, Quaternion, Vector3 } from "three";
import { PRODUCT_REVEAL } from "@/config/productReveal";

const DESIGN_ASPECT = 1.6;
const SAFE_FRAME = 0.82;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(start, end, value) {
  const t = clamp(
    (value - start) / (end - start),
    0,
    1
  );

  return t * t * (3 - 2 * t);
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
    const part = scene.getObjectByName(partConfig.name);

    if (!part) {
      continue;
    }

    const offset = new Vector3(
      0,
      0,
      partConfig.localZ
    ).applyQuaternion(
      part.getWorldQuaternion(new Quaternion())
    );

    const revealedBounds = new Box3()
      .setFromObject(part)
      .translate(offset);

    bounds.union(revealedBounds);
  }

  return {
    min: bounds.min.toArray(),
    max: bounds.max.toArray(),
  };
}

export function composeResponsiveProductState(
  state,
  { viewport, modelBounds }
) {
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const aspect = width / height;

  const { product, camera: baseCamera } = state;

  // Smoothly activate extra composition protection
  // only as the viewport becomes narrow and tall.
  // This is aspect-based, not device-based.
  const portraitWeight = smoothstep(
    0.72,
    0.5,
    aspect
  );

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

  // Shorter portrait viewports receive slightly
  // stronger safe-frame protection.
  const shortPortrait = clamp(
    (820 - height) / 320,
    0,
    1
  );

  const safeFrame = clamp(
    SAFE_FRAME -
      portraitWeight *
        (0.09 + shortPortrait * 0.025),
    0.69,
    SAFE_FRAME
  );

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

  const center = new Vector3(
    (modelBounds.min[0] + modelBounds.max[0]) / 2,
    (modelBounds.min[1] + modelBounds.max[1]) / 2,
    (modelBounds.min[2] + modelBounds.max[2]) / 2
  ).applyEuler(rotation);

  const rotatedCorners = getBoxCorners(
    modelBounds
  ).map((corner) =>
    new Vector3(...corner).applyEuler(rotation)
  );

  const tanHalfFov = Math.tan(
    (camera.fov * Math.PI) / 360
  );

  function getAllowedPosition(scale) {
    let xMin = -Infinity;
    let xMax = Infinity;
    let yMin = -Infinity;
    let yMax = Infinity;

    for (const corner of rotatedCorners) {
      const worldZ =
        product.position[2] +
        corner.z * scale;

      const depth =
        camera.position[2] - worldZ;

      if (depth <= 0.05) {
        return null;
      }

      const halfHeight =
        depth * tanHalfFov * safeFrame;

      const halfWidth =
        halfHeight * aspect;

      const offsetX = corner.x * scale;
      const offsetY = corner.y * scale;

      xMin = Math.max(
        xMin,
        camera.position[0] -
          halfWidth -
          offsetX
      );

      xMax = Math.min(
        xMax,
        camera.position[0] +
          halfWidth -
          offsetX
      );

      yMin = Math.max(
        yMin,
        camera.position[1] -
          halfHeight -
          offsetY
      );

      yMax = Math.min(
        yMax,
        camera.position[1] +
          halfHeight -
          offsetY
      );
    }

    if (xMin > xMax || yMin > yMax) {
      return null;
    }

    return {
      xMin,
      xMax,
      yMin,
      yMax,
    };
  }

  const baseScaleFactor = clamp(
    Math.sqrt(
      Math.min(1, aspect / DESIGN_ASPECT)
    ) *
      Math.sqrt(
        Math.min(1, height / 800)
      ),
    0.5,
    1
  );

  // Extra scale protection for narrow portraits.
  // Zero effect on desktop and ordinary tablets.
  const portraitScaleFactor = clamp(
    1 -
      portraitWeight *
        (0.08 + shortPortrait * 0.025),
    0.85,
    1
  );

  let scale =
    product.scale *
    baseScaleFactor *
    portraitScaleFactor;

  let allowed = getAllowedPosition(scale);

  if (!allowed) {
    let low = 0;
    let high = scale;

    for (let i = 0; i < 24; i += 1) {
      const middle = (low + high) / 2;

      if (getAllowedPosition(middle)) {
        low = middle;
      } else {
        high = middle;
      }
    }

    scale = low;
    allowed = getAllowedPosition(scale);
  }

  if (!allowed) {
    return state;
  }

  const authoredTanHalfFov = Math.tan(
    (baseCamera.fov * Math.PI) / 360
  );

  const authoredDepth = Math.max(
    0.1,
    baseCamera.position[2] -
      product.position[2] -
      center.z * product.scale
  );

  const authoredX =
    product.position[0] +
    center.x * product.scale -
    baseCamera.position[0];

  const authoredY =
    product.position[1] +
    center.y * product.scale -
    baseCamera.position[1];

  const horizontalTravelFactor = clamp(
    aspect / DESIGN_ASPECT,
    0.2,
    1
  );

  const desiredNdcX = clamp(
    (authoredX /
      (authoredDepth *
        authoredTanHalfFov *
        DESIGN_ASPECT)) *
      horizontalTravelFactor,
    -0.45,
    0.45
  );

  // Original authored vertical composition.
  const authoredNdcY = clamp(
    authoredY /
      (authoredDepth * authoredTanHalfFov) -
      0.06,
    -0.18,
    0.08
  );

  // Mobile portrait target: keep the visible center
  // consistently slightly below screen center.
  // Shorter portrait frames use a little more
  // downward bias for headband clearance.
  const portraitNdcY =
    -0.08 - shortPortrait * 0.025;

  // Smoothly converge mobile semantic states toward
  // one stable vertical composition. Desktop and
  // tablet retain their original authored framing.
  const desiredNdcY =
    authoredNdcY * (1 - portraitWeight) +
    portraitNdcY * portraitWeight;

  const composedDepth = Math.max(
    0.1,
    camera.position[2] -
      product.position[2] -
      center.z * scale
  );

  const desiredX =
    camera.position[0] +
    desiredNdcX *
      composedDepth *
      tanHalfFov *
      aspect -
    center.x * scale;

  const desiredY =
    camera.position[1] +
    desiredNdcY *
      composedDepth *
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
