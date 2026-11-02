import { readFile } from "node:fs/promises";
import path from "node:path";

const MODEL_PATH = path.resolve(
  "public/models/earbuds/aural-forge-earbuds.glb"
);

function formatNumber(value) {
  return Number(value ?? 0).toFixed(3);
}

function formatVector(values) {
  if (!values) return "none";

  return values
    .map(formatNumber)
    .join(", ");
}

function readGLB(buffer) {
  if (buffer.length < 20) {
    throw new Error("GLB file is too small.");
  }

  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const declaredLength = buffer.readUInt32LE(8);

  if (magic !== 0x46546c67 || version !== 2) {
    throw new Error("Expected a glTF 2.0 GLB file.");
  }

  if (declaredLength > buffer.length) {
    throw new Error("GLB file is incomplete.");
  }

  let offset = 12;

  while (offset + 8 <= declaredLength) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);

    offset += 8;

    if (offset + chunkLength > declaredLength) {
      throw new Error("Invalid GLB chunk length.");
    }

    if (chunkType === 0x4e4f534a) {
      const text = buffer
        .subarray(offset, offset + chunkLength)
        .toString("utf8")
        .trim();

      return JSON.parse(text);
    }

    offset += chunkLength;
  }

  throw new Error("GLB JSON chunk was not found.");
}

function identityMatrix() {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
}

function nodeMatrix(node) {
  if (node.matrix) {
    return node.matrix;
  }

  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const [px, py, pz] = node.translation ?? [0, 0, 0];

  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;

  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  return [
    (1 - yy - zz) * sx,
    (xy + wz) * sx,
    (xz - wy) * sx,
    0,

    (xy - wz) * sy,
    (1 - xx - zz) * sy,
    (yz + wx) * sy,
    0,

    (xz + wy) * sz,
    (yz - wx) * sz,
    (1 - xx - yy) * sz,
    0,

    px, py, pz, 1,
  ];
}

function multiplyMatrices(a, b) {
  const result = new Array(16).fill(0);

  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) {
        result[column * 4 + row] +=
          a[k * 4 + row] *
          b[column * 4 + k];
      }
    }
  }

  return result;
}

function meshDetails(gltf, meshIndex) {
  const mesh = gltf.meshes?.[meshIndex];

  if (!mesh) return "mesh missing";

  const materials = new Set();

  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];

  let hasBounds = false;

  for (const primitive of mesh.primitives ?? []) {
    if (primitive.material !== undefined) {
      const material = gltf.materials?.[primitive.material];

      materials.add(
        material?.name ??
          `Material_${primitive.material}`
      );
    }

    const accessorIndex = primitive.attributes?.POSITION;
    const accessor = gltf.accessors?.[accessorIndex];

    if (!accessor?.min || !accessor?.max) {
      continue;
    }

    hasBounds = true;

    for (let axis = 0; axis < 3; axis++) {
      minimum[axis] = Math.min(
        minimum[axis],
        accessor.min[axis]
      );

      maximum[axis] = Math.max(
        maximum[axis],
        accessor.max[axis]
      );
    }
  }

  const dimensions = hasBounds
    ? maximum.map(
        (value, axis) => value - minimum[axis]
      )
    : null;

  return [
    `mesh="${mesh.name ?? `Mesh_${meshIndex}`}"`,
    `primitives=${mesh.primitives?.length ?? 0}`,
    `materials=[${[...materials].join(", ")}]`,
    dimensions
      ? `localSize=(${formatVector(dimensions)})`
      : "localSize=unavailable",
    hasBounds
      ? `localMin=(${formatVector(minimum)})`
      : "",
    hasBounds
      ? `localMax=(${formatVector(maximum)})`
      : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function inspectHierarchy(gltf) {
  const nodes = gltf.nodes ?? [];
  const visited = new Set();
  const candidates = [];

  const candidatePattern =
    /lid|hinge|cover|case|shell|bud|ear|left|right|top|open/i;

  function visit(index, parentMatrix, depth = 0) {
    if (visited.has(index)) return;

    const node = nodes[index];

    if (!node) return;

    visited.add(index);

    const worldMatrix = multiplyMatrices(
      parentMatrix,
      nodeMatrix(node)
    );

    const worldPosition = [
      worldMatrix[12],
      worldMatrix[13],
      worldMatrix[14],
    ];

    const nodeName = node.name ?? `Node_${index}`;
    const indentation = "  ".repeat(depth);

    console.log(
      `${indentation}[${index}] ${nodeName}`
    );

    console.log(
      `${indentation}    localPosition=(${formatVector(
        node.translation ?? [0, 0, 0]
      )}) | worldOrigin=(${formatVector(
        worldPosition
      )})`
    );

    if (node.rotation) {
      console.log(
        `${indentation}    quaternion=(${formatVector(
          node.rotation
        )})`
      );
    }

    if (node.mesh !== undefined) {
      console.log(
        `${indentation}    ${meshDetails(
          gltf,
          node.mesh
        )}`
      );
    }

    if (node.skin !== undefined) {
      console.log(
        `${indentation}    skin=${node.skin}`
      );
    }

    if (candidatePattern.test(nodeName)) {
      candidates.push({
        index,
        name: nodeName,
        worldPosition,
        mesh: node.mesh,
      });
    }

    for (const child of node.children ?? []) {
      visit(child, worldMatrix, depth + 1);
    }
  }

  const scenes = gltf.scenes ?? [];

  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
    const scene = scenes[sceneIndex];

    console.log(
      `\nScene ${sceneIndex}: ${scene.name ?? "Unnamed"}`
    );

    for (const index of scene.nodes ?? []) {
      visit(index, identityMatrix());
    }
  }

  // Also expose nodes that are not attached
  // to a default scene.
  for (let index = 0; index < nodes.length; index++) {
    if (!visited.has(index)) {
      console.log("\nUnattached or unvisited node:");

      visit(index, identityMatrix());
    }
  }

  return candidates;
}

