"use client";

import { useEffect, useRef } from "react";

const ROOT_CLASS = "af-custom-cursor-active";

const SELECTABLE = [
  "a[href]",
  "button",
  "summary",
  "select",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[data-af-cursor='interactive']",
].join(",");

const EDITABLE = [
  "input:not([type='button']):not([type='submit']):not([type='reset'])",
  "textarea",
  "select",
  "[contenteditable='true']",
].join(",");

function setXY(element, x, y, centered = false) {
  if (!element) return;

  element.style.transform = centered
    ? `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    : `translate3d(${x}px, ${y}px, 0)`;
}

export default function ExperienceCursor() {
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const arrowRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const arrow = arrowRef.current;
    const label = labelRef.current;

    if (!root || !dot || !ring || !arrow || !label) {
      return;
    }

    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const cursorCss = document.createElement("style");

    cursorCss.dataset.auralForgeCursor = "true";

    cursorCss.textContent = `
      html.${ROOT_CLASS},
      html.${ROOT_CLASS} body,
      html.${ROOT_CLASS} * {
        cursor: none !important;
      }

      html.${ROOT_CLASS} input:not([type="button"]):not([type="submit"]):not([type="reset"]),
      html.${ROOT_CLASS} textarea,
      html.${ROOT_CLASS} select,
      html.${ROOT_CLASS} [contenteditable="true"] {
        cursor: text !important;
      }
    `;

    document.head.appendChild(cursorCss);

    const point = { x: 0, y: 0 };
    const ringPosition = { x: 0, y: 0 };
    const arrowPosition = { x: 0, y: 0 };

    let enabled = false;
    let inside = false;
    let initialized = false;
    let isEditable = false;
    let isSelectable = false;
    let isPressed = false;
    let inspecting = false;

    let frame = 0;
    let previousTime = 0;

    function setVisible(visible) {
      root.style.opacity =
        enabled && inside && visible && !isEditable
          ? "1"
          : "0";
    }

    function updateFeedback() {
      const interactive =
        inspecting || isSelectable;

      ring.style.width = interactive
        ? "42px"
        : "34px";

      ring.style.height = interactive
        ? "42px"
        : "34px";

      ring.style.borderColor = inspecting
        ? "#F6B54E"
        : isSelectable
          ? "#F3F3F4"
          : "rgba(243,243,244,0.75)";

      ring.style.background = inspecting
        ? "rgba(246,181,78,0.09)"
        : "rgba(243,243,244,0.035)";

      dot.style.background = inspecting
        ? "#F6B54E"
        : "#F3F3F4";

      dot.style.width = isPressed
        ? "5px"
        : "4px";

      dot.style.height = isPressed
        ? "5px"
        : "4px";

      const hint = inspecting
        ? "MOVE"
        : isSelectable
          ? "SELECT"
          : "";

      label.textContent = hint;

      label.style.opacity = hint
        ? "1"
        : "0";
    }

    function schedule() {
      if (
        !frame &&
        enabled &&
        inside &&
        initialized
      ) {
        previousTime = 0;

        frame = window.requestAnimationFrame(
          animate
        );
      }
    }

    function animate(timestamp) {
      frame = 0;

      if (!enabled || !inside) {
        return;
      }

      const delta = previousTime
        ? Math.min(
            0.064,
            (timestamp - previousTime) / 1000
          )
        : 1 / 60;

      previousTime = timestamp;

      // 1. Dot is fixed to the actual pointer.
      setXY(
        dot,
        point.x,
        point.y,
        true
      );

      // 2. Ring follows quickly.
      const ringAlpha =
        1 - Math.exp(-delta / 0.048);

      ringPosition.x +=
        (point.x - ringPosition.x) *
        ringAlpha;

      ringPosition.y +=
        (point.y - ringPosition.y) *
        ringAlpha;

      setXY(
        ring,
        ringPosition.x,
        ringPosition.y,
        true
      );

      // 3. Arrow follows independently.
      // It remains above and left of the
      // circle, never ahead/right.
      const arrowAlpha =
        1 - Math.exp(-delta / 0.17);

      const arrowTargetX =
        point.x - 13;

      const arrowTargetY =
        point.y - 22;

      arrowPosition.x +=
        (arrowTargetX - arrowPosition.x) *
        arrowAlpha;

      arrowPosition.y +=
        (arrowTargetY - arrowPosition.y) *
        arrowAlpha;

      arrowPosition.x = Math.min(
        arrowPosition.x,
        ringPosition.x - 12
      );

      arrowPosition.y = Math.min(
        arrowPosition.y,
        ringPosition.y - 17
      );

      setXY(
        arrow,
        arrowPosition.x,
        arrowPosition.y
      );

      setXY(
        label,
        ringPosition.x + 29,
        ringPosition.y + 27
      );

      const unsettled =
        Math.abs(
          point.x - ringPosition.x
        ) > 0.1 ||
        Math.abs(
          point.y - ringPosition.y
        ) > 0.1 ||
        Math.abs(
          arrowTargetX - arrowPosition.x
        ) > 0.1 ||
        Math.abs(
          arrowTargetY - arrowPosition.y
        ) > 0.1;

      if (unsettled) {
        frame = window.requestAnimationFrame(
          animate
        );
      }
    }

    function updateMode() {
      enabled =
        finePointer.matches &&
        !reducedMotion.matches;

      document.documentElement.classList.toggle(
        ROOT_CLASS,
        enabled
      );

      if (!enabled) {
        inside = false;
        inspecting = false;
        isPressed = false;
        isEditable = false;
        isSelectable = false;

        if (frame) {
          window.cancelAnimationFrame(frame);
        }

        frame = 0;
      }

      updateFeedback();
      setVisible(enabled);
    }

    function onPointerMove(event) {
      if (
        !enabled ||
        event.pointerType === "touch"
      ) {
        return;
      }

      const target = event.target;

      isEditable =
        target instanceof Element &&
        Boolean(
          target.closest(EDITABLE)
        );

      isSelectable =
        target instanceof Element &&
        Boolean(
          target.closest(SELECTABLE)
        );

      point.x = event.clientX;
      point.y = event.clientY;

      inside = true;

      if (!initialized) {
        initialized = true;

        ringPosition.x = point.x;
        ringPosition.y = point.y;

        arrowPosition.x =
          point.x - 13;

        arrowPosition.y =
          point.y - 22;

        setXY(
          ring,
          ringPosition.x,
          ringPosition.y,
          true
        );

        setXY(
          arrow,
          arrowPosition.x,
          arrowPosition.y
        );
      }

      // Dot updates immediately, even
      // between animation frames.
      setXY(
        dot,
        point.x,
        point.y,
        true
      );

      updateFeedback();
      setVisible(true);
      schedule();
    }

    function onPointerDown(event) {
      if (
        !enabled ||
        event.pointerType === "touch"
      ) {
        return;
      }

      isPressed = true;
      updateFeedback();
    }

    function onPointerUp() {
      isPressed = false;
      updateFeedback();
    }

    // Event emitted by the shared 3D
    // ProductInspectionController.
    function onInspection(event) {
      inspecting = Boolean(
        event.detail?.active ??
        event.detail?.dragging
      );

      updateFeedback();
      schedule();
    }

    function onPointerOut(event) {
      if (!event.relatedTarget) {
        inside = false;
        setVisible(false);

        if (frame) {
          window.cancelAnimationFrame(frame);
        }

        frame = 0;
      }
    }

    function onWindowBlur() {
      inside = false;
      inspecting = false;
      isPressed = false;

      updateFeedback();
      setVisible(false);
    }

    window.addEventListener(
      "pointermove",
      onPointerMove,
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      onPointerDown,
      { passive: true }
    );

    window.addEventListener(
      "pointerup",
      onPointerUp,
      { passive: true }
    );

    window.addEventListener(
      "pointercancel",
      onPointerUp,
      { passive: true }
    );

    document.addEventListener(
      "pointerout",
      onPointerOut
    );

    window.addEventListener(
      "blur",
      onWindowBlur
    );

    window.addEventListener(
      "aural-forge:inspection",
      onInspection
    );

    finePointer.addEventListener(
      "change",
      updateMode
    );

    reducedMotion.addEventListener(
      "change",
      updateMode
    );

    updateMode();

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener(
        "pointermove",
        onPointerMove
      );

      window.removeEventListener(
        "pointerdown",
        onPointerDown
      );

      window.removeEventListener(
        "pointerup",
        onPointerUp
      );

      window.removeEventListener(
        "pointercancel",
        onPointerUp
      );

      document.removeEventListener(
        "pointerout",
        onPointerOut
      );

      window.removeEventListener(
        "blur",
        onWindowBlur
      );

      window.removeEventListener(
        "aural-forge:inspection",
        onInspection
      );

      finePointer.removeEventListener(
        "change",
        updateMode
      );

      reducedMotion.removeEventListener(
        "change",
        updateMode
      );

      document.documentElement.classList.remove(
        ROOT_CLASS
      );

      cursorCss.remove();
    };
  }, []);

  const floating = {
    position: "fixed",
    top: 0,
    left: 0,
    pointerEvents: "none",
    willChange: "transform",
  };

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        pointerEvents: "none",
        opacity: 0,
        transition: "opacity 120ms ease",
      }}
    >
      {/* Arrow — behind and above the circle */}
      <div
        ref={arrowRef}
        style={{
          ...floating,
          zIndex: 1,
          width: 20,
          height: 26,
        }}
      >
        <svg
          width="20"
          height="26"
          viewBox="0 0 20 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            display: "block",
            overflow: "visible",
          }}
        >
          <path
            d="M1.5 1.5L1.5 19.2L6.5 15.4L10.8 24L14.2 22L10 13.4L17.5 12.8L1.5 1.5Z"
            fill="#F3F3F4"
            stroke="#0D0D0D"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Circular ring — follows closely */}
      <div
        ref={ringRef}
        style={{
          ...floating,
          zIndex: 2,
          width: 34,
          height: 34,
          border:
            "1.5px solid rgba(243,243,244,0.75)",
          borderRadius: "50%",
          background:
            "rgba(243,243,244,0.035)",
          boxSizing: "border-box",
          transition:
            "width 160ms ease, height 160ms ease, border-color 160ms ease, background-color 160ms ease",
        }}
      />

      {/* Center dot — exact pointer position */}
      <div
        ref={dotRef}
        style={{
          ...floating,
          zIndex: 3,
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#F3F3F4",
          boxShadow:
            "0 0 8px rgba(243,243,244,0.25)",
        }}
      />

      {/* Interaction feedback */}
      <div
        ref={labelRef}
        style={{
          ...floating,
          zIndex: 4,
          color: "#F3F3F4",
          fontFamily: "Inter, sans-serif",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.14em",
          whiteSpace: "nowrap",
          opacity: 0,
          transition: "opacity 160ms ease",
          textShadow:
            "0 1px 4px #0D0D0D",
        }}
      />
    </div>
  );
}
