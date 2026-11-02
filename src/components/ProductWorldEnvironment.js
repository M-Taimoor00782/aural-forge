"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, Color } from "three";
import gsap from "gsap";

import {
  DEFAULT_PRODUCT_FAMILY_ID,
  getProductFamily,
  getProductFamilyWorld,
} from "@/config/productFamilies";

// --------------------------------------------------
// Approved sky shaders
// --------------------------------------------------

const VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(position, 1.0);
  }
`;

const SKY_SHADER = `
  uniform vec3 uBackground;
  uniform vec3 uSurface;
  uniform vec3 uAccent;

  varying vec2 vUv;

  float softField(
    vec2 uv,
    vec2 center,
    vec2 radius
  ) {
    vec2 p = (uv - center) / radius;
    return exp(-dot(p, p) * 2.4);
  }

  void main() {
    vec2 uv = vUv;

    float upper = softField(
      uv,
      vec2(0.62, 0.84),
      vec2(0.65, 0.68)
    );

    float lower = softField(
      uv,
      vec2(0.18, 0.03),
      vec2(0.70, 0.62)
    );

    vec3 color = uBackground;

    color = mix(
      color,
      uAccent,
      upper * 0.085
    );

    color = mix(
      color,
      uSurface,
      lower * 0.16
    );

    float vignette = smoothstep(
      0.25,
      0.85,
      length((uv - 0.5) * vec2(1.0, 0.88))
    );

    color *= 1.0 - vignette * 0.10;

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
  }
`;

const STAR_VERTEX = `
  attribute float aSize;
  attribute float aStrength;
  attribute float aTwinkle;

  uniform float uPixelRatio;
  uniform float uTwinkle;

  varying float vStrength;

  void main() {
    vStrength =
      aStrength *
      (1.0 + aTwinkle * uTwinkle * 0.28);

    vec4 viewPosition =
      modelViewMatrix *
      vec4(position, 1.0);

    gl_Position =
      projectionMatrix * viewPosition;

    gl_PointSize = min(
      aSize * uPixelRatio,
      16.0
    );
  }
`;

const STAR_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vStrength;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float r = length(p);

    float core =
      1.0 - smoothstep(0.035, 0.17, r);

    float halo = exp(-r * r * 18.0);

    float sparkle =
      core * 0.76 +
      halo * 0.30;

    float alpha = clamp(
      sparkle * vStrength * uOpacity,
      0.0,
      1.0
    );

    gl_FragColor = vec4(
      uColor,
      alpha
    );

    #include <colorspace_fragment>
  }
`;

// --------------------------------------------------
// Meteor shaders
// --------------------------------------------------

// Anchor the tail's right edge to the meteor head.
// Scaling X now grows the trail backwards without
// separating it from the head.
const METEOR_TAIL_VERTEX = `
  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec3 localPosition = position;

    // Default plane spans -0.5 to +0.5.
    // Shift it to -1.0 to 0.0.
    localPosition.x -= 0.5;

    gl_Position =
      projectionMatrix *
      modelViewMatrix *
      vec4(localPosition, 1.0);
  }
`;

const METEOR_TAIL_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    float along = clamp(vUv.x, 0.0, 1.0);
    float across = abs(vUv.y - 0.5);

    // The far end fades gently but the
    // majority of the trail remains readable.
    float brightness = mix(
      0.28,
      1.0,
      smoothstep(0.0, 0.95, along)
    );

    // Narrow luminous center.
    float core =
      1.0 - smoothstep(
        0.055,
        0.155,
        across
      );

    // Soft light immediately around the core.
    float halo = exp(
      -pow(across / 0.23, 2.0) * 1.6
    );

    float alpha = (
      core * 1.0 +
      halo * 0.22
    ) * brightness * uOpacity;

    gl_FragColor = vec4(
      uColor,
      clamp(alpha, 0.0, 1.0)
    );

    #include <colorspace_fragment>
  }
