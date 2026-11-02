"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import {
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  Box3,
  Raycaster,
  Vector2,
  Vector3,
} from "three";

const TAU = Math.PI * 2;

const DEFAULT_MAX_PITCH = 0.26;

const ROTATION_RESPONSE = 0.055;
const RETURN_RESPONSE = 0.22;

const SETTLED_EPSILON = 0.00035;

const BLOCKED_TARGETS = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='slider']",
  "[contenteditable='true']",
  "[data-inspection-ignore]",
  "[data-af-cursor='interactive']",
  "[class*='content']",
  "nav",
  "header",
  "footer",
].join(",");

function clamp(value, min, max) {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

function closestRestingYaw(yaw) {
  // Return to the nearest complete revolution.
  // This avoids an unnecessary backward 360°
  // spin when releasing after a full rotation.
  return Math.round(yaw / TAU) * TAU;
}

function isInteractiveOverlay(target) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(BLOCKED_TARGETS)
    )
  );
}

function sendInspectionState(active) {
  // Shared communication event for the
  // custom cursor integration.
  window.dispatchEvent(
    new CustomEvent(
      "aural-forge:inspection",
      {
        detail: {
          active,
          dragging: active,
        },
      }
    )
  );
}

/**
 * Shared product inspection controller.
 *
 * The parent root remains owned by GSAP:
 * position, scale and cinematic rotation.
 *
 * The nested pivot owns only temporary
 * user-driven rotation.
 *
 * Horizontal yaw is unrestricted.
 * Vertical pitch is bounded.
 */
