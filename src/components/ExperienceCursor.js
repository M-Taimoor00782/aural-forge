"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  '[role="button"]',
  '[role="link"]',
  '[role="slider"]',
  "summary",
  "label[for]",
  '[data-af-cursor="interactive"]',
].join(", ");

const NATIVE_CURSOR_SELECTOR = [
  "input",
  "textarea",
  "select",
  '[contenteditable="true"]',
].join(", ");

const CURSOR_EVENT = "auralforge:cursor-state";

export default function ExperienceCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;

    if (!cursor) return;

    const root = document.documentElement;

    const pointerMedia = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

    const motionMedia = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let enabled = false;
    let positioned = false;
    let pressed = false;
    let forcedMode = null;

    let lastX = 0;
    let lastY = 0;

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
    });

    const moveX = gsap.quickTo(cursor, "x", {
      duration: 0.16,
      ease: "power2.out",
    });

    const moveY = gsap.quickTo(cursor, "y", {
      duration: 0.16,
      ease: "power2.out",
    });

    function isAvailable() {
      return (
        pointerMedia.matches &&
        !motionMedia.matches
      );
    }

    function setMode(mode) {
      if (!enabled) return;

      cursor.dataset.mode = mode;
    }

    function modeFromElement(element) {
      if (!(element instanceof Element)) {
        return "default";
      }

      if (
        element.closest(
          NATIVE_CURSOR_SELECTOR
        )
      ) {
        return "native";
      }

      if (
        element.closest(
          '[data-af-cursor="grabbing"]'
        )
      ) {
        return "grabbing";
      }

      if (
        element.closest(
          '[data-af-cursor="grab"]'
        )
      ) {
        return "grab";
      }

      if (
        element.closest(
          INTERACTIVE_SELECTOR
        )
      ) {
        return "interactive";
      }

      return "default";
    }

    function refreshMode(target) {
      if (!enabled) return;

      const mode =
        forcedMode ??
        modeFromElement(target);

      const nextMode =
        pressed && mode === "grab"
          ? "grabbing"
          : pressed && mode === "interactive"
            ? "pressed"
            : mode;

      setMode(nextMode);

      cursor.style.opacity =
        nextMode === "native" ? "0" : "1";
    }

    function activate() {
      if (!isAvailable()) return;

      enabled = true;

      root.classList.add(
        "af-custom-cursor-active"
      );
    }

    function deactivate() {
      enabled = false;
      positioned = false;
      pressed = false;
      forcedMode = null;

      root.classList.remove(
        "af-custom-cursor-active"
      );

      cursor.style.opacity = "0";
      cursor.dataset.mode = "default";
    }

    function handlePointerMove(event) {
      if (!isAvailable()) {
        if (enabled) deactivate();
        return;
      }

      // Touch and pen input always retain
      // the device's native interaction.
      if (event.pointerType !== "mouse") {
        if (enabled) deactivate();
        return;
      }

      if (!enabled) activate();

      lastX = event.clientX;
      lastY = event.clientY;

      if (!positioned) {
        gsap.set(cursor, {
          x: lastX,
          y: lastY,
        });

        positioned = true;
      } else {
        moveX(lastX);
        moveY(lastY);
      }

      refreshMode(event.target);
    }

    function handlePointerOver(event) {
      refreshMode(event.target);
    }

    function handlePointerDown(event) {
      if (
        !enabled ||
        event.pointerType !== "mouse"
      ) {
        return;
      }

      pressed = true;
      refreshMode(event.target);
    }

    function handlePointerUp(event) {
      pressed = false;

      refreshMode(
        event.target instanceof Element
          ? event.target
          : document.elementFromPoint(
              lastX,
              lastY
            )
      );
    }

    function handlePointerLeave(event) {
      if (!event.relatedTarget) {
        cursor.style.opacity = "0";
      }
    }

    function handleDragState(event) {
      // Future 3D inspection controller:
      // "grab" | "grabbing" | "default".
      const mode = event.detail?.mode;

      forcedMode =
        mode === "grab" ||
        mode === "grabbing"
          ? mode
          : null;

      refreshMode(
        document.elementFromPoint(
          lastX,
          lastY
        )
      );
    }

    function handleAvailabilityChange() {
      if (!isAvailable()) {
        deactivate();
      }
    }

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    document.addEventListener(
      "pointerover",
      handlePointerOver
    );

    window.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    window.addEventListener(
      "pointercancel",
      handlePointerUp
    );

    document.addEventListener(
      "pointerout",
      handlePointerLeave
    );

    window.addEventListener(
      CURSOR_EVENT,
      handleDragState
    );

    window.addEventListener(
      "blur",
      deactivate
    );

    pointerMedia.addEventListener(
      "change",
      handleAvailabilityChange
    );

    motionMedia.addEventListener(
      "change",
      handleAvailabilityChange
    );

    return () => {
      deactivate();

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      document.removeEventListener(
        "pointerover",
        handlePointerOver
      );

      window.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );

      window.removeEventListener(
        "pointercancel",
        handlePointerUp
      );

      document.removeEventListener(
        "pointerout",
        handlePointerLeave
      );

      window.removeEventListener(
        CURSOR_EVENT,
        handleDragState
      );

      window.removeEventListener(
        "blur",
        deactivate
      );

      pointerMedia.removeEventListener(
        "change",
        handleAvailabilityChange
      );

      motionMedia.removeEventListener(
        "change",
        handleAvailabilityChange
      );

      gsap.killTweensOf(cursor);
    };
  }, []);

  return (
    <>
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          html.af-custom-cursor-active,
          html.af-custom-cursor-active body,
          html.af-custom-cursor-active
            *:not(input):not(textarea):not(select):not([contenteditable="true"]) {
            cursor: none !important;
          }
        }

        .af-experience-cursor {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 2147483647;
          width: 17px;
          height: 17px;
          border: 1px solid #ffffff;
          border-radius: 50%;
          background: transparent;
          color: #ffffff;
          opacity: 0;
          pointer-events: none;
          mix-blend-mode: difference;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          will-change: transform;
          transition:
            width 180ms ease,
            height 180ms ease,
            background-color 180ms ease,
            border-color 180ms ease,
            opacity 120ms ease;
        }

        .af-experience-cursor::before {
          content: "";
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: currentColor;
        }

        .af-experience-cursor[data-mode="interactive"] {
          width: 37px;
          height: 37px;
          background: rgba(255,255,255,0.08);
        }

        .af-experience-cursor[data-mode="pressed"] {
          width: 27px;
          height: 27px;
          background: rgba(255,255,255,0.2);
        }

        .af-experience-cursor[data-mode="grab"],
        .af-experience-cursor[data-mode="grabbing"] {
          width: 68px;
          height: 68px;
          background: rgba(255,255,255,0.1);
        }

        .af-experience-cursor[data-mode="grabbing"] {
          width: 74px;
          height: 74px;
          background: rgba(255,255,255,0.22);
        }

        .af-experience-cursor[data-mode="grab"]::before,
        .af-experience-cursor[data-mode="grabbing"]::before {
          display: none;
        }

        .af-experience-cursor-label {
          display: none;
          font-family: "Geist Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          font-weight: 600;
        }

        .af-experience-cursor[data-mode="grab"]
          .af-experience-cursor-label,
        .af-experience-cursor[data-mode="grabbing"]
          .af-experience-cursor-label {
          display: block;
        }

        .af-experience-cursor[data-mode="grabbing"]
          .af-experience-cursor-label::after {
          content: "MOVE";
        }

        .af-experience-cursor[data-mode="grab"]
          .af-experience-cursor-label::after {
          content: "DRAG";
        }

        @media (hover: none), (pointer: coarse),
          (prefers-reduced-motion: reduce) {
          .af-experience-cursor {
            display: none !important;
          }
        }
      `}</style>

      <div
        ref={cursorRef}
        className="af-experience-cursor"
        data-mode="default"
        aria-hidden="true"
      >
        <span className="af-experience-cursor-label" />
      </div>
    </>
  );
}
