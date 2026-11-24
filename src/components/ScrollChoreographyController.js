"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCROLL_CHOREOGRAPHY } from "@/config/scrollChoreography";
import { resolveProductState } from "@/config/productStates";
import { createScrollChoreographyTimeline } from "@/lib/createScrollChoreographyTimeline";
import { fitStagePose } from "@/lib/responsiveComposition";
import { phase } from "@/lib/animateProductReveal";

gsap.registerPlugin(ScrollTrigger);
const fraction = (y, start, end) => gsap.utils.clamp(0, 1, (y - start) / Math.max(1, end - start));

function fittedStoryPoses(viewport, rig, sections) {
  const { width, height } = viewport;
  const portrait = matchMedia("(max-aspect-ratio: 3/4)").matches;
  const camera = rig.camera(viewport);
  const halfHeight = camera.position[2] * Math.tan(camera.fov * Math.PI / 360);
  const pixelSize = 2 * halfHeight / height;
  let hero = { camera, product: {
    rotation: [0, 0, 0], scale: portrait ? .82 : .9,
    position: [portrait ? 0 : Math.min(.19 * width, 270) * pixelSize,
      portrait ? -Math.max(.1 * height, 392 - .5 * height) * pixelSize : 0, 0],
  } };
  if (portrait && rig.fitPortraitHero) {
    const section = sections[0];
    const origin = section.getBoundingClientRect().top;
    const top = section.querySelector("[data-hero-copy]").getBoundingClientRect().bottom - origin + 12;
    const bottom = section.querySelector("[data-hero-action]").getBoundingClientRect().top - origin - 12;
    if (bottom > top) {
      hero = fitStagePose(rig.expandedBounds, [0, 0, 0], camera, viewport,
        { left: width * .06, right: width * .94, top, bottom }, .94);
    }
  }
  const rest = [[1, -.26], [2, .12], [4, -.18], [5, .22]].map(([i, yaw]) => {
    const copy = sections[i].firstElementChild.getBoundingClientRect();
    const rightCopy = i !== 5;
    const gap = Math.max(18, width * .035);
    const left = rightCopy ? width * .06 : copy.right + gap;
    const right = rightCopy ? copy.left - gap : width * .94;
    // A resize or drawer scroll lock can leave the copy occupying the side lane.
    // Use the stacked composition whenever its measured width cannot fit a product.
    const region = portrait || right - left < width * .14
      ? { left: width * .07, right: width * .93, top: height * .40, bottom: height * .94 }
      : { left, right, top: height * .16, bottom: height * .86 };
    return fitStagePose(rig.bounds, [0, yaw, 0],
      camera, viewport, region, .83);
  });
  return [hero, rest[0], rest[1], null, rest[2], rest[3]];
}

