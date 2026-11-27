"use client";

import { useCallback } from "react";
import styles from "./ProductInspectionControls.module.css";

const KEY_ROTATIONS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export default function ProductInspectionControls({ section, inspectionRef }) {
  const registerSurface = useCallback(node => {
    if (!node) return;
    const inspection = inspectionRef.current;
    let previous;
    function place(bounds) {
      const [left, top, width, height] = bounds.map(Math.round);
      const key = `${left},${top},${width},${height}`;
      if (key === previous) return;
      previous = key;
      Object.assign(node.style, {
        left: `${left}px`, top: `${top}px`,
        width: `${width}px`, height: `${height}px`,
        visibility: width > 0 && height > 0 ? "visible" : "hidden",
      });
    }
    inspection.placeSurface = place;
    inspection.refreshSurface?.();
    return () => {
      if (document.activeElement === node) {
        node.closest("section")?.focus({ preventScroll: true });
      }
      if (inspection.placeSurface === place) inspection.placeSurface = null;
    };
  }, [inspectionRef]);

  function handleKey(event) {
    const direction = KEY_ROTATIONS[event.key];
    const reset = event.key === "Home" || event.key === "Escape";
    const api = inspectionRef.current.api;
    if (!api || (!direction && !reset)) return;
    event.preventDefault();
    if (reset) api.reset();
    else api.turn(...direction);
  }

  return (
    <div className={styles.surface} data-inspection-section={section} data-af-cursor="grab"
      ref={registerSurface} role="application" tabIndex={0}
      aria-label="3D product inspection" aria-describedby="inspection-instructions"
      onKeyDown={handleKey}
      onPointerDown={section === "hero" ? undefined : event => inspectionRef.current.api?.down(event)}>
      <span id="inspection-instructions" className={styles.instructions}>
        Use the left and right arrow keys to rotate, and the up and down arrow keys to tilt.
        Press Home or Escape to reset. Press Tab to continue.
        Drag with a mouse or swipe sideways on a touchscreen to rotate. Swipe vertically to scroll.
      </span>
    </div>
  );
}

