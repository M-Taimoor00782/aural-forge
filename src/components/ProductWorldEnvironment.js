"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  Color,
  Vector2,
} from "three";
import gsap from "gsap";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyWorld,
} from "@/config/productFamilies";

const PLANE_VERTEX = `
  varying vec2 vUv;

  void main() {
    vUv = uv;

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(position, 1.0);
  }
`;

const WORLD_FRAGMENT = `
  uniform vec3 uBackground;
  uniform vec3 uSurface;
  uniform vec3 uAccent;
  uniform vec2 uParallax;

  varying vec2 vUv;

  float softField(
    vec2 uv,
    vec2 center,
    vec2 radius
  ) {
    vec2 delta = (uv - center) / radius;

    return exp(-dot(delta, delta) * 1.8);
  }

  void main() {
    vec2 uv = vUv + uParallax * 0.006;

    float upper = softField(
      uv,
      vec2(0.76, 0.76),
      vec2(0.44, 0.5)
    );

    float lower = softField(
      uv,
      vec2(0.2, 0.2),
      vec2(0.5, 0.48)
    );

    vec3 color = uBackground;

    color = mix(
      color,
      uSurface,
      upper * 0.18
    );

    color = mix(
      color,
      uAccent,
      lower * 0.045
    );

    float vignette = smoothstep(
      0.25,
      0.85,
      length((uv - 0.5) * vec2(1.0, 0.85))
    );

    color *= 1.0 - vignette * 0.08;

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
  }
`;

const LIGHT_FIELD_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * vec2(1.25, 1.0);

    float glow = exp(
      -dot(p, p) * 12.0
    );

    gl_FragColor = vec4(
      uColor,
      glow * uOpacity
    );

    #include <colorspace_fragment>
  }
`;

const STAR_VERTEX = `
  attribute float aSize;
  attribute float aStrength;

  varying float vStrength;

  void main() {
    vStrength = aStrength;

    vec4 viewPosition =
      modelViewMatrix *
      vec4(position, 1.0);

    gl_Position =
      projectionMatrix * viewPosition;

    gl_PointSize = aSize;
  }
`;

const STAR_FRAGMENT = `
  uniform vec3 uStarColor;
  uniform float uOpacity;

  varying float vStrength;

  void main() {
    float distanceFromCenter =
      length(gl_PointCoord - vec2(0.5));

    float falloff =
      1.0 - smoothstep(
        0.12,
        0.5,
        distanceFromCenter
      );

    float alpha =
      falloff *
      vStrength *
      uOpacity;

    gl_FragColor = vec4(
      uStarColor,
      alpha
    );

    #include <colorspace_fragment>
  }