export default function ProductInspectionController({
  children,
  enabled = true,
  maxPitch = DEFAULT_MAX_PITCH,
  returnOnRelease = true,
}) {
  const pivotRef = useRef(null);
  const contentRef = useRef(null);

  const dragRef = useRef(null);

  const rotationRef = useRef({
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
  });

  const raycasterRef = useRef(
    new Raycaster()
  );

  const pointerRef = useRef(
    new Vector2()
  );

  const camera = useThree(
    (state) => state.camera
  );

  const gl = useThree(
    (state) => state.gl
  );

  const invalidate = useThree(
    (state) => state.invalidate
  );

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const pitchLimitRef = useRef(maxPitch);

  pitchLimitRef.current = clamp(
    Number.isFinite(maxPitch)
      ? Math.abs(maxPitch)
      : DEFAULT_MAX_PITCH,
    0.04,
    0.55
  );

  const returnOnReleaseRef = useRef(
    returnOnRelease
  );

  returnOnReleaseRef.current =
    returnOnRelease;

  /*
   * Establish the geometric center of the
   * currently mounted product.
   *
   * The pivot moves to the measured center,
   * while the content receives the inverse
   * offset.
   *
   * The visible product position remains
   * unchanged before inspection.
   */
  useLayoutEffect(() => {
    const pivot = pivotRef.current;
    const content = contentRef.current;

    if (!pivot || !content) {
      return;
    }

    pivot.updateWorldMatrix(true, true);

    const bounds = new Box3().setFromObject(
      content
    );

    if (bounds.isEmpty()) {
      return;
    }

    const center = bounds.getCenter(
      new Vector3()
    );

    pivot.worldToLocal(center);

    pivot.position.add(center);

    content.position.sub(center);

    pivot.updateWorldMatrix(true, true);

    invalidate();
  }, [invalidate]);

  function finishDrag(forceReturn = false) {
    if (!dragRef.current) {
      return;
    }

    dragRef.current = null;

    sendInspectionState(false);

    if (
      forceReturn ||
      returnOnReleaseRef.current
    ) {
      const rotation =
        rotationRef.current;

      rotation.targetYaw =
        closestRestingYaw(
          rotation.yaw
        );

      rotation.targetPitch = 0;

      invalidate();
    }
  }

  /*
   * Pointer interaction uses direct raycasting
   * against the current mounted product.
   *
   * This works even when the Canvas is behind
   * the editorial HTML layers.
   */
  useEffect(() => {
    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    function returnToStory() {
      finishDrag(true);

      const rotation =
        rotationRef.current;

      rotation.targetYaw =
        closestRestingYaw(
          rotation.yaw
        );

      rotation.targetPitch = 0;

      invalidate();
    }

    if (
      !enabled ||
      reducedMotion.matches
    ) {
      returnToStory();
      return undefined;
    }

    function onPointerDown(event) {
      if (
        !enabledRef.current ||
        dragRef.current ||
        event.button !== 0 ||
        event.isPrimary === false ||
        event.pointerType === "touch" ||
        isInteractiveOverlay(event.target)
      ) {
        return;
      }

      const pivot = pivotRef.current;

      const rect =
        gl.domElement.getBoundingClientRect();

      if (
        !pivot ||
        rect.width <= 0 ||
        rect.height <= 0 ||
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return;
      }

      pointerRef.current.set(
        (
          (event.clientX - rect.left) /
          rect.width
        ) * 2 - 1,

        -(
          (event.clientY - rect.top) /
          rect.height
        ) * 2 + 1
      );

      camera.updateWorldMatrix(
        true,
        false
      );

      pivot.updateWorldMatrix(
        true,
        true
      );

      raycasterRef.current.setFromCamera(
        pointerRef.current,
        camera
      );

      const intersections =
        raycasterRef.current.intersectObject(
          pivot,
          true
        );

      const hitProduct =
        intersections.some(
          (intersection) =>
            intersection.object.isMesh
        );

      if (!hitProduct) {
        return;
      }

      dragRef.current = {
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,

        pixelsPerTurn: clamp(
          rect.width * 0.45,
          420,
          700
        ),
      };

      sendInspectionState(true);

      invalidate();

      // Do not let sky interactions or
      // other scene gestures claim this drag.
      event.stopPropagation();
    }

    function onPointerMove(event) {
      const drag = dragRef.current;

      if (
        !drag ||
        event.pointerId !== drag.pointerId
      ) {
        return;
      }

      const dx =
        event.clientX - drag.lastX;

      const dy =
        event.clientY - drag.lastY;

      drag.lastX = event.clientX;
      drag.lastY = event.clientY;

      const rotation =
        rotationRef.current;

      /*
       * Full horizontal rotation.
       *
       * There is deliberately no yaw clamp.
       * The model can rotate through 360°
       * or several complete revolutions.
       */
      rotation.targetYaw +=
        (dx / drag.pixelsPerTurn) * TAU;

      /*
       * Controlled vertical inspection.
       * Prevent flipping over the X axis.
       */
      rotation.targetPitch = clamp(
        rotation.targetPitch +
          dy * 0.004,

        -pitchLimitRef.current,
        pitchLimitRef.current
      );

      invalidate();
    }

    function onPointerUp(event) {
      if (
        dragRef.current?.pointerId ===
        event.pointerId
      ) {
        finishDrag();
      }
    }

    function onWindowBlur() {
      finishDrag(true);
    }

    document.addEventListener(
      "pointerdown",
      onPointerDown,
      true
    );

    window.addEventListener(
      "pointermove",
      onPointerMove
    );

    window.addEventListener(
      "pointerup",
      onPointerUp
    );

    window.addEventListener(
      "pointercancel",
      onPointerUp
    );

    window.addEventListener(
      "blur",
      onWindowBlur
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        onPointerDown,
        true
      );

      window.removeEventListener(
        "pointermove",
        onPointerMove
      );

      window.removeEventListener(
        "pointerup",
        onPointerUp
      );

      window.removeEventListener(
        "pointercancel",
        onPointerUp
      );

      window.removeEventListener(
        "blur",
        onWindowBlur
      );

      finishDrag(true);
    };
  }, [
    enabled,
    camera,
    gl,
    invalidate,
  ]);

  /*
   * Smooth rotation with frame-rate
   * independent damping.
   *
   * This is intentionally separate from
   * GSAP's parent product choreography.
   */
  useFrame((_, delta) => {
    const pivot = pivotRef.current;

    if (!pivot) {
      return;
    }

    const rotation =
      rotationRef.current;

    const dragging = Boolean(
      dragRef.current
    );

    const response = dragging
      ? ROTATION_RESPONSE
      : RETURN_RESPONSE;

    const alpha =
      1 -
      Math.exp(
        -Math.min(delta, 0.05) /
          response
      );

    const yawError =
      rotation.targetYaw -
      rotation.yaw;

    const pitchError =
      rotation.targetPitch -
      rotation.pitch;

    if (
      Math.abs(yawError) <=
        SETTLED_EPSILON &&
      Math.abs(pitchError) <=
        SETTLED_EPSILON
    ) {
      rotation.yaw =
        rotation.targetYaw;

      rotation.pitch =
        rotation.targetPitch;
    } else {
      rotation.yaw +=
        yawError * alpha;

      rotation.pitch +=
        pitchError * alpha;

      // Required for the Canvas's
      // demand-based frameloop.
      invalidate();
    }

    if (
      !dragging &&
      returnOnReleaseRef.current &&
      rotation.pitch === 0 &&
      Math.abs(
        rotation.yaw -
          closestRestingYaw(
            rotation.yaw
          )
      ) <= SETTLED_EPSILON
    ) {
      // Whole turns are visually equivalent
      // to zero rotation.
      rotation.yaw = 0;
      rotation.targetYaw = 0;
    }

    pivot.rotation.order = "YXZ";

    pivot.rotation.set(
      rotation.pitch,
      rotation.yaw,
      0
    );
  });

  return (
    <group
      ref={pivotRef}
      name="AuralForgeSharedInspectionPivot"
    >
      <group
        ref={contentRef}
        name="AuralForgeInspectionContent"
      >
        {children}
      </group>
    </group>
  );
}
