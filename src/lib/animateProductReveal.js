import { Box3, Euler, Quaternion, Vector3 } from "three";
import { PRODUCT_REVEAL } from "@/config/productReveal";

export function phase(value, start, end) {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

// Sample absolute local transforms. Returning to the same scroll offset
// restores exactly the same geometry, even after jumping across a section.
export function headphoneMechanism(scene, presentation) {
  const parts = [["Ear_Pad", PRODUCT_REVEAL.earPad], ["Cover", PRODUCT_REVEAL.cover]]
    .map(([name, config]) => {
      const mesh = scene.getObjectByName(name);
      const position = mesh.position.clone();
      const rotation = mesh.quaternion.clone();
      const slide = new Vector3(0, 0, config.localZ).applyQuaternion(rotation);
      const clearance = new Vector3(config.localX, config.localY, 0).applyQuaternion(rotation);
      const { x, y, z } = config.tilt;
      return { mesh, position, rotation, slide, clearance, travel: config.travel, target: rotation.clone()
        .multiply(new Quaternion().setFromEuler(new Euler(x, y, z))) };
    });

  return (progress, display, compact = false) => {
    const inspect = phase(progress, 0, .34);
    const settle = phase(progress, .43, .84);
    presentation.rotation.set(.12 * inspect - .065 * settle,
      -.32 * inspect + .07 * settle, .03 * inspect);
    presentation.scale.setScalar(1 - .075 * (1 - display) * (1 - inspect));

    const distance = compact ? PRODUCT_REVEAL.compactTravel : 1;
    for (const { mesh, position, rotation, slide, clearance, travel: [start, end], target } of parts) {
      const withdraw = phase(progress, start, end);
      const turn = phase(progress, start + .15, end);
      // The paired rings share a mesh. Slide them clear of the rims before turning.
      mesh.position.copy(position).addScaledVector(slide, distance * withdraw)
        .addScaledVector(clearance, distance * turn);
      mesh.quaternion.slerpQuaternions(rotation, target, turn);
    }
  };
}

export function earbudsMechanism({ hinge, firstEarbud, secondEarbud }, presentation) {
  const openHinge = hinge.quaternion.clone();
  const closedHinge = new Quaternion();
  const buds = [firstEarbud, secondEarbud].map((mesh, i) => {
    const side = i ? 1 : -1;
    const dock = firstEarbud.position.clone();
    dock.x = side * Math.abs(dock.x);
    // The export poses the right bud above its socket. Mirror the seated
    // left bud in case-local space. Its tip remains a child throughout.
    const seated = i ? new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
      : mesh.quaternion.clone();
    const turned = seated.clone().multiply(new Quaternion().setFromEuler(
      new Euler(-.18, side * .34, -side * .13)
    ));
    return { mesh, side, dock, seated, turned, delay: i * .065, original: mesh.position.clone(),
      originalRotation: mesh.quaternion.clone() };
  });

  return (progress, display) => {
    const open = phase(progress, .03, .43);
    const lid = Math.max(phase(display, 0, .55), open);
    hinge.quaternion.slerpQuaternions(closedHinge, openHinge, lid);
    const settle = phase(progress, .43, .92);
    presentation.rotation.set(-.05 * open + .025 * settle, -.18 * settle, .025 * settle);

    const displayLift = phase(display, .55, 1);
    for (const bud of buds) {
      // Lift on the socket axis first. The buds only fan out once clear of the rim.
      const lift = phase(progress, .38 + bud.delay, .72 + bud.delay);
      const spread = phase(progress, .61 + bud.delay, .92 + bud.delay);
      bud.mesh.position.lerpVectors(bud.dock, bud.original, displayLift);
      bud.mesh.position.y += .60 * lift + .16 * spread;
      bud.mesh.position.x += bud.side * .41 * spread;
      bud.mesh.position.z += .14 * spread;
      bud.mesh.quaternion.slerpQuaternions(bud.seated, bud.originalRotation, displayLift);
      bud.mesh.quaternion.slerp(bud.turned, spread);
    }
  };
}

export function measureMechanism(scene, sample) {
  const bounds = new Box3();
  // Include all phases, including the intermediate arc of the real hinge.
  for (let i = 0; i <= 16; i++) {
    sample(i / 16, 0);
    scene.updateMatrixWorld(true);
    bounds.expandByObject(scene);
  }
  sample(0, 1);
  return { min: bounds.min.toArray(), max: bounds.max.toArray() };
}
