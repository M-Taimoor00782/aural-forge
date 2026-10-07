import gsap from "gsap";

export function animateProductState({
  productRoot,
  productTarget,
  invalidate,
}) {
  gsap.killTweensOf([
    productRoot.position,
    productRoot.rotation,
    productRoot.scale,
  ]);

  return gsap
    .timeline({
      defaults: {
        duration: 0.8,
        ease: "power3.inOut",
        overwrite: "auto",
      },
      onUpdate: invalidate,
    })
    .to(
      productRoot.position,
      {
        x: productTarget.position[0],
        y: productTarget.position[1],
        z: productTarget.position[2],
      },
      0
    )
    .to(
      productRoot.rotation,
      {
        x: productTarget.rotation[0],
        y: productTarget.rotation[1],
        z: productTarget.rotation[2],
      },
      0
    )
    .to(
      productRoot.scale,
      {
        x: productTarget.scale,
        y: productTarget.scale,
        z: productTarget.scale,
      },
      0
    );
}