`;

// Deterministic star positions:
// no runtime randomization or continuous particle motion.
function makeStarLayer(count, seed, width, height) {
  let state = seed;

  function random() {
    state = (
      1664525 * state + 1013904223
    ) >>> 0;

    return state / 4294967296;
  }

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const strengths = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] =
      (random() - 0.5) * width;

    positions[i * 3 + 1] =
      (random() - 0.5) * height;

    positions[i * 3 + 2] =
      (random() - 0.5) * 3;

    sizes[i] = 1.0 + random() * 1.4;
    strengths[i] = 0.35 + random() * 0.55;
  }

  return { positions, sizes, strengths, count };
}

function StarLayer({
  data,
  uniforms,
  groupRef,
  position,
}) {
  return (
    <group ref={groupRef} position={position}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[data.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[data.sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aStrength"
            args={[data.strengths, 1]}
          />
        </bufferGeometry>

        <shaderMaterial
          vertexShader={STAR_VERTEX}
          fragmentShader={STAR_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

function tweenColor(
  timeline,
  target,
  hex,
  duration
) {
  const color = new Color(hex);

  timeline.to(
    target,
    {
      r: color.r,
      g: color.g,
      b: color.b,
      duration,
      ease: "power2.inOut",
    },
    0
  );
}

export default function ProductWorldEnvironment({
  familyId = DEFAULT_PRODUCT_FAMILY_ID,
  variantId,
}) {
  const invalidate = useThree(
    (state) => state.invalidate
  );

  const nearStarsRef = useRef(null);
  const farStarsRef = useRef(null);
  const nearLightRef = useRef(null);
  const farLightRef = useRef(null);

  const initializedRef = useRef(false);

  const starLayers = useMemo(
    () => ({
      near: makeStarLayer(
        95,
        81023,
        48,
        30
      ),

      far: makeStarLayer(
        65,
        45071,
        60,
        38
      ),
    }),
    []
  );

  const uniforms = useMemo(() => {
    const palette = getProductFamilyWorld(
      DEFAULT_PRODUCT_FAMILY_ID
    ).palette;

    return {
      world: {
        uBackground: {
          value: new Color(palette.background),
        },
        uSurface: {
          value: new Color(palette.surface),
        },
        uAccent: {
          value: new Color(palette.accent),
        },
        uParallax: {
          value: new Vector2(0, 0),
        },
      },

      nearLight: {
        uColor: {
          value: new Color(palette.accent),
        },
        uOpacity: {
          value: 0.09,
        },
      },

      farLight: {
        uColor: {
          value: new Color(palette.surface),
        },
        uOpacity: {
          value: 0.075,
        },
      },

      stars: {
        uStarColor: {
          value: new Color("#DCE9FF"),
        },
        uOpacity: {
          value: 0.32,
        },
      },
    };
  }, []);

  // World appearance is determined by the product
  // family and its selected finish.
  useEffect(() => {
    const family = getProductFamily(familyId);

    const palette = getProductFamilyWorld(
      familyId,
      variantId
    ).palette;

    // Existing Headphones world gets subtle stars.
    // Future families may override through
    // world.atmosphere.stars.opacity.
    const starOpacity =
      family.world.atmosphere?.stars?.opacity ??
      (
        family.id === DEFAULT_PRODUCT_FAMILY_ID
          ? 0.32
          : 0
      );

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const colorEntries = [
      [
        uniforms.world.uBackground.value,
        palette.background,
      ],
      [
        uniforms.world.uSurface.value,
        palette.surface,
      ],
      [
        uniforms.world.uAccent.value,
        palette.accent,
      ],
      [
        uniforms.nearLight.uColor.value,
        palette.accent,
      ],
      [
        uniforms.farLight.uColor.value,
        palette.surface,
      ],
      [
        uniforms.stars.uStarColor.value,
        palette.text,
      ],
    ];

    if (!initializedRef.current || reducedMotion) {
      colorEntries.forEach(([target, hex]) => {
        target.copy(new Color(hex));
      });

      uniforms.stars.uOpacity.value = starOpacity;

      initializedRef.current = true;
      invalidate();

      return;
    }

    const duration = 1.1;

    const timeline = gsap.timeline({
      onUpdate: invalidate,
      onComplete: invalidate,
    });

    colorEntries.forEach(([target, hex]) => {
      tweenColor(
        timeline,
        target,
        hex,
        duration
      );
    });

    timeline.to(
      uniforms.stars.uOpacity,
      {
        value: starOpacity,
        duration,
        ease: "power2.inOut",
      },
      0
    );

    return () => {
      timeline.kill();
    };
  }, [
    familyId,
    variantId,
    uniforms,
    invalidate,
  ]);

  // Pointer parallax moves background layers only.
  // It never writes to product transforms or camera.
  useEffect(() => {
    const nearStars = nearStarsRef.current;
    const farStars = farStarsRef.current;
    const nearLight = nearLightRef.current;
    const farLight = farLightRef.current;

    if (
      !nearStars ||
      !farStars ||
      !nearLight ||
      !farLight
    ) {
      return;
    }

    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!finePointer || reducedMotion) {
      return;
    }

    const parallax =
      uniforms.world.uParallax.value;

    const layers = [
      {
        object: nearStars,
        base: [0, 0],
        strength: [0.3, 0.2],
      },
      {
        object: farStars,
        base: [0, 0],
        strength: [-0.12, -0.09],
      },
      {
        object: nearLight,
        base: [-7, 4],
        strength: [0.28, 0.18],
      },
      {
        object: farLight,
        base: [8, -4],
        strength: [-0.15, -0.1],
      },
    ].map((layer) => ({
      ...layer,

      x: gsap.quickTo(
        layer.object.position,
        "x",
        {
          duration: 1.15,
          ease: "power2.out",
          onUpdate: invalidate,
        }
      ),

      y: gsap.quickTo(
        layer.object.position,
        "y",
        {
          duration: 1.15,
          ease: "power2.out",
          onUpdate: invalidate,
        }
      ),
    }));

    const parallaxX = gsap.quickTo(
      parallax,
      "x",
      {
        duration: 1.3,
        ease: "power2.out",
        onUpdate: invalidate,
      }
    );

    const parallaxY = gsap.quickTo(
      parallax,
      "y",
      {
        duration: 1.3,
        ease: "power2.out",
        onUpdate: invalidate,
      }
    );

    function updatePointer(x, y) {
      layers.forEach((layer) => {
        layer.x(
          layer.base[0] +
          x * layer.strength[0]
        );

        layer.y(
          layer.base[1] +
          y * layer.strength[1]
        );
      });

      parallaxX(x);
      parallaxY(y);
    }

    function handlePointerMove(event) {
      const x =
        (event.clientX / window.innerWidth) * 2 - 1;

      const y =
        1 -
        (event.clientY / window.innerHeight) * 2;

      updatePointer(x, y);
    }

    function handlePointerLeave() {
      updatePointer(0, 0);
    }

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    document.addEventListener(
      "pointerout",
      handlePointerLeave
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      document.removeEventListener(
        "pointerout",
        handlePointerLeave
      );

      layers.forEach(({ object }) => {
        gsap.killTweensOf(object.position);
      });

      gsap.killTweensOf(parallax);
    };
  }, [invalidate, uniforms]);

  return (
    <group name="AuralForgeVisualWorld">
      {/* Main 3D gradient plane */}
      <mesh
        position={[0, 0, -90]}
        renderOrder={-1000}
        frustumCulled={false}
      >
        <planeGeometry args={[230, 160]} />

        <shaderMaterial
          uniforms={uniforms.world}
          vertexShader={PLANE_VERTEX}
          fragmentShader={WORLD_FRAGMENT}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Soft atmospheric fields */}
      <mesh
        ref={nearLightRef}
        position={[-7, 4, -50]}
        renderOrder={-999}
      >
        <planeGeometry args={[30, 24]} />

        <shaderMaterial
          uniforms={uniforms.nearLight}
          vertexShader={PLANE_VERTEX}
          fragmentShader={LIGHT_FIELD_FRAGMENT}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={farLightRef}
        position={[8, -4, -68]}
        renderOrder={-998}
      >
        <planeGeometry args={[40, 30]} />

        <shaderMaterial
          uniforms={uniforms.farLight}
          vertexShader={PLANE_VERTEX}
          fragmentShader={LIGHT_FIELD_FRAGMENT}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Sparse depth-separated night-sky stars */}
      <StarLayer
        data={starLayers.near}
        uniforms={uniforms.stars}
        groupRef={nearStarsRef}
        position={[0, 0, -42]}
      />

      <StarLayer
        data={starLayers.far}
        uniforms={uniforms.stars}
        groupRef={farStarsRef}
        position={[0, 0, -62]}
      />
    </group>
  );
}