`;

const METEOR_HEAD_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);

    float core = exp(-r * r * 200.0);
    float innerGlow = exp(-r * r * 48.0);
    float outerGlow = exp(-r * r * 13.0);

    float horizontalFlare =
      exp(-abs(p.y) * 55.0) *
      exp(-abs(p.x) * 15.0);

    float verticalFlare =
      exp(-abs(p.x) * 55.0) *
      exp(-abs(p.y) * 15.0);

    float alpha = (
      core +
      innerGlow * 0.62 +
      outerGlow * 0.15 +
      (horizontalFlare + verticalFlare) * 0.12
    ) * uOpacity;

    gl_FragColor = vec4(
      uColor,
      clamp(alpha, 0.0, 1.0)
    );

    #include <colorspace_fragment>
  }
`;

// --------------------------------------------------
// World configuration
// --------------------------------------------------

const STAR_LAYERS = [
  { count: 90, seed: 81023, z: -43 },
  { count: 115, seed: 45071, z: -73 },
  { count: 135, seed: 29017, z: -112 },
];

const SKY_DEPTH = -150;
const METEOR_DEPTH = -53;

const HOLD_DURATION = 5000;

const CONTROL_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "textarea",
  "select",
  "summary",
  "label",
  '[role="button"]',
  '[role="link"]',
  '[role="slider"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="tab"]',
  '[contenteditable="true"]',
  '[aria-pressed]',
  '[data-af-cursor="interactive"]',
  '[data-af-cursor="grab"]',
  '[data-af-cursor="grabbing"]',
].join(", ");

function createRandom(seed) {
  let state = seed >>> 0;

  return function random() {
    state = (
      Math.imul(1664525, state) +
      1013904223
    ) >>> 0;

    return state / 4294967296;
  };
}

function createStars(count, seed) {
  const random = createRandom(seed);

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const strengths = new Float32Array(count);
  const twinkles = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const offset = i * 3;

    positions[offset] = random() - 0.5;
    positions[offset + 1] = random() - 0.5;
    positions[offset + 2] = 0;

    const type = random();

    if (type < 0.69) {
      sizes[i] = 1.8 + random() * 1.4;
    } else if (type < 0.94) {
      sizes[i] = 3.5 + random() * 2.5;
    } else {
      sizes[i] = 6.5 + random() * 3.2;
    }

    strengths[i] = 0.60 + random() * 0.40;
    twinkles[i] = random() < 0.07 ? 1 : 0;
  }

  return {
    positions,
    sizes,
    strengths,
    twinkles,
  };
}

function getFrame(camera, z, width, height) {
  const distance = Math.abs(z);

  const halfHeight =
    Math.tan(
      (camera.fov * Math.PI) / 360
    ) * distance;

  const halfWidth =
    halfHeight *
    width / Math.max(1, height);

  return { halfWidth, halfHeight };
}