async function main() {
  const buffer = await readFile(MODEL_PATH);
  const gltf = readGLB(buffer);

  console.log("\n==================================");
  console.log("AURAL FORGE — EARBUDS GLB INSPECTOR");
  console.log("==================================");

  console.log(`\nFile: ${MODEL_PATH}`);
  console.log(`Size: ${(buffer.length / 1048576).toFixed(2)} MB`);

  console.log("\nModel summary:");
  console.log({
    generator: gltf.asset?.generator ?? "Unknown",
    scenes: gltf.scenes?.length ?? 0,
    nodes: gltf.nodes?.length ?? 0,
    meshes: gltf.meshes?.length ?? 0,
    materials: gltf.materials?.length ?? 0,
    animations: gltf.animations?.length ?? 0,
    skins: gltf.skins?.length ?? 0,
  });

  console.log("\n--- MATERIALS ---");

  (gltf.materials ?? []).forEach((material, index) => {
    console.log(
      `[${index}] ${material.name ?? "Unnamed"}`
    );
  });

  console.log("\n--- COMPLETE NODE HIERARCHY ---");

  const candidates = inspectHierarchy(gltf);

  console.log("\n--- POSSIBLE MECHANICAL PARTS ---");

  if (candidates.length === 0) {
    console.log(
      "No descriptive part names found. " +
      "Identify components using the hierarchy " +
      "and mesh dimensions above."
    );
  } else {
    for (const candidate of candidates) {
      console.log(
        `[${candidate.index}] ${candidate.name} | ` +
        `origin=(${formatVector(candidate.worldPosition)})`
      );
    }
  }

  console.log("\n--- EMBEDDED ANIMATIONS ---");

  if (!gltf.animations?.length) {
    console.log("No embedded animations.");
  } else {
    gltf.animations.forEach((animation, index) => {
      console.log(
        `[${index}] ${animation.name ?? "Unnamed"}`
      );

      for (const channel of animation.channels ?? []) {
        const nodeIndex = channel.target?.node;

        console.log(
          `  ${gltf.nodes?.[nodeIndex]?.name ?? `Node_${nodeIndex}`} ` +
          `-> ${channel.target?.path ?? "unknown"}`
        );
      }
    });
  }

  console.log("\n--- INSPECTION COMPLETE ---");
}

main().catch((error) => {
  console.error("Earbuds inspection failed:", error.message);
  process.exitCode = 1;
});
