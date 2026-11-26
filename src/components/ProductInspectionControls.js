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
  const registerOverlay = useCallback(node => {
    if (!node) return;
    const inspection = inspectionRef.current;
    function place(lane) {
      if (!lane) return;
      Object.assign(node.style, {
        left: `${lane.left}px`, top: `${lane.top}px`,
        width: `${Math.max(0, lane.right - lane.left)}px`,
        height: `${Math.max(0, lane.bottom - lane.top)}px`,
      });
    }
    inspection.placeOverlay = place;
    place(inspection.lane);
    return () => {
      if (node.contains(document.activeElement)) {
        node.closest("section")?.focus({ preventScroll: true });
      }
      if (inspection.placeOverlay === place) inspection.placeOverlay = null;
    };
  }, [inspectionRef]);

  function handleKey(event) {
    const direction = KEY_ROTATIONS[event.key];
    const reset = event.key === "Home" || event.key === "Escape";
    if (!direction && !reset) return;
    event.preventDefault();
    const api = inspectionRef.current.api;
    if (reset) api?.reset();
    else api?.turn(...direction);
  }

  return (
    <div className={styles.overlay} data-inspection-section={section} ref={registerOverlay}>
      <div className={styles.surface} data-af-cursor="grab" aria-hidden="true"
        onPointerDown={event => inspectionRef.current.api?.down(event)}
        onPointerMove={event => inspectionRef.current.api?.move(event)}
        onPointerUp={event => inspectionRef.current.api?.end(event)}
        onPointerCancel={event => inspectionRef.current.api?.end(event)}
        onLostPointerCapture={event => inspectionRef.current.api?.end(event)} />
      <div className={styles.controls} role="group" aria-label="Product inspection">
        <span id="inspection-instructions" className={styles.instructions}>
          Drag the product or use the left and right arrow keys to rotate.
          Use the up and down arrow keys to tilt and Home to reset.
          On touchscreens, swipe sideways to rotate or vertically to scroll.
        </span>
        <button type="button" aria-describedby="inspection-instructions" onKeyDown={handleKey}
          onClick={() => inspectionRef.current.api?.turn(1, 0)}>
          Rotate Product
        </button>
        <button type="button" aria-label="Reset product orientation"
          onClick={() => inspectionRef.current.api?.reset()}>Reset</button>
      </div>
    </div>
  );
}

