"use client";

import { useEffect, useRef, useState } from "react";

const POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const RING_SIZE = 28;
const ICON_WIDTH = 22;
const ICON_HEIGHT = 30;

// Both icon paths have their pointed tip at (1.5, 1.5).
const TIP_OFFSET_X = (1.5 / 28) * ICON_WIDTH;
const TIP_OFFSET_Y = (1.5 / 38) * ICON_HEIGHT;

const ICON_FOLLOW = 0.44;
const MAX_ICON_LAG = 2.5;

const ARROW_PATH =
  "M1.5 1.5L20.5 19.5L12.6 20.8L17.9 31.8L13.6 33.2L8.3 22.2L1.5 27.8V1.5Z";

// One hand shape replaces the arrow.
// Its pointing-finger tip is aligned with the arrow tip.
const HAND_PATH =
  "M10 4 C10 2.5 11.2 1.5 12.5 1.5 " +
  "C14 1.5 15 2.6 15 4 V14 " +
  "C15 12.8 16 12 17.2 12 " +
  "C18.8 12 19.6 13 19.6 14.5 " +
  "C20.3 13.7 21 13.4 22.1 13.7 " +
  "C23.4 14 23.9 15 23.9 16 " +
  "C24.8 15.6 25.7 15.9 26.4 16.6 " +
  "C27.2 17.4 27.1 18.6 27 20 L26 26 " +
  "C25.5 29.5 23.1 32.5 19.5 33 H13.2 " +
  "C10.6 33 8.5 31.5 7.3 29.3 L2.8 21 " +
  "C2.3 19.8 2.8 18.2 4 17.5 " +
  "C5.1 16.8 6.5 17.1 7.4 18.3 L10 21 Z";

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  "summary",
  "select:not(:disabled)",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="switch"]',
  "[data-af-drawer-trigger]",
].join(", ");

const TEXT_SELECTOR = [
  "textarea",
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"])',
  '[contenteditable="true"]',
].join(", ");

const VALID_MODES = new Set([
  "default",
  "interactive",
  "pressed",
  "drag",
  "move",
  "grab",
  "grabbing",
]);

function resolveMode(target, pressed) {
  if (!(target instanceof Element)) {
    return "default";
  }

  const explicitElement = target.closest(
    "[data-af-cursor], [data-cursor]"
  );

  const declared = (
    explicitElement?.getAttribute("data-af-cursor") ??
    explicitElement?.getAttribute("data-cursor") ??
    ""
  ).toLowerCase().trim();

  let mode = "default";

  if (VALID_MODES.has(declared)) {
    mode = declared;
  } else if (target.closest(TEXT_SELECTOR)) {
    mode = "text";
  } else if (target.closest(INTERACTIVE_SELECTOR)) {
    mode = "interactive";
  } else {
    const cssCursor = window.getComputedStyle(target).cursor;

    if (cssCursor === "grab") mode = "grab";
    else if (cssCursor === "grabbing") mode = "grabbing";
    else if (cssCursor === "move") mode = "move";
    else if (cssCursor === "pointer") mode = "interactive";
  }

  if (pressed) {
    if (mode === "drag" || mode === "grab" || mode === "grabbing") {
      return "grabbing";
    }

    if (mode === "interactive") {
      return "pressed";
    }
  }

  return mode;
}

