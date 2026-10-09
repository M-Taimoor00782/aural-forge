
import gsap from "gsap";

import { resolveChoreographySegment } from "@/config/scrollChoreography";

export function createScrollChoreographyTimeline({
  productRoot,
  camera,
  segment,
  invalidate,
  viewport,
  modelBounds,
}) {
  const { from, to } =
    resolveChoreographySegment(segment, {
      viewport,
      modelBounds,
    });

  const timing = segment.timing ?? {
    position: {
      start: 0,
      duration: 1,
    },
    rotation: {
      start: 0,
      duration: 1,
    },
    scale: {
      start: 0,
      duration: 1,
    },
    camera: {
      start: 0,
      duration: 1,
    },
  };

  return gsap
    .timeline({
      paused: true,
      defaults: {
        ease: "none",
      },
      onUpdate: () => {
        camera.updateProjectionMatrix();
        invalidate();
      },
    })
    .fromTo(
      productRoot.position,
      {
        x: from.product.position[0],
        y: from.product.position[1],
        z: from.product.position[2],
      },
      {
        x: to.product.position[0],
        y: to.product.position[1],
        z: to.product.position[2],
        duration: timing.position.duration,
        immediateRender: false,
      },
      timing.position.start
    )
    .fromTo(
      productRoot.rotation,
      {
        x: from.product.rotation[0],
        y: from.product.rotation[1],
        z: from.product.rotation[2],
      },
      {
        x: to.product.rotation[0],
        y: to.product.rotation[1],
        z: to.product.rotation[2],
        duration: timing.rotation.duration,
        immediateRender: false,
      },
      timing.rotation.start
    )
    .fromTo(
      productRoot.scale,
      {
        x: from.product.scale,
        y: from.product.scale,
        z: from.product.scale,
      },
      {
        x: to.product.scale,
        y: to.product.scale,
        z: to.product.scale,
        duration: timing.scale.duration,
        immediateRender: false,
      },
      timing.scale.start
    )
    .fromTo(
      camera.position,
      {
        x: from.camera.position[0],
        y: from.camera.position[1],
        z: from.camera.position[2],
      },
      {
        x: to.camera.position[0],
        y: to.camera.position[1],
        z: to.camera.position[2],
        duration: timing.camera.duration,
        immediateRender: false,
      },
      timing.camera.start
    )
    .fromTo(
      camera,
      {
        fov: from.camera.fov,
      },
      {
        fov: to.camera.fov,
        duration: timing.camera.duration,
        immediateRender: false,
      },
      timing.camera.start
    );
}
