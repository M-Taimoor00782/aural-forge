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
export default function ScrollChoreographyController({
  productRootRef, rig, inspectionRef, onInspectionSectionChange,
}) {
  const get = useThree(state => state.get);
  useLayoutEffect(() => {
    const root = productRootRef.current;
    const { camera, gl, invalidate } = get();
    const canvasContainer = gl.domElement.parentElement;
    const ids = ["hero", ...SCROLL_CHOREOGRAPHY.map(s => s.toSectionId)];
    const sections = ids.map(id => document.getElementById(id));
    if (!root || sections.some(el => !el)) return;
    const reveal = sections[3];
    const detailTrack = sections[2].closest("[data-detail-track]");
    const formSlot = sections[2].querySelector("[data-form-slot]");
    const heroSlot = sections[0].querySelector("[data-hero-model-frame]");
    const banner = document.getElementById("product-parallax-banner");
    const frame = reveal.querySelector("[data-reveal-frame]");
    const slot = reveal.querySelector("[data-reveal-slot]");
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let viewport, compact;
    let centers, heroEnd, top, end, bannerStart, takeCover, bannerEnd, arrival, poses, timelines = [];
    const inspection = inspectionRef.current;
    let inspectionSection, laneSection;

    function updateInspection(y) {
      const { width, height } = viewport;
      const reduced = preference.matches;
      const duringReveal = y >= top && y <= (reduced ? top + height * .08 : end);
      const progress = fraction(y, top, end);
      const heldReveal = duringReveal && (reduced || progress <= .08 || progress >= .94);
      const stable = [1, 2, 4, 5].find(i => Math.abs(y - centers[i]) <= height * .09 &&
        (i !== 2 || (formSlot ? y >= bannerEnd - 1 : y < bannerStart + height * .10)));
      const index = y < heroEnd ? 0 : heldReveal ? 3 : stable;
      const section = index === undefined ? null : ids[index];
      inspection.exclusive = y >= bannerStart && y <= end && !heldReveal && section !== "detail";
      inspection.section = section;

      if (section && index !== 0 && laneSection !== section) {
        const header = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
        const edge = Math.max(12, width * .04);
        let lane;
        if (index === 3) {
          const rect = slot.getBoundingClientRect();
          const frameY = frame.getBoundingClientRect().top;
          lane = { left: rect.left, right: rect.right,
            top: Math.max(header + 10, rect.top - frameY), bottom: rect.bottom - frameY };
        } else if (index === 2 && formSlot) {
          lane = framing(formSlot, sections[2]);
        } else {
          const copy = sections[index].firstElementChild;
          const rect = copy.getBoundingClientRect();
          const copyOnLeft = index === 5;
          const relativeBottom = rect.bottom + y - centers[index] + height * .09;
          lane = {
            left: !compact && copyOnLeft ? rect.right + 12 : edge,
            right: !compact && !copyOnLeft ? rect.left - 12 : width - edge,
            top: compact ? Math.max(header + 10, relativeBottom + 10) : header + 12,
            bottom: height - 22,
          };
        }
        inspection.lane = lane;
      }
      laneSection = section;
      if (inspectionSection !== section) {
        inspectionSection = section;
        onInspectionSectionChange(section);
      }
    }

    function framing(element, section) {
      const rect = element.getBoundingClientRect();
      const origin = section.getBoundingClientRect().top + (section === sections[0] ? 0 : (section.offsetHeight - viewport.height) / 2);
      return { left: rect.left, right: rect.right, top: rect.top - origin, bottom: rect.bottom - origin };
    }

    function measure() {
      laneSection = null;
      viewport = { width: canvasContainer.clientWidth, height: canvasContainer.clientHeight };
      compact = matchMedia("(max-aspect-ratio: 3/4)").matches;
      const y = window.scrollY;
      const height = viewport.height;
      heroEnd = y + sections[0].getBoundingClientRect().bottom;
      centers = sections.map((el, i) => {
        const start = (i === 2 ? detailTrack : el).getBoundingClientRect().top;
        return y + start + (el.offsetHeight - height) / 2;
      });
      top = y + reveal.getBoundingClientRect().top;
      end = top + Math.max(0, reveal.offsetHeight - frame.offsetHeight);
      arrival = top - height;
      bannerStart = y + banner.getBoundingClientRect().top - height;
      bannerEnd = y + banner.getBoundingClientRect().bottom;
      takeCover = bannerStart + height * .72;
      const rect = slot.getBoundingClientRect();
      const frameY = frame.getBoundingClientRect().top;
      poses = rig.camera ? fittedStoryPoses(viewport, rig, sections) :
        ["hero", "performanceDetail", "performanceDetail", "acousticReveal", "configurator", "finale"]
          .map(name => resolveProductState(name, { viewport, modelBounds: rig.bounds }));
      if (heroSlot) {
        const { camera, product } = poses[0];
        poses[0] = fitStagePose(rig.bounds, product.rotation, camera, viewport,
          framing(heroSlot, sections[0]), .98, rig.silhouette);
      }
      if (formSlot) {
        poses[2] = fitStagePose(rig.bounds, [.03, .26, -.02], poses[1].camera, viewport,
          framing(formSlot, sections[2]), compact ? .83 : .78, rig.silhouette);
      }
      const cameraPose = rig.camera ? poses[0].camera : poses[3].camera;
      const revealBounds = compact && rig.compactRevealBounds ? rig.compactRevealBounds : rig.expandedBounds;
      poses[3] = fitStagePose(revealBounds, rig.revealRotation ?? [.03, -.77, -.035],
        cameraPose, viewport, { left: rect.left, right: rect.right,
          top: rect.top - frameY, bottom: rect.bottom - frameY }, .93);
      timelines.forEach(t => t.kill());
      timelines = SCROLL_CHOREOGRAPHY.map((segment, i) => createScrollChoreographyTimeline({
        productRoot: root, camera, viewport, segment, invalidate, from: poses[i], to: poses[i + 1],
        modelBounds: !rig.camera && i !== 2 && i !== 3 && !(formSlot && i <= 1) ? rig.bounds : null,
      }));
    }

    function update(y) {
      const h = viewport.height;
      const reduced = preference.matches;
      updateInspection(y);
      let part = 0, display = 1, opacity = 1;
      if (formSlot && y >= centers[1] && y < top) {
        if (y < bannerEnd - h * .75) {
          timelines[1].sample(0);
          opacity = 1 - phase(fraction(y, bannerStart, takeCover), .12, .9);
        } else if (y < centers[2]) {
          // The banner masks the repositioning. The same assembled model then
          // rises under its receding edge into the measured Form & Finish slot.
          const t = fraction(y, bannerEnd - h * .75, centers[2]);
          timelines[1].sample(reduced ? Number(y >= bannerEnd) : phase(t, 0, .86));
          opacity = reduced ? Number(y >= bannerEnd) : phase(t, .18, .8);
          if (!reduced) {
            const depth = camera.position.z - root.position.z;
            root.position.y -= (1 - phase(t, .1, 1)) * depth * .74 * Math.tan(camera.fov * Math.PI / 360);
          }
        } else {
          const t = fraction(y, centers[2], top);
          timelines[2].sample(reduced ? Number(t >= .5) : t);
          display = reduced ? Number(t < .5) : 1 - phase(t, .26, 1);
        }
      } else if (y < centers[2]) {
        const i = y < centers[1] ? 0 : 1;
        const t = fraction(y, centers[i], centers[i + 1]);
        timelines[i].sample(reduced ? Number(t >= .5) : t);
      } else if (y < arrival) {
        const cover = fraction(y, bannerStart, takeCover);
        timelines[2].sample(reduced ? Number(cover >= .65) : phase(cover, .15, 1));
        display = reduced ? Number(cover < .65) : 1 - phase(cover, .12, .8);
        opacity = 1 - phase(cover, .1, .85);
      } else if (y <= end) {
        timelines[2].sample(1);
        display = 0;
        part = reduced ? 1 : phase(fraction(y, top, end), .08, .94);
        if (y < top) {
          // Keep the live product aligned to the incoming reveal's model slot.
          opacity = phase(fraction(y, arrival, top), .12, .82);
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
      canvasContainer.style.opacity = opacity === 1 ? "" : opacity;
      rig.sample(part, display, compact);
      invalidate();
    }

    measure();
    const trigger = ScrollTrigger.create({
      trigger: sections[0], start: "top top", endTrigger: sections[5], end: "bottom top",
      onUpdate: self => update(self.scroll()),
      onRefresh: self => { measure(); update(self.scroll()); },
    });
    let refreshFrame;
    const refresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => trigger.refresh());
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(slot);
    observer.observe(sections[0]);
    if (heroSlot) observer.observe(heroSlot);
    if (formSlot) observer.observe(formSlot);
    if (rig.fitPortraitHero) observer.observe(sections[0].querySelector("[data-hero-copy]"));
    observer.observe(canvasContainer);
    preference.addEventListener("change", refresh);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(refreshFrame);
      preference.removeEventListener("change", refresh);
      trigger.kill();
      canvasContainer.style.removeProperty("opacity");
      timelines.forEach(t => t.kill());
      inspection.section = null;
      onInspectionSectionChange(null);
    };
  }, [get, rig, productRootRef, inspectionRef, onInspectionSectionChange]);
  return null;
}
