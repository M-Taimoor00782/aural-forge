import gsap from "gsap";
import { Euler, Quaternion, Vector3 } from "three";
import { PRODUCT_REVEAL } from "@/config/productReveal";

function getTargetTransform(
  assembled,
  configuration,
  reveal
) {
  if (!reveal) {
    return {
      position: assembled.position.clone(),
      quaternion: assembled.quaternion.clone(),
    };
  }

  // Convert the local separation offset into the
  // part's parent coordinate system.
  const offset = new Vector3(
    configuration.localX,
    configuration.localY,
    configuration.localZ
  ).applyQuaternion(assembled.quaternion);

  // Apply a restrained local-space tilt relative
  // to the original assembled orientation.
  const localTilt = new Quaternion().setFromEuler(
    new Euler(
      configuration.tilt.x,
      configuration.tilt.y,
      configuration.tilt.z
    )
  );

  return {
    position: assembled.position.clone().add(offset),
    quaternion: assembled.quaternion
      .clone()
      .multiply(localTilt),
  };
}

function createPartMotion({
  part,
  target,
  invalidate,
}) {
  // Capture the actual current transform.
  // This allows clean reversal during an
  // unfinished reveal or restore.
  const startPosition = part.position.clone();
  const startQuaternion = part.quaternion.clone();

  const progress = { value: 0 };

  function update() {
    part.position.lerpVectors(
      startPosition,
      target.position,
      progress.value
    );

    part.quaternion.slerpQuaternions(
      startQuaternion,
      target.quaternion,
      progress.value
    );

    invalidate();
  }

  return {
    progress,
    update,
  };
}

export function animateProductReveal({
  earPad,
  cover,
  assembled,
  reveal,
  invalidate,
  onComplete,
}) {
  const earPadTarget = getTargetTransform(
    assembled.earPad,
    PRODUCT_REVEAL.earPad,
    reveal
  );

  const coverTarget = getTargetTransform(
    assembled.cover,
    PRODUCT_REVEAL.cover,
    reveal
  );

  const earPadMotion = createPartMotion({
    part: earPad,
    target: earPadTarget,
    invalidate,
  });

  const coverMotion = createPartMotion({
    part: cover,
    target: coverTarget,
    invalidate,
  });

  const timeline = gsap.timeline({
    defaults: {
      duration: PRODUCT_REVEAL.motion.duration,
      ease: PRODUCT_REVEAL.motion.ease,
      overwrite: "auto",
    },

    onComplete: () => {
      // Ensure exact final transforms after
      // the completed animation.
      earPad.position.copy(earPadTarget.position);
      earPad.quaternion.copy(earPadTarget.quaternion);

      cover.position.copy(coverTarget.position);
      cover.quaternion.copy(coverTarget.quaternion);

      invalidate();
      onComplete?.();
    },
  });

  const stagger = PRODUCT_REVEAL.motion.stagger;

  if (reveal) {
    timeline
      .to(
        earPadMotion.progress,
        {
          value: 1,
          onUpdate: earPadMotion.update,
        },
        0
      )
      .to(
        coverMotion.progress,
        {
          value: 1,
          onUpdate: coverMotion.update,
        },
        stagger
      );
  } else {
    timeline
      .to(
        coverMotion.progress,
        {
          value: 1,
          onUpdate: coverMotion.update,
        },
        0
      )
      .to(
        earPadMotion.progress,
        {
          value: 1,
          onUpdate: earPadMotion.update,
        },
        stagger
      );
  }

  return timeline;
}