function StarLayer({
  data,
  z,
  uniforms,
  layerRef,
}) {
  return (
    <group ref={layerRef} position={[0, 0, z]}>
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

          <bufferAttribute
            attach="attributes-aTwinkle"
            args={[data.twinkles, 1]}
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

function ShootingStar({
  meteorRef,
  tailRef,
  headRef,
  uniforms,
}) {
  return (
    <group
      ref={meteorRef}
      name="AuralForgeShootingStar"
      position={[0, 0, METEOR_DEPTH]}
      visible={false}
    >
      <mesh
        ref={tailRef}
        frustumCulled={false}
        renderOrder={-850}
      >
        <planeGeometry args={[1, 1]} />

        <shaderMaterial
          vertexShader={METEOR_TAIL_VERTEX}
          fragmentShader={METEOR_TAIL_FRAGMENT}
          uniforms={uniforms}
          transparent
          blending={AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={headRef}
        position={[0, 0, 0.02]}
        frustumCulled={false}
        renderOrder={-849}
      >
        <planeGeometry args={[1, 1]} />

        <shaderMaterial
          vertexShader={VERTEX_SHADER}
          fragmentShader={METEOR_HEAD_FRAGMENT}
          uniforms={uniforms}
          transparent
          blending={AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// --------------------------------------------------
// Main component
// --------------------------------------------------

export default function ProductWorldEnvironment({
  familyId = DEFAULT_PRODUCT_FAMILY_ID,
  variantId,
}) {
  const camera = useThree(
    (state) => state.camera
  );

  const invalidate = useThree(
    (state) => state.invalidate
  );

  const viewport = useThree(
    (state) => state.size
  );

  const gl = useThree(
    (state) => state.gl
  );

  const worldRef = useRef(null);
  const tensionLayerRef = useRef(null);
  const skyRef = useRef(null);
  const starRefs = useRef([]);

  const meteorRef = useRef(null);
  const tailRef = useRef(null);
  const headRef = useRef(null);

  const initializedRef = useRef(false);

  const starData = useMemo(
    () =>
      STAR_LAYERS.map((layer) =>
        createStars(layer.count, layer.seed)
      ),
    []
  );

  const uniforms = useMemo(() => {
    const palette = getProductFamilyWorld(
      DEFAULT_PRODUCT_FAMILY_ID
    ).palette;

    return {
      sky: {
        uBackground: {
          value: new Color(palette.background),
        },
        uSurface: {
          value: new Color(palette.surface),
        },
        uAccent: {
          value: new Color(palette.accent),
        },
      },

      stars: {
        uColor: {
          value: new Color("#EFF6FF"),
        },
        uOpacity: { value: 0.85 },
        uPixelRatio: { value: 1 },
        uTwinkle: { value: 0 },
      },

      meteor: {
        uColor: {
          value: new Color("#F5FAFF"),
        },
        uOpacity: { value: 0 },
      },
    };
  }, []);

  // Fixed screen-space world.
  // No scroll or pointer-driven sky transforms.
  useFrame(({ camera: activeCamera }) => {
    const world = worldRef.current;
    const sky = skyRef.current;

    if (!world || !sky) return;

    world.position.copy(activeCamera.position);
    world.quaternion.copy(activeCamera.quaternion);

    const width = viewport.width;
    const height = viewport.height;

    const skyFrame = getFrame(
      activeCamera,
      SKY_DEPTH,
      width,
      height
    );

    sky.scale.set(
      skyFrame.halfWidth * 2.04,
      skyFrame.halfHeight * 2.04,
      1
    );

    STAR_LAYERS.forEach((layer, index) => {
      const group = starRefs.current[index];

      if (!group) return;

      const frame = getFrame(
        activeCamera,
        layer.z,
        width,
        height
      );

      group.scale.set(
        frame.halfWidth * 2.08,
        frame.halfHeight * 2.08,
        1
      );
    });
  });

  useEffect(() => {
    uniforms.stars.uPixelRatio.value =
      Math.min(gl.getPixelRatio(), 1.8);

    invalidate();
  }, [
    gl,
    viewport.width,
    viewport.height,
    uniforms,
    invalidate,
  ]);

  // Preserve family and variant-driven palettes.
  useEffect(() => {
    const family = getProductFamily(familyId);

    const palette = getProductFamilyWorld(
      familyId,
      variantId
    ).palette;

    const headphones =
      family.id === DEFAULT_PRODUCT_FAMILY_ID;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const colors = [
      [
        uniforms.sky.uBackground.value,
        palette.background,
      ],
      [
        uniforms.sky.uSurface.value,
        palette.surface,
      ],
      [
        uniforms.sky.uAccent.value,
        palette.accent,
      ],
      [
        uniforms.stars.uColor.value,
        palette.text,
      ],
    ];

    const starOpacity =
      family.world.atmosphere?.stars?.opacity ??
      (headphones ? 0.85 : 0);

    if (
      !initializedRef.current ||
      reducedMotion
    ) {
      colors.forEach(([target, hex]) => {
        target.copy(new Color(hex));
      });

      uniforms.stars.uOpacity.value =
        starOpacity;

      initializedRef.current = true;
      invalidate();
      return;
    }

    const timeline = gsap.timeline({
      onUpdate: invalidate,
    });

    colors.forEach(([target, hex]) => {
      const next = new Color(hex);

      timeline.to(
        target,
        {
          r: next.r,
          g: next.g,
          b: next.b,
          duration: 1.1,
          ease: "power2.inOut",
        },
        0
      );
    });

    timeline.to(
      uniforms.stars.uOpacity,
      {
        value: starOpacity,
        duration: 1.1,
        ease: "power2.inOut",
      },
      0
    );

    return () => timeline.kill();
  }, [
    familyId,
    variantId,
    uniforms,
    invalidate,
  ]);

  // Preserve restrained occasional star twinkle.
  useEffect(() => {
    if (familyId !== DEFAULT_PRODUCT_FAMILY_ID) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) return;

    const random = createRandom(23170);

    let timer = null;
    let animation = null;
    let disposed = false;

    function schedule() {
      if (disposed) return;

      timer = window.setTimeout(() => {
        if (disposed) return;

        if (document.hidden) {
          schedule();
          return;
        }

        animation = gsap.timeline({
          onUpdate: invalidate,
          onComplete: schedule,
        });

        animation
          .to(uniforms.stars.uTwinkle, {
            value: 1,
            duration: 1.1,
            ease: "sine.inOut",
          })
          .to(uniforms.stars.uTwinkle, {
            value: 0,
            duration: 1.5,
            ease: "sine.inOut",
          });
      }, 12000 + random() * 9000);
    }

    schedule();

    return () => {
      disposed = true;

      if (timer !== null) {
        window.clearTimeout(timer);
      }

      animation?.kill();

      uniforms.stars.uTwinkle.value = 0;
      invalidate();
    };
  }, [familyId, uniforms, invalidate]);

  // Shooting stars and the five-second hold.
  useEffect(() => {
    if (familyId !== DEFAULT_PRODUCT_FAMILY_ID) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) return;

    const tensionLayer = tensionLayerRef.current;
    const meteor = meteorRef.current;
    const tail = tailRef.current;
    const head = headRef.current;

    if (
      !tensionLayer ||
      !meteor ||
      !tail ||
      !head
    ) {
      return;
    }

    const random = createRandom(93217);

    let disposed = false;
    let pressed = false;
    let holdTriggered = false;
    let pendingHold = false;

    let holdTimer = null;
    let automaticTimer = null;
    let meteorTimeline = null;
    let tensionTimeline = null;

    function clearAutomaticTimer() {
      if (automaticTimer !== null) {
        window.clearTimeout(automaticTimer);
        automaticTimer = null;
      }
    }

    function stopTension(immediate = false) {
      tensionTimeline?.kill();
      tensionTimeline = null;

      gsap.killTweensOf(tensionLayer.position);

      if (immediate) {
        tensionLayer.position.set(0, 0, 0);
        invalidate();
        return;
      }

      gsap.to(tensionLayer.position, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        onUpdate: invalidate,
      });
    }

    function startTension() {
      stopTension(true);

      const frame = getFrame(
        camera,
        STAR_LAYERS[1].z,
        viewport.width,
        viewport.height
      );

      // Roughly a one-pixel atmospheric tremor.
      const amplitude =
        frame.halfHeight * 0.003;

      tensionTimeline = gsap.timeline({
        repeat: -1,
        onUpdate: invalidate,
      });

      tensionTimeline
        .to(tensionLayer.position, {
          x: amplitude,
          y: -amplitude * 0.5,
          duration: 0.22,
          ease: "sine.inOut",
        })
        .to(tensionLayer.position, {
          x: -amplitude * 0.7,
          y: amplitude * 0.45,
          duration: 0.2,
          ease: "sine.inOut",
        })
        .to(tensionLayer.position, {
          x: 0,
          y: 0,
          duration: 0.23,
          ease: "sine.inOut",
        });
    }

    function scheduleAutomatic(delay) {
      if (disposed || pressed) return;

      clearAutomaticTimer();

      automaticTimer = window.setTimeout(() => {
        automaticTimer = null;

        if (disposed) return;

        if (
          document.hidden ||
          pressed ||
          meteorTimeline
        ) {
          scheduleAutomatic(4000);
          return;
        }

        launchMeteor("automatic");
      }, delay);
    }

    function launchMeteor(type) {
      if (disposed || document.hidden) return;

      if (meteorTimeline) {
        if (type === "hold") {
          pendingHold = true;
        }
        return;
      }

      clearAutomaticTimer();

      const frame = getFrame(
        camera,
        METEOR_DEPTH,
        viewport.width,
        viewport.height
      );

      // Upper-left, upper-center, or upper-right,
      // with a continuously random starting X.
      const horizontal =
        -0.72 + random() * 1.44;

      const startX =
        frame.halfWidth * horizontal;

      const startY =
        frame.halfHeight *
        (0.79 + random() * 0.09);

      let direction;

      if (horizontal < -0.14) {
        direction = 1;
      } else if (horizontal > 0.14) {
        direction = -1;
      } else {
        direction = random() < 0.5 ? -1 : 1;
      }

      // Strong diagonal cross-screen travel.
      const travelX =
        frame.halfWidth *
        (0.72 + random() * 0.13) *
        direction;

      const travelY =
        frame.halfHeight *
        (1.46 + random() * 0.10);

      const angle = Math.atan2(
        -travelY,
        travelX
      );

      // Long, thin trail.
      const streakLength =
        frame.halfHeight *
        (1.4 + random() * 0.1);

      const streakThickness =
        frame.halfHeight * 0.041;

      const headSize =
        frame.halfHeight * 0.071;

      meteor.position.set(
        startX,
        startY,
        METEOR_DEPTH
      );

      meteor.rotation.z = angle;

      // Tail is anchored at the head and
      // grows backward during the first
      // portion of the meteor's movement.
      tail.position.set(0, 0, 0);

      tail.scale.set(
        streakLength * 0.08,
        streakThickness,
        1
      );

      head.position.set(0, 0, 0.02);

      head.scale.set(
        headSize,
        headSize,
        1
      );

      uniforms.meteor.uOpacity.value = 0;

      meteor.visible = true;
      invalidate();

      if (type === "hold" && !tensionTimeline) {
        startTension();
      }

      const duration =
        1.75 + random() * 0.15;

      meteorTimeline = gsap.timeline({
        onUpdate: invalidate,

        onComplete: () => {
          meteorTimeline = null;

          uniforms.meteor.uOpacity.value = 0;
          meteor.visible = false;

          if (type === "hold") {
            stopTension(false);
          }

          invalidate();

          if (pendingHold) {
            pendingHold = false;
            launchMeteor("hold");
          } else if (!pressed) {
            scheduleAutomatic(
              23000 + random() * 14000
            );
          }
        },
      });

      meteorTimeline.to(
        meteor.position,
        {
          x: startX + travelX,
          y: startY - travelY,
          duration,
          ease: "none",
        },
        0
      );

      // The trail extends naturally behind the
      // bright moving head instead of appearing
      // instantly as a static full-length line.
      meteorTimeline.to(
        tail.scale,
        {
          x: streakLength,
          duration: 0.58,
          ease: "power2.out",
        },
        0
      );

      meteorTimeline.to(
        uniforms.meteor.uOpacity,
        {
          value: 1,
          duration: 0.12,
          ease: "sine.out",
        },
        0
      );

      // Hold visibility through most of the fall.
      meteorTimeline.to(
        uniforms.meteor.uOpacity,
        {
          value: 0,
          duration: 0.44,
          ease: "power2.in",
        },
        duration - 0.44
      );
    }

    function cancelHold() {
      const wasPressed = pressed;

      pressed = false;

      if (holdTimer !== null) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }

      // An activated hold continues its meteor.
      // An early release cancels the tension.
      if (!holdTriggered) {
        stopTension(false);
      }

      if (
        wasPressed &&
        !disposed &&
        !document.hidden &&
        !meteorTimeline &&
        automaticTimer === null
      ) {
        scheduleAutomatic(
          23000 + random() * 14000
        );
      }
    }

    function handlePointerDown(event) {
      if (
        event.pointerType !== "mouse" ||
        event.button !== 0 ||
        pressed
      ) {
        return;
      }

      const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
      ).matches;

      if (!finePointer) return;

      if (
        event.target instanceof Element &&
        event.target.closest(CONTROL_SELECTOR)
      ) {
        return;
      }

      pressed = true;
      holdTriggered = false;

      clearAutomaticTimer();

      startTension();

      holdTimer = window.setTimeout(() => {
        holdTimer = null;

        if (
          disposed ||
          !pressed ||
          document.hidden ||
          holdTriggered
        ) {
          return;
        }

        holdTriggered = true;
        launchMeteor("hold");
      }, HOLD_DURATION);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        cancelHold();
        clearAutomaticTimer();
        stopTension(true);
        return;
      }

      if (
        !pressed &&
        !meteorTimeline &&
        automaticTimer === null
      ) {
        scheduleAutomatic(9000);
      }
    }

    // Rare automatic meteor events.
    // The five-second hold remains the reliable,
    // intentional way to trigger the effect.
    scheduleAutomatic(
      9000 + random() * 5000
    );

    window.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    window.addEventListener(
      "pointerup",
      cancelHold
    );

    window.addEventListener(
      "pointercancel",
      cancelHold
    );

    window.addEventListener(
      "blur",
      cancelHold
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      disposed = true;
      pressed = false;

      if (holdTimer !== null) {
        window.clearTimeout(holdTimer);
      }

      clearAutomaticTimer();

      meteorTimeline?.kill();
      tensionTimeline?.kill();

      gsap.killTweensOf(tensionLayer.position);

      tensionLayer.position.set(0, 0, 0);
      uniforms.meteor.uOpacity.value = 0;

      meteor.visible = false;

      window.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      window.removeEventListener(
        "pointerup",
        cancelHold
      );

      window.removeEventListener(
        "pointercancel",
        cancelHold
      );

      window.removeEventListener(
        "blur",
        cancelHold
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      invalidate();
    };
  }, [
    familyId,
    camera,
    viewport.width,
    viewport.height,
    uniforms,
    invalidate,
  ]);

  return (
    <group
      ref={worldRef}
      name="AuralForgeFixedVisualWorld"
    >
      {/* Fixed sky; temporary vibration only
          during the intentional mouse hold. */}
      <group ref={tensionLayerRef}>
        <mesh
          ref={skyRef}
          position={[0, 0, SKY_DEPTH]}
          renderOrder={-1000}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1]} />

          <shaderMaterial
            uniforms={uniforms.sky}
            vertexShader={VERTEX_SHADER}
            fragmentShader={SKY_SHADER}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {STAR_LAYERS.map((layer, index) => (
          <StarLayer
            key={layer.seed}
            data={starData[index]}
            z={layer.z}
            uniforms={uniforms.stars}
            layerRef={(node) => {
              starRefs.current[index] = node;
            }}
          />
        ))}
      </group>

      {/* Moon intentionally removed. */}

      <ShootingStar
        meteorRef={meteorRef}
        tailRef={tailRef}
        headRef={headRef}
        uniforms={uniforms.meteor}
      />
    </group>
  );
}
