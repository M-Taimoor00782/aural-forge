import gsap from "gsap";
import { Euler, Quaternion, Vector3 } from "three";
import { resolveChoreographySegment } from "@/config/scrollChoreography";

const TRAVEL_PATHS = {
  "hero-to-performance": {
    arc: [-0.08, -0.2, -0.38],
    tilt: [0, 0, 0],
    scalePulse: -0.02,
  },

  "performance-to-detail": {
    arc: [0, 0, 0],
    tilt: [0, 0, 0],
    scalePulse: 0,
  },

  "detail-to-acoustic-reveal": {
    arc: [0.04, -0.16, 0.24],
    tilt: [-0.11, 0.05, 0.1],
    scalePulse: -0.02,
  },

  "reveal-to-configurator": {
    arc: [0.05, 0.07, -0.25],
    tilt: [0.09, -0.04, -0.08],
    scalePulse: -0.015,
  },

  "configurator-to-finale": {
    arc: [0.07, -0.13, 0.28],
    tilt: [-0.1, 0.05, 0.12],
    scalePulse: 0.025,
  },
};

const DEFAULT_TIMING = {
  position: { start: 0, duration: 1 },
  rotation: { start: 0, duration: 1 },
  scale: { start: 0, duration: 1 },
  camera: { start: 0, duration: 1 },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(from, to, progress) {
  return from + (to - from) * progress;
}

function smoothstep(progress) {
  const t = clamp(progress, 0, 1);
  return t * t * (3 - 2 * t);
}

function phaseProgress(progress, phase) {
  if (phase.duration <= 0) {
    return progress >= phase.start ? 1 : 0;
  }

  return smoothstep(
    (progress - phase.start) / phase.duration
  );
}

function samplePath(from, to, offset, progress) {
  const t = smoothstep(progress);
  const inverse = 1 - t;

  const control = (from + to) / 2 + offset * 2;

  return (
    inverse * inverse * from +
    2 * inverse * t * control +
    t * t * to
  );
}

function getBoundsCorners(bounds) {
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

/*
 * Intermediate scroll poses need the same
 * product/content separation as the endpoint
 * states in responsiveComposition.js.
 *
 * These screen-space regions mirror the
 * existing responsive editorial composition.
 */
function getProductRegion(sectionId, viewport) {
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const aspect = width / height;

  const edgeX = clamp(width * 0.045, 18, 84);
  const edgeY = clamp(height * 0.045, 18, 60);
  const gap = clamp(width * 0.042, 26, 68);

  if (aspect <= 0.75) {
    const contentHeight =
      sectionId === "configurator"
        ? 590
        : sectionId === "hero"
          ? 375
          : 260;

    return {
      left: edgeX,
      right: width - edgeX,
      top: Math.min(height * 0.75, contentHeight),
      bottom: height - edgeY,
    };
  }

  const isRightContent =
    sectionId === "performance" ||
    sectionId === "detail" ||
    sectionId === "configurator";

  const contentWidth =
    sectionId === "configurator" ? 460 : 440;

  if (isRightContent) {
    // Editorial content on the right:
    // product receives the left-side lane.
    return {
      left: edgeX,
      right: Math.max(
        edgeX + 1,
        width - edgeX - contentWidth - gap
      ),
      top: edgeY,
      bottom: height - edgeY,
    };
  }

  // Editorial content on the left:
  // product receives the right-side lane.
  return {
    left: Math.min(
      width - edgeX - 1,
      edgeX + contentWidth + gap
    ),
    right: width - edgeX,
    top: edgeY,
    bottom: height - edgeY,
  };
}

function getTransitionRegion(
  segment,
  viewport,
  progress
) {
  const outgoing = getProductRegion(
    segment.fromSectionId,
    viewport
  );

  const incoming = getProductRegion(
    segment.toSectionId,
    viewport
  );

  return {
    left: lerp(
      outgoing.left,
      incoming.left,
      progress
    ),
    right: lerp(
      outgoing.right,
      incoming.right,
      progress
    ),
    top: lerp(
      outgoing.top,
      incoming.top,
      progress
    ),
    bottom: lerp(
      outgoing.bottom,
      incoming.bottom,
      progress
    ),
  };
}

/*
 * Fit actual rotated 3D geometry into the
 * content-safe region during scroll movement.
 *
 * The model can retain its authored path
 * whenever that path is already safe.
 */
function fitIntermediatePose({
  position,
  orientation,
  scale,
  cameraPosition,
  fov,
  corners,
  viewport,
  progress,
  regionProgress,
  segment,
}) {
  if (!corners || progress <= 0 || progress >= 1) {
    return { position, scale };
  }

  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const aspect = width / height;

  const tanHalfFov = Math.tan(
    (fov * Math.PI) / 360
  );

  const region = getTransitionRegion(
    segment,
    viewport,
    regionProgress
  );

  const leftNdc =
    (2 * region.left) / width - 1;

  const rightNdc =
    (2 * region.right) / width - 1;

  const topNdc =
    1 - (2 * region.top) / height;

  const bottomNdc =
    1 - (2 * region.bottom) / height;

  // Use the actual interpolated orientation,
  // including the Hero shortest-path correction.
  const rotatedCorners = corners.map((corner) =>
    new Vector3(...corner).applyQuaternion(
      orientation
    )
  );

  function getAllowedPosition(candidateScale) {
    let xMin = -Infinity;
    let xMax = Infinity;
    let yMin = -Infinity;
    let yMax = Infinity;

    for (const corner of rotatedCorners) {
      const worldZ =
        position[2] + corner.z * candidateScale;

      const depth =
        cameraPosition[2] - worldZ;

      if (depth <= 0.1) {
        return null;
      }

      const halfHeight =
        depth * tanHalfFov;

      const halfWidth =
        halfHeight * aspect;

      xMin = Math.max(
        xMin,
        cameraPosition[0] +
          leftNdc * halfWidth -
          corner.x * candidateScale
      );

      xMax = Math.min(
        xMax,
        cameraPosition[0] +
          rightNdc * halfWidth -
          corner.x * candidateScale
      );

      yMin = Math.max(
        yMin,
        cameraPosition[1] +
          bottomNdc * halfHeight -
          corner.y * candidateScale
      );

      yMax = Math.min(
        yMax,
        cameraPosition[1] +
          topNdc * halfHeight -
          corner.y * candidateScale
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

  let safeScale = scale;
  let allowed = getAllowedPosition(safeScale);

  if (!allowed) {
    let low = 0;
    let high = scale;

    // Reduce scale only when the geometry
    // cannot otherwise fit beside the content.
    for (let i = 0; i < 28; i += 1) {
      const middle = (low + high) / 2;

      if (getAllowedPosition(middle)) {
        low = middle;
      } else {
        high = middle;
      }
    }

    safeScale = low;
    allowed = getAllowedPosition(safeScale);
  }

  if (!allowed) {
    // Preserve the timeline if model bounds
    // or camera geometry are invalid.
    return { position, scale };
  }

  return {
    position: [
      clamp(
        position[0],
        allowed.xMin,
        allowed.xMax
      ),
      clamp(
        position[1],
        allowed.yMin,
        allowed.yMax
      ),
      position[2],
    ],
    scale: safeScale,
  };
}

export function createScrollChoreographyTimeline({
  productRoot,
  camera,
  segment,
  invalidate,
  viewport,
  modelBounds,
}) {
  const { from, to } = resolveChoreographySegment(
    segment,
    { viewport, modelBounds }
  );

  const timing = {
    ...DEFAULT_TIMING,
    ...segment.timing,
  };

  const path = TRAVEL_PATHS[segment.id] ?? {
    arc: [0, 0, 0],
    tilt: [0, 0, 0],
    scalePulse: 0,
  };

  const aspect =
    viewport.width /
    Math.max(1, viewport.height);

  const motionStrength =
    clamp(
      Math.sqrt(aspect / 1.2),
      0.5,
      1
    ) *
    clamp(
      viewport.height / 760,
      0.75,
      1
    );

  const corners = modelBounds
    ? getBoundsCorners(modelBounds)
    : null;

  // Preserve the approved Hero transition.
  // It must not introduce a forced revolution.
  const isArrivalTransition =
    segment.id === "hero-to-performance";

  const arrivalOrientation =
    new Quaternion().setFromEuler(
      new Euler(...from.product.rotation)
    );

  const performanceOrientation =
    new Quaternion().setFromEuler(
      new Euler(...to.product.rotation)
    );

  const orientation = new Quaternion();

  const playhead = { progress: 0 };

  function applyPose() {
    const progress = playhead.progress;

    const positionProgress = phaseProgress(
      progress,
      timing.position
    );

    const rotationProgress = phaseProgress(
      progress,
      timing.rotation
    );

    const scaleProgress = phaseProgress(
      progress,
      timing.scale
    );

    const cameraProgress = phaseProgress(
      progress,
      timing.camera
    );

    // Retain the existing cinematic travel arcs.
    const position = [0, 1, 2].map((axis) =>
      samplePath(
        from.product.position[axis],
        to.product.position[axis],
        path.arc[axis] * motionStrength,
        positionProgress
      )
    );

    const rotationPulse =
      4 *
      rotationProgress *
      (1 - rotationProgress);

    const rotation = [0, 1, 2].map(
      (axis) =>
        lerp(
          from.product.rotation[axis],
          to.product.rotation[axis],
          rotationProgress
        ) +
        path.tilt[axis] *
          rotationPulse *
          motionStrength
    );

    if (isArrivalTransition) {
      // Shortest-path quaternion interpolation.
      orientation
        .copy(arrivalOrientation)
        .slerp(
          performanceOrientation,
          rotationProgress
        );
    } else {
      // Preserve original Euler-based rotations
      // in the remaining scroll transitions.
      orientation.setFromEuler(
        new Euler(...rotation)
      );
    }

    const scalePulse =
      4 *
      scaleProgress *
      (1 - scaleProgress);

    const scale =
      lerp(
        from.product.scale,
        to.product.scale,
        scaleProgress
      ) *
      (
        1 +
        path.scalePulse *
          scalePulse *
          motionStrength
      );

    const cameraPosition = [0, 1, 2].map(
      (axis) =>
        lerp(
          from.camera.position[axis],
          to.camera.position[axis],
          cameraProgress
        )
    );

    const fov = lerp(
      from.camera.fov,
      to.camera.fov,
      cameraProgress
    );

    // Fit every intermediate product pose
    // into the corresponding content-safe lane.
    const safePose = fitIntermediatePose({
      position,
      orientation,
      scale,
      cameraPosition,
      fov,
      corners,
      viewport,
      progress,
      regionProgress: positionProgress,
      segment,
    });

    productRoot.position.set(
      ...safePose.position
    );

    productRoot.quaternion.copy(
      orientation
    );

    // Endpoint rotations stay exact.
    if (progress <= 0) {
      productRoot.rotation.set(
        ...from.product.rotation
      );
    } else if (progress >= 1) {
      productRoot.rotation.set(
        ...to.product.rotation
      );
    }

    productRoot.scale.setScalar(
      safePose.scale
    );

    // Keep original camera choreography.
    camera.position.set(
      ...cameraPosition
    );

    camera.fov = fov;
    camera.updateProjectionMatrix();

    invalidate();
  }

  return gsap
    .timeline({
      paused: true,
      onUpdate: applyPose,
    })
    .to(playhead, {
      progress: 1,
      duration: 1,
      ease: "none",
    });
}
