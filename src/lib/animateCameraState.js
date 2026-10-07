import gsap from "gsap";

export function animateCameraState({
  camera,
  cameraTarget,
  invalidate,
}) {
  gsap.killTweensOf([
    camera.position,
    camera,
  ]);

  return gsap
    .timeline({
      defaults: {
        duration: 0.8,
        ease: "power3.inOut",
        overwrite: "auto",
      },
      onUpdate: () => {
        camera.updateProjectionMatrix();
        invalidate();
      },
    })
    .to(
      camera.position,
      {
        x: cameraTarget.position[0],
        y: cameraTarget.position[1],
        z: cameraTarget.position[2],
      },
      0
    )
    .to(
      camera,
      {
        fov: cameraTarget.fov,
      },
      0
    );
}
