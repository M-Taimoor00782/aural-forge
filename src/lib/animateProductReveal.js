import { Box3, Euler, Quaternion, Vector3 } from "three";
import { PRODUCT_REVEAL } from "@/config/productReveal";

export function phase(value, start, end) {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

// Sample absolute local transforms. Returning to the same scroll offset
// restores exactly the same geometry, even after jumping across a section.
export function headphoneMechanism(scene) {
  const parts = [["Ear_Pad", PRODUCT_REVEAL.earPad], ["Cover", PRODUCT_REVEAL.cover]]
    .map(([name, config]) => {
      const mesh = scene.getObjectByName(name);
      const position = mesh.position.clone();
      const rotation = mesh.quaternion.clone();
      const offset = new Vector3(config.localX, config.localY, config.localZ)
        .applyQuaternion(rotation);
      const { x, y, z } = config.tilt;
      return { mesh, position, rotation, offset, target: rotation.clone()
        .multiply(new Quaternion().setFromEuler(new Euler(x, y, z))) };
    });

  return (progress) => {
    parts.forEach(({ mesh, position, rotation, offset, target }, i) => {
      const t = phase(progress, i * .16, .84 + i * .16);
      mesh.position.copy(position).addScaledVector(offset, t);
      mesh.quaternion.slerpQuaternions(rotation, target, t);
    });
  };
}

export function earbudsMechanism({ hinge, firstEarbud, secondEarbud }) {
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
      new Euler(-.11, side * .31, side * -.12)
    ));
    return { mesh, side, dock, seated, turned, original: mesh.position.clone(),
      originalRotation: mesh.quaternion.clone() };
  });

  return (progress, display) => {
    const lid = Math.max(phase(display, 0, .55), phase(progress, .02, .42));
    hinge.quaternion.slerpQuaternions(closedHinge, openHinge, lid);
    const displayLift = phase(display, .55, 1);
    for (const bud of buds) {
      const delay = bud.side > 0 ? .04 : 0;
      const lift = phase(progress, .42 + delay, .72 + delay);
      const spread = phase(progress, .74 + delay, .96 + delay);
      bud.mesh.position.lerpVectors(bud.dock, bud.original, displayLift);
      bud.mesh.position.y += .72 * lift + .14 * spread;
      bud.mesh.position.x += bud.side * .32 * spread;
      bud.mesh.position.z += .05 * spread;
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
