import gsap from "gsap";
import { Euler, Quaternion, Vector3 } from "three";
import { resolveChoreographySegment } from "@/config/scrollChoreography";

const LOCAL_X_AXIS = new Vector3(1, 0, 0);

const TRAVEL_PATHS = {
  "hero-to-performance": {
    arc: [-0.08, -0.2, -0.38],
    tilt: [0, -0.04, -0.1],
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

// Only Hero â†’ Performance receives the forward somersault.
// It passes through 180 degrees halfway and completes
// one revolution before the Performance anchor.
//
// A full revolution is orientation-equivalent to zero,
// allowing the authored semantic endpoint to remain exact.
function getSomersaultAngle(segmentId, progress) {
  if (segmentId !== "hero-to-performance") {
    return 0;
  }

  // One 180-degree inverted moment, with no accumulated
  // revolutions. The original Performance pose is restored.
  //
  // The broad rise, short inverted hold, and gradual
  // settling phase are all driven by absolute scroll progress.

  const t = clamp(progress, 0, 1);

  const riseEnd = 0.46;
  const settleStart = 0.56;

  if (t <= riseEnd) {
    return Math.PI * smoothstep(t / riseEnd);
  }

  if (t <= settleStart) {
    return Math.PI;
  }

  return Math.PI * (
    1 - smoothstep(
      (t - settleStart) / (1 - settleStart)
    )
  );
}

function getOrientation(rotation, flipAngle) {
  const orientation = new Quaternion().setFromEuler(
    new Euler(...rotation)
  );

  if (flipAngle !== 0) {
    const flip = new Quaternion().setFromAxisAngle(
      LOCAL_X_AXIS,
      flipAngle
    );

    // Multiply on the right to rotate around the
    // headphone's local X axis.
    orientation.multiply(flip);
  }

  return orientation;
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

function fitIntermediatePose({
  position,
  orientation,
  scale,
  cameraPosition,
  fov,
  corners,
  viewport,
  progress,
}) {
  if (!corners || progress <= 0 || progress >= 1) {
    return { position, scale };
  }

  const aspect = Math.max(
    0.1,
    viewport.width / Math.max(1, viewport.height)
  );

  const portraitFactor = clamp(
    (0.85 - aspect) / 0.39,
    0,
    1
  );

  const safeFrame = 0.82 - 0.14 * portraitFactor;

  const tanHalfFov = Math.tan(
    (fov * Math.PI) / 360
  );

  // The intermediate framing now accounts for the
  // actual somersault orientation, not just the
  // original semantic X/Y/Z rotation.
  const rotatedCorners = corners.map((corner) =>
    new Vector3(...corner).applyQuaternion(orientation)
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
        depth * tanHalfFov * safeFrame;

      const halfWidth = halfHeight * aspect;

      const offsetX = corner.x * candidateScale;
      const offsetY = corner.y * candidateScale;

      xMin = Math.max(
        xMin,
        cameraPosition[0] - halfWidth - offsetX
      );

      xMax = Math.min(
        xMax,
        cameraPosition[0] + halfWidth - offsetX
      );

      yMin = Math.max(
        yMin,
        cameraPosition[1] - halfHeight - offsetY
      );

      yMax = Math.min(
        yMax,
        cameraPosition[1] + halfHeight - offsetY
      );
    }

    if (xMin > xMax || yMin > yMax) {
      return null;
    }

    return { xMin, xMax, yMin, yMax };
  }

  let safeScale = scale;
  let allowed = getAllowedPosition(safeScale);

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

    safeScale = low;
    allowed = getAllowedPosition(safeScale);
  }

  if (!allowed) {
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
    viewport.width / Math.max(1, viewport.height);

  const motionStrength =
    clamp(Math.sqrt(aspect / 1.2), 0.5, 1) *
    clamp(viewport.height / 760, 0.75, 1);

  const corners = modelBounds
    ? getBoundsCorners(modelBounds)
    : null;

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

    const position = [0, 1, 2].map((axis) =>
      samplePath(
        from.product.position[axis],
        to.product.position[axis],
        path.arc[axis] * motionStrength,
        positionProgress
      )
    );

    const rotationPulse =
      4 * rotationProgress * (1 - rotationProgress);

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

    // Somersault uses the global segment progress,
    // making reverse scrolling fully deterministic.
    const flipAngle = getSomersaultAngle(
      segment.id,
      progress
    );

    const orientation = getOrientation(
      rotation,
      flipAngle
    );

    const scalePulse =
      4 * scaleProgress * (1 - scaleProgress);

    const scale =
      lerp(
        from.product.scale,
        to.product.scale,
        scaleProgress
      ) *
      (1 +
        path.scalePulse *
          scalePulse *
          motionStrength);

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

    const safePose = fitIntermediatePose({
      position,
      orientation,
      scale,
      cameraPosition,
      fov,
      corners,
      viewport,
      progress,
    });

    productRoot.position.set(...safePose.position);

    // Apply the combined semantic rotation and
    // forward local-X somersault.
    productRoot.quaternion.copy(orientation);

    // Preserve the exact authored Euler values at
    // the two semantic endpoints.
    if (progress <= 0) {
      productRoot.rotation.set(
        ...from.product.rotation
      );
    } else if (progress >= 1) {
      productRoot.rotation.set(
        ...to.product.rotation
      );
    }

    productRoot.scale.setScalar(safePose.scale);

    camera.position.set(...cameraPosition);
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
