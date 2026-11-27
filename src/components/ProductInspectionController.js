"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, Matrix4, Vector3 } from "three";

const TAU = Math.PI * 2;
const MAX_PITCH = .16;
const EPSILON = .00035;

function restingYaw(yaw) {
  return Math.round(yaw / TAU) * TAU;
}

function reset(rotation) {
  rotation.engaged = false;
  rotation.hoverYaw = rotation.hoverPitch = 0;
  rotation.targetYaw = restingYaw(rotation.yaw);
  rotation.targetPitch = 0;
}

function measurePivot(pivot, content) {
  pivot.updateWorldMatrix(true, true);
  const bounds = new Box3();
  const meshBounds = new Box3();
  const inverse = new Matrix4().copy(pivot.matrixWorld).invert();
  const transform = new Matrix4();
  content.traverse(mesh => {
    if (!mesh.isMesh) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    transform.multiplyMatrices(inverse, mesh.matrixWorld);
    bounds.union(meshBounds.copy(mesh.geometry.boundingBox).applyMatrix4(transform));
  });
  return bounds;
}

function projectSurface(pivot, half, camera, { width, height }, lane) {
  pivot.updateWorldMatrix(true, false);
  camera.updateWorldMatrix(true, false);
  const point = new Vector3();
  let left = width, top = height, right = 0, bottom = 0;
  for (const x of [-half.x, half.x]) {
    for (const y of [-half.y, half.y]) {
      for (const z of [-half.z, half.z]) {
        point.set(x, y, z).applyMatrix4(pivot.matrixWorld).project(camera);
        const px = (point.x + 1) * width / 2;
        const py = (1 - point.y) * height / 2;
        left = Math.min(left, px);
        right = Math.max(right, px);
        top = Math.min(top, py);
        bottom = Math.max(bottom, py);
      }
    }
  }
  const padding = 12;
  left = Math.max(lane.left, left - padding);
  top = Math.max(lane.top, top - padding);
  right = Math.min(lane.right, right + padding);
  bottom = Math.min(lane.bottom, bottom + padding);
  return [left, top, Math.max(0, right - left), Math.max(0, bottom - top)];
}