// Single scroll owner for the narrative root, camera and mechanical progress.
// Family handoffs act on an outer group; inspection acts on a nested pivot.
export default function ScrollChoreographyController({ productRootRef, rig, onChoreographyActiveChange }) {
  const get = useThree(state => state.get);
  useLayoutEffect(() => {
    const root = productRootRef.current;
    const { camera, gl, invalidate } = get();
    const canvasContainer = gl.domElement.parentElement;
    const ids = ["hero", ...SCROLL_CHOREOGRAPHY.map(s => s.toSectionId)];
    const sections = ids.map(id => document.getElementById(id));
    if (!root || sections.some(el => !el)) return;
    const reveal = sections[3];
    const frame = reveal.querySelector("[data-reveal-frame]");
    const slot = reveal.querySelector("[data-reveal-slot]");
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let portrait, viewport;
    let centers, top, end, arrival, poses, timelines = [];
    let active;

    function measure() {
      // The banner animates the Canvas ancestor. Measure its layout size,
      // independent of that transform and in the same pass as the CSS slot.
      viewport = { width: canvasContainer.clientWidth, height: canvasContainer.clientHeight };
      portrait = matchMedia("(max-aspect-ratio: 3/4)").matches;
      const y = window.scrollY;
      const height = viewport.height;
      centers = sections.map(el => {
        const rect = el.getBoundingClientRect();
        return y + rect.top + (rect.height - height) / 2;
      });
      top = y + reveal.getBoundingClientRect().top;
      end = top + Math.max(0, reveal.offsetHeight - frame.offsetHeight);
      arrival = top - height;
      const rect = slot.getBoundingClientRect();
      const frameY = frame.getBoundingClientRect().top;
      poses = rig.camera ? fittedStoryPoses(viewport, rig, sections) :
        ["hero", "performanceDetail", "performanceDetail", "acousticReveal", "configurator", "finale"]
          .map(name => resolveProductState(name, { viewport, modelBounds: rig.bounds }));
      const cameraPose = rig.camera ? poses[0].camera : poses[3].camera;
      poses[3] = fitStagePose(rig.expandedBounds, rig.camera ? [-.07, -.23, 0] : [.03, -.77, -.035],
        cameraPose, viewport, { left: rect.left, right: rect.right,
          top: rect.top - frameY, bottom: rect.bottom - frameY }, .93);
      timelines.forEach(t => t.kill());
      timelines = SCROLL_CHOREOGRAPHY.map((segment, i) => createScrollChoreographyTimeline({
        productRoot: root, camera, viewport, segment, invalidate, from: poses[i], to: poses[i + 1],
        modelBounds: !rig.camera && i !== 2 && i !== 3 ? rig.bounds : null,
      }));
    }

    function update(y) {
      const h = viewport.height;
      const reduced = preference.matches;
      const inspecting = y <= centers[0] + 1 || y >= centers[5];
      if (active !== !inspecting) {
        active = !inspecting;
        onChoreographyActiveChange(active);
      }
      let part = 0, display = 1;
      if (y < centers[2]) {
        const i = y < centers[1] ? 0 : 1;
        const t = fraction(y, centers[i], centers[i + 1]);
        timelines[i].sample(reduced ? Number(t >= .5) : t);
      } else if (y < arrival) {
        const t = fraction(y, centers[2], arrival);
        timelines[2].sample(reduced ? Number(t >= .6) : t);
        display = reduced ? Number(t < .6) : 1 - phase(t, .25, .9);
        if (portrait && !reduced) {
          const depth = camera.position.z - root.position.z;
          root.position.y -= phase(t, .5, 1) * 2 * depth * Math.tan(camera.fov * Math.PI / 360);
        }
      } else if (y <= end) {
        timelines[2].sample(1);
        display = 0;
        part = reduced ? 1 : phase(fraction(y, top, end), .08, .94);
        // On portrait the incoming copy crosses the screen vertically. Bring
        // the object in with the lower cell instead of crossing the heading.
        if (portrait && y < top) {
          const depth = camera.position.z - root.position.z;
          root.position.y -= (top - y) * 2 * depth * Math.tan(camera.fov * Math.PI / 360) / h;
        }
      } else if (y < centers[4]) {
        const t = fraction(y, end, centers[4]);
        timelines[3].sample(reduced ? Number(t >= .65) : t);
        part = reduced ? Number(t < .65) : 1 - phase(t, .02, .55);
        display = reduced ? Number(t >= .65) : phase(t, .55, .96);
      } else {
        const t = fraction(y, centers[4], centers[5]);
        timelines[4].sample(reduced ? Number(t >= .5) : t);
      }
      rig.sample(part, display);
      invalidate();
    }

    measure();
    const trigger = ScrollTrigger.create({
      trigger: sections[0], start: "top top", endTrigger: sections[5], end: "bottom top",
      onUpdate: self => update(self.scroll()),
      onRefresh: self => { measure(); update(self.scroll()); },
    });
    const refresh = () => trigger.refresh();
    const observer = new ResizeObserver(refresh);
    observer.observe(slot);
    if (rig.fitPortraitHero) observer.observe(sections[0].querySelector("[data-hero-copy]"));
    observer.observe(canvasContainer);
    preference.addEventListener("change", refresh);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", refresh);
      trigger.kill();
      timelines.forEach(t => t.kill());
      onChoreographyActiveChange(false);
    };
  }, [get, rig, productRootRef, onChoreographyActiveChange]);
  return null;
}