export default function ExperienceCursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState("default");
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  const ringRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia(POINTER_QUERY);
    const update = () => setEnabled(media.matches);

    update();
    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const ring = ringRef.current;
    const icon = iconRef.current;

    if (!ring || !icon) return;

    const root = document.documentElement;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const pointer = { x: 0, y: 0 };
    const iconPosition = { x: 0, y: 0 };

    let positioned = false;
    let down = false;
    let currentMode = "default";
    let currentVisible = false;
    let frame = 0;

    const setCursorVisible = (next) => {
      if (next !== currentVisible) {
        currentVisible = next;
        setVisible(next);
      }
    };

    const setCursorMode = (target) => {
      const next = resolveMode(target, down);

      if (next !== currentMode) {
        currentMode = next;
        setMode(next);
      }

      setCursorVisible(positioned && next !== "text");
    };

    const drawRing = () => {
      ring.style.transform = `translate3d(${
        pointer.x - RING_SIZE / 2
      }px, ${pointer.y - RING_SIZE / 2}px, 0)`;
    };

    const getIconTarget = () => ({
      x: pointer.x - TIP_OFFSET_X,
      y: pointer.y - TIP_OFFSET_Y,
    });

    const drawIcon = () => {
      icon.style.transform = `translate3d(${
        iconPosition.x
      }px, ${iconPosition.y}px, 0)`;
    };

    const stopAnimation = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const tick = () => {
      frame = 0;

      if (!positioned) return;

      const target = getIconTarget();

      if (reducedMotion.matches) {
        iconPosition.x = target.x;
        iconPosition.y = target.y;
      } else {
        iconPosition.x +=
          (target.x - iconPosition.x) * ICON_FOLLOW;

        iconPosition.y +=
          (target.y - iconPosition.y) * ICON_FOLLOW;

        const dx = target.x - iconPosition.x;
        const dy = target.y - iconPosition.y;
        const distance = Math.hypot(dx, dy);

        // Never let the arrow/hand float away
        // from the ring's center dot.
        if (distance > MAX_ICON_LAG) {
          const ratio = MAX_ICON_LAG / distance;

          iconPosition.x = target.x - dx * ratio;
          iconPosition.y = target.y - dy * ratio;
        }
      }

      drawIcon();

      const remaining = Math.hypot(
        target.x - iconPosition.x,
        target.y - iconPosition.y
      );

      if (remaining > 0.08) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    const schedule = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    const updatePointer = (event) => {
      if (event.pointerType !== "mouse") {
        setCursorVisible(false);
        return;
      }

      pointer.x = event.clientX;
      pointer.y = event.clientY;

      drawRing();

      if (!positioned) {
        positioned = true;

        const target = getIconTarget();
        iconPosition.x = target.x;
        iconPosition.y = target.y;

        drawIcon();
      } else {
        schedule();
      }

      const target =
        document.elementFromPoint(pointer.x, pointer.y) ||
        event.target;

      setCursorMode(target);
    };

    const onDown = (event) => {
      if (event.pointerType !== "mouse") return;

      down = true;
      setPressed(true);
      setCursorMode(
        document.elementFromPoint(event.clientX, event.clientY) ||
          event.target
      );
    };

    const onUp = (event) => {
      if (event.pointerType !== "mouse") return;

      down = false;
      setPressed(false);
      setCursorMode(
        document.elementFromPoint(event.clientX, event.clientY) ||
          event.target
      );
    };

    const onCancel = () => {
      down = false;
      setPressed(false);
    };

    const onMouseOut = (event) => {
      if (event.relatedTarget !== null) return;

      positioned = false;
      down = false;

      stopAnimation();
      setPressed(false);
      setCursorVisible(false);
    };

    const onBlur = () => {
      positioned = false;
      down = false;

      stopAnimation();
      setPressed(false);
      setCursorVisible(false);
    };

    const onScroll = () => {
      if (!positioned) return;

      setCursorMode(
        document.elementFromPoint(pointer.x, pointer.y)
      );
    };

    // Single custom cursor owns pointer presentation.
    // Suppress native link/button hand cursors.
    root.setAttribute("data-af-single-cursor", "on");

    document.addEventListener("pointermove", updatePointer, true);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onCancel, true);
    document.addEventListener("mouseout", onMouseOut, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      stopAnimation();
      root.removeAttribute("data-af-single-cursor");

      document.removeEventListener("pointermove", updatePointer, true);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
      document.removeEventListener("mouseout", onMouseOut, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);

  if (!enabled) return null;

  const showHand = mode === "interactive" || mode === "pressed";

  const label =
    mode === "move"
      ? "MOVE"
      : ["drag", "grab", "grabbing"].includes(mode)
        ? "DRAG"
        : "";

  return (
    <>
      <div
        className="af-single-cursor"
        data-visible={visible}
        data-mode={mode}
        data-pressed={pressed}
        aria-hidden="true"
      >
        <div ref={ringRef} className="af-single-cursor-ring">
          <span className="af-single-cursor-outline" />
          <span className="af-single-cursor-dot" />

          {label && (
            <span className="af-single-cursor-label">
              {label}
            </span>
          )}
        </div>

        {/* Exactly ONE icon exists in the DOM.
            The same SVG changes between arrow and hand. */}
        <svg
          ref={iconRef}
          className="af-single-cursor-icon"
          width={ICON_WIDTH}
          height={ICON_HEIGHT}
          viewBox="0 0 28 38"
          xmlns="http://www.w3.org/2000/svg"
          focusable="false"
        >
          <path
            d={showHand ? HAND_PATH : ARROW_PATH}
            transform={showHand ? "translate(-11 0)" : undefined}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.45"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <style>{`
        @media (hover: hover) and (pointer: fine) {
          html[data-af-single-cursor="on"],
          html[data-af-single-cursor="on"] *,
          html[data-af-single-cursor="on"] *::before,
          html[data-af-single-cursor="on"] *::after {
            cursor: none !important;
          }

          html[data-af-single-cursor="on"] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]),
          html[data-af-single-cursor="on"] textarea,
          html[data-af-single-cursor="on"] [contenteditable="true"] {
            cursor: text !important;
          }
        }

        .af-single-cursor {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          pointer-events: none;
          visibility: hidden;
          opacity: 0;
          color: #F3F3F4;
          transition: opacity 120ms ease, visibility 120ms ease;
        }

        .af-single-cursor[data-visible="true"] {
          visibility: visible;
          opacity: 1;
        }

        /* Light-mode arrow is SOLID BLACK. */
        :root[data-af-theme="light"] .af-single-cursor {
          color: #111111;
        }

        :root[data-af-theme="dark"] .af-single-cursor {
          color: #F3F3F4;
        }

        .af-single-cursor-ring {
          position: absolute;
          left: 0;
          top: 0;
          width: ${RING_SIZE}px;
          height: ${RING_SIZE}px;
          z-index: 2;
          pointer-events: none;
          will-change: transform;
        }

        /* Exactly ONE ring border. */
        .af-single-cursor-outline {
          position: absolute;
          inset: 0;
          box-sizing: border-box;
          border: 1.5px solid currentColor;
          border-radius: 50%;
          background: transparent;
          transition:
            border-color 140ms ease,
            background-color 140ms ease,
            transform 140ms ease;
        }

        .af-single-cursor-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: currentColor;
          transform: translate(-50%, -50%);
        }

        .af-single-cursor-icon {
          position: absolute;
          left: 0;
          top: 0;
          z-index: 1;
          overflow: visible;
          pointer-events: none;
          will-change: transform;
        }

        /* af-hand-layer-fix-v1
           Keep the default arrow behind the ring.
           Bring the hand in front of the filled
           interactive ring so it remains visible. */
        .af-single-cursor[data-mode="interactive"]
          .af-single-cursor-icon,
        .af-single-cursor[data-mode="pressed"]
          .af-single-cursor-icon {
          z-index: 3;
        }
        /* Interactive ring treatment. */
        .af-single-cursor[data-mode="interactive"]
          .af-single-cursor-outline,
        .af-single-cursor[data-mode="pressed"]
          .af-single-cursor-outline {
          background: var(--af-accent, #F6B54E);
          border-color: var(--af-accent, #F6B54E);
        }

        .af-single-cursor[data-mode="interactive"]
          .af-single-cursor-dot,
        .af-single-cursor[data-mode="pressed"]
          .af-single-cursor-dot {
          background: var(--af-background, #0D0D0D);
        }

        .af-single-cursor[data-mode="drag"]
          .af-single-cursor-outline,
        .af-single-cursor[data-mode="move"]
          .af-single-cursor-outline,
        .af-single-cursor[data-mode="grab"]
          .af-single-cursor-outline,
        .af-single-cursor[data-mode="grabbing"]
          .af-single-cursor-outline {
          border-color: var(--af-accent, #F6B54E);
        }

        .af-single-cursor[data-pressed="true"]
          .af-single-cursor-outline {
          transform: scale(0.94);
        }

        .af-single-cursor-label {
          position: absolute;
          left: 50%;
          top: calc(100% + 12px);
          transform: translateX(-50%);
          padding: 5px 8px;
          border-radius: 5px;
          background: var(--af-surface, #1A1819);
          border: 1px solid var(--af-border-strong, currentColor);
          color: var(--af-text-primary, #F3F3F4);
          font: 700 9px/1.2 Inter, sans-serif;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }

        @media (prefers-reduced-motion: reduce) {
          .af-single-cursor,
          .af-single-cursor-outline {
            transition: none;
          }
        }

        @media (hover: none), (pointer: coarse) {
          .af-single-cursor {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