export default function ProductInspectionController({ children, section, inspectionRef, revealBounds }) {
  const pivotRef = useRef(null);
  const contentRef = useRef(null);
  const halfRef = useRef(null);
  const revealHalfRef = useRef(null);
  const reduced = useRef(false);
  const motion = useRef({
    yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0,
    hoverYaw: 0, hoverPitch: 0, engaged: false, dragging: false,
  });
  const invalidate = useThree(state => state.invalidate);

  useLayoutEffect(() => {
    const pivot = pivotRef.current;
    const content = contentRef.current;
    const bounds = measurePivot(pivot, content);
    if (bounds.isEmpty()) return;
    // Recenter in pivot space without changing the model's world position.
    const center = bounds.getCenter(new Vector3());
    pivot.position.add(center);
    content.position.sub(center);
    halfRef.current = bounds.getSize(new Vector3()).multiplyScalar(.5);
    if (revealBounds) {
      const lower = new Vector3().fromArray(revealBounds.min).sub(center);
      const upper = new Vector3().fromArray(revealBounds.max).sub(center);
      revealHalfRef.current = new Vector3(
        Math.max(Math.abs(lower.x), Math.abs(upper.x)),
        Math.max(Math.abs(lower.y), Math.abs(upper.y)),
        Math.max(Math.abs(lower.z), Math.abs(upper.z)),
      );
    }
    invalidate();
  }, [invalidate, revealBounds]);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { reduced.current = preference.matches; invalidate(); };
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, [invalidate]);

  useLayoutEffect(() => {
    const inspection = inspectionRef.current;
    const rotation = motion.current;
    if (!section) return;

    let gesture;
    const available = () => inspection.section === section;
    function end(event) {
      if (!gesture || (event?.pointerId !== undefined && event.pointerId !== gesture.id)) return;
      const { surface, id } = gesture;
      gesture = null;
      rotation.dragging = false;
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", end, true);
      window.removeEventListener("pointercancel", end, true);
      window.removeEventListener("pointerdown", cancelForPinch, true);
      surface.dataset.afCursor = "grab";
      if (surface.hasPointerCapture(id)) surface.releasePointerCapture(id);
      invalidate();
    }

    function steer(yaw, pitch) {
      if (!available()) return;
      rotation.engaged = true;
      rotation.targetYaw += yaw;
      rotation.targetPitch = Math.min(MAX_PITCH, Math.max(-MAX_PITCH, rotation.targetPitch + pitch));
      invalidate();
    }

    function cancelForPinch(event) {
      if (event.pointerType === "touch" && !event.isPrimary) end();
    }

    function down(event) {
      if (!available() || gesture || !event.isPrimary ||
          (event.pointerType !== "touch" && event.button !== 0)) return;
      const surface = event.currentTarget;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY,
        surface, touch: event.pointerType === "touch",
        pixelsPerTurn: Math.min(640, Math.max(220, surface.clientWidth * .9)) };
      if (!gesture.touch) event.preventDefault();
      window.addEventListener("pointermove", move, { capture: true, passive: true });
      window.addEventListener("pointerup", end, true);
      window.addEventListener("pointercancel", end, true);
      if (gesture.touch) window.addEventListener("pointerdown", cancelForPinch, true);
    }

    function move(event) {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (!available()) { end(event); return; }
      if (!gesture.touch && !(event.buttons & 1)) { end(event); return; }
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!rotation.dragging) {
        if (Math.hypot(dx, dy) < (gesture.touch ? 9 : 4)) return;
        if (gesture.touch && Math.abs(dy) >= Math.abs(dx)) {
          end(event);
          return;
        }
        rotation.dragging = true;
        if (!gesture.surface.hasPointerCapture(gesture.id)) {
          gesture.surface.setPointerCapture(gesture.id);
        }
        gesture.surface.dataset.afCursor = "grabbing";
      }
      gesture.x = event.clientX;
      gesture.y = event.clientY;
      steer(dx / gesture.pixelsPerTurn * TAU, dy * .0035);
    }

    const api = {
      down,
      follow(x, y) {
        if (!available() || gesture || rotation.engaged || reduced.current) return;
        rotation.hoverYaw = .14 * x;
        rotation.hoverPitch = -.085 * y;
        invalidate();
      },
      leave() {
        rotation.hoverYaw = rotation.hoverPitch = 0;
        invalidate();
      },
      turn: (yaw, pitch) => steer(yaw * Math.PI / 6, pitch * .06),
      reset() { end(); reset(rotation); invalidate(); },
    };
    inspection.api = api;
    inspection.refreshSurface = invalidate;
    invalidate();
    window.addEventListener("blur", end);

    return () => {
      if (inspection.api === api) {
        inspection.api = null;
        inspection.refreshSurface = null;
      }
      window.removeEventListener("blur", end);
      end();
      reset(rotation);
      invalidate();
    };
  }, [section, inspectionRef, invalidate]);

  useFrame(({ camera, size }, delta) => {
    const pivot = pivotRef.current;
    const rotation = motion.current;
    const inspection = inspectionRef.current;
    if (inspection.exclusive) {
      rotation.yaw = rotation.pitch = rotation.targetYaw = rotation.targetPitch = 0;
      rotation.hoverYaw = rotation.hoverPitch = 0;
      rotation.engaged = false;
    }
    const half = inspection.section === "acoustic-reveal" && revealHalfRef.current
      ? revealHalfRef.current : halfRef.current;
    const alpha = reduced.current ? 1 : 1 - Math.exp(-Math.min(delta, .05) / (rotation.dragging ? .04 : .09));
    function approach(value, target) {
      if (Math.abs(value - target) <= EPSILON || alpha === 1) return target;
      invalidate();
      return value + (target - value) * alpha;
    }
    rotation.yaw = approach(rotation.yaw, rotation.targetYaw + (rotation.engaged ? 0 : rotation.hoverYaw));
    rotation.pitch = approach(rotation.pitch, rotation.targetPitch + (rotation.engaged ? 0 : rotation.hoverPitch));
    if (!rotation.engaged && !rotation.hoverYaw && rotation.yaw === rotation.targetYaw) rotation.yaw = rotation.targetYaw = 0;
    pivot.rotation.set(rotation.pitch, rotation.yaw, 0, "YXZ");
    if (section && inspection.section === section && inspection.lane && half && !rotation.dragging) {
      inspection.placeSurface?.(projectSurface(pivot, half, camera, size, inspection.lane));
    }
  });

  return (
    <group ref={pivotRef} name="AuralForgeSharedInspectionPivot">
      <group ref={contentRef} name="AuralForgeInspectionContent">{children}</group>
    </group>
  );
}
