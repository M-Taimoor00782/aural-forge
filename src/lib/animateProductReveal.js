import gsap from "gsap";
import { Vector3 } from "three";
import { PRODUCT_REVEAL } from "@/config/productReveal";

function getRevealPosition(assembledTransform, localZ) {
  const offset = new Vector3(0, 0, localZ).applyQuaternion(
    assembledTransform.quaternion
  );

  return assembledTransform.position.clone().add(offset);
}

export function animateProductReveal({
  earPad,
  cover,
  assembled,
  reveal,
  invalidate,
  onComplete,
}) {
  const earPadTarget = reveal
    ? getRevealPosition(
        assembled.earPad,
        PRODUCT_REVEAL.earPad.localZ
      )
    : assembled.earPad.position;

  const coverTarget = reveal
    ? getRevealPosition(
        assembled.cover,
        PRODUCT_REVEAL.cover.localZ
      )
    : assembled.cover.position;

  gsap.killTweensOf([
    earPad.position,
    cover.position,
  ]);

  const timeline = gsap.timeline({
    defaults: {
      duration: PRODUCT_REVEAL.motion.duration,
      ease: PRODUCT_REVEAL.motion.ease,
      overwrite: "auto",
    },
    onUpdate: invalidate,
    onComplete,
  });

  if (reveal) {
    timeline
      .to(
        earPad.position,
        {
          x: earPadTarget.x,
          y: earPadTarget.y,
          z: earPadTarget.z,
        },
        0
      )
      .to(
        cover.position,
        {
          x: coverTarget.x,
          y: coverTarget.y,
          z: coverTarget.z,
        },
        0.12
      );
  } else {
    timeline
      .to(
        cover.position,
        {
          x: coverTarget.x,
          y: coverTarget.y,
          z: coverTarget.z,
        },
        0
      )
      .to(
        earPad.position,
        {
          x: earPadTarget.x,
          y: earPadTarget.y,
          z: earPadTarget.z,
        },
        0.12
      );
  }

  return timeline;
}