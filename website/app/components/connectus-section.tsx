"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { SERVICES } from "./about-section";
import { canRenderFrame, configureMobileRenderer, handleContextLoss, isMobile3DDevice } from "./mobile-3d-config";

const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aGlow;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uFade;
  varying float vGlow;
  varying float vPhase;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float twinkle = 0.88 + 0.12 * sin(uTime * 1.7 + aPhase);
    gl_PointSize = clamp(aSize * (280.0 / -viewPosition.z) * twinkle, 1.0, 18.0);
    vGlow = aGlow;
    vPhase = aPhase;
    vColor = aColor;
    vFade = uFade;
  }
`;

const STAR_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying float vGlow;
  varying float vPhase;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float halo = exp(-d * 5.5) * 0.28;
    float core = pow(max(1.0 - d, 0.0), 10.0);
    float twinkle = 0.58 + 0.42 * (0.5 + 0.5 * sin(uTime * 1.7 + vPhase));
    float alpha = (halo + core * 0.85) * vGlow * twinkle * vFade;
    vec3 color = vColor * (0.65 + core * 2.8) * vFade;
    gl_FragColor = vec4(color, alpha);
  }
`;

// Glow transition: foreground.png is dissolved from the centre outward through
// a noisy, glowing burn edge.
const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const GLOW_FRAGMENT = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uProgress;
  uniform float uAspect;
  uniform float uImgAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.02 + 7.3;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // emulate object-fit: cover
    vec2 s = uAspect > uImgAspect
      ? vec2(1.0, uImgAspect / uAspect)
      : vec2(uAspect / uImgAspect, 1.0);
    vec2 tuv = (vUv - 0.5) * s + 0.5;
    vec4 fg = texture2D(uTex, tuv);

    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float n = fbm(p * 3.0 + uTime * 0.05);
    float d = length(p) + (n - 0.5) * 0.32;
    float maxD = length(vec2(uAspect * 0.5, 0.5));
    float t = mix(-0.45, maxD + 0.45, uProgress);
    float e = d - t;

    float vis = smoothstep(0.0, 0.14, e);
    float g = exp(-pow((e - 0.04) / 0.07, 2.0));
    g *= smoothstep(0.0, 0.02, uProgress) * (1.0 - smoothstep(0.98, 1.0, uProgress));

    vec3 hot = mix(vec3(0.208, 0.125, 0.373), vec3(0.706, 0.592, 1.0), g);
    float a = fg.a * vis;
    vec3 rgb = fg.rgb * a * (1.0 + g * 1.5) + hot * g * 1.4;
    float alpha = clamp(a + g * 0.85, 0.0, 1.0);
    gl_FragColor = vec4(rgb, alpha);
  }
`;

// Tune the galaxy's size, placement, starting rotation, and spin here.
const GALAXY_TRANSFORM = {
  scale: 1,
  position: { x: 0, y: -0.5, z: 0 },
  rotation: { x: -1.07, y: 0, z: 0 },
  spinSpeed: 0.035,
};

// Adjust each hand's placement and size independently (CSS units are supported).
const HAND_IMAGE_LAYOUT = {
  left: {
    left: "-10%", top: "82%", width: "min(61vw, 800px)", height: "auto",
    initial: { x: 0, y: 0, rotation: -20 },
    final: { x: 8, y: -5, rotation: -15 },
  },
  right: {
    right: "-5%", top: "15%", width: "min(61vw, 800px)", height: "auto",
    initial: { x: 0, y: 0, rotation: -14 },
    final: { x: -4, y: 10 , rotation: -17 },
  },
};

// Mobile-only composition controls for the hands and galaxy. Adjust these
// values independently from the desktop layout above.
const MOBILE_CONNECT_LAYOUT = {
  breakpoint: 768,
  cameraDistance: 70,
  galaxy: {
    scale: 1.15,
    position: { x: 1, y: 1.05, z: 0 },
  },
  hands: {
    left: {
      left: "-28%", top: "78%", width: "min(98vw, 760px)", height: "auto",
      initial: { x: -10, y: 10, rotation: -45},
      final: { x: 5, y: -1, rotation: -45 },
    },
    right: {
      right: "-28%", top: "27%", width: "min(98vw, 760px)", height: "auto",
      initial: { x: 10, y: -20, rotation: -50 },
      final: { x: 0, y: -5, rotation: -50 },
    },
  },
};

// Share of the scroll used by the hand motion; the remainder drives the glow transition.
const HAND_SCROLL_END = 0.5;
const IMAGE_PARALLAX = {
  background: 7,
  foreground: 14,
  hands: 24,
  clickScale: 0.025,
};

const MOBILE_UNIVERSE_STARS = Array.from({ length: 80 }, (_, index) => {
  const seed = index + 1;
  return {
    left: `${(seed * 61.803) % 100}%`,
    top: `${(seed * 37.719) % 100}%`,
    size: seed % 17 === 0 ? 2.5 : seed % 4 === 0 ? 1.75 : 1.25,
    delay: `${((seed * 13) % 50) / 10}s`,
  };
});

type HandMotion = {
  initial: { x: number; y: number; rotation: number };
  final: { x: number; y: number; rotation: number };
};

function randomGaussian() {
  const u = Math.max(Math.random(), 1e-8);
  const v = Math.max(Math.random(), 1e-8);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeStarField(count: number, galaxy: boolean) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const glows = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const white = new THREE.Color("#edf3ff");
  const blue = new THREE.Color("#739bff");
  const violet = new THREE.Color("#ad91ff");

  for (let i = 0; i < count; i += 1) {
    let x: number;
    let y: number;
    let z: number;
    let radius: number;

    if (galaxy) {
      radius = Math.pow(Math.random(), 1.52) * 9.2;
      const arm = Math.floor(Math.random() * 5);
      const angle = arm * ((Math.PI * 2) / 5) + radius * 0.52 + randomGaussian() * 0.28;
      x = Math.cos(angle) * radius + randomGaussian() * 0.11;
      y = Math.sin(angle) * radius + randomGaussian() * 0.11;
      z = randomGaussian() * (0.08 + radius * 0.027);
    } else {
      radius = 13 + Math.random() * 34;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      x = radius * Math.sin(phi) * Math.cos(theta);
      y = radius * Math.sin(phi) * Math.sin(theta);
      z = radius * Math.cos(phi);
    }

    positions.set([x, y, z], i * 3);
    sizes[i] = galaxy ? 0.65 + Math.random() * 1.35 : 0.45 + Math.random() * 1.05;
    const coreBoost = galaxy ? Math.exp(-radius * 0.32) : 0;
    glows[i] = 0.48 + Math.random() * 0.88 + coreBoost * 1.2;
    phases[i] = Math.random() * Math.PI * 2;
    const tint = Math.random() > 0.87 ? violet : Math.random() > 0.48 ? blue : white;
    const color = tint.clone().multiplyScalar(0.62 + Math.random() * 0.6 + coreBoost * 0.65);
    colors.set([color.r, color.g, color.b], i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aGlow", new THREE.BufferAttribute(glows, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}

function makeCoreGlow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.08, "rgba(255,255,255,0.92)");
  gradient.addColorStop(0.24, "rgba(218,230,255,0.46)");
  gradient.addColorStop(0.55, "rgba(118,158,255,0.12)");
  gradient.addColorStop(1, "rgba(80,115,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(10.5, 10.5, 1);
  return { sprite, texture, material };
}

export default function ConnectUsSection() {
  const [selectedService, setSelectedService] = useState("");
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [sceneNearViewport, setSceneNearViewport] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const leftHandRef = useRef<HTMLDivElement>(null);
  const rightHandRef = useRef<HTMLDivElement>(null);
  const handsWrapRef = useRef<HTMLDivElement>(null);
  const leftHandDepthRef = useRef<HTMLDivElement>(null);
  const rightHandDepthRef = useRef<HTMLDivElement>(null);
  const backgroundLayerRef = useRef<HTMLDivElement>(null);
  const contactCardRef = useRef<HTMLDivElement>(null);
  const transitionMessageRef = useRef<HTMLDivElement>(null);
  const foregroundLayerRef = useRef<HTMLDivElement>(null);
  const foregroundRef = useRef<HTMLImageElement>(null);
  const glowMountRef = useRef<HTMLDivElement>(null);
  const mobileBurnRef = useRef<HTMLDivElement>(null);
  const glowProgressRef = useRef(0);
  const backgroundZoomRef = useRef(1.025);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!isMobile3DDevice()) {
      setSceneNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setSceneNearViewport(true);
    }, { rootMargin: "700px 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const leftHand = leftHandRef.current;
    const rightHand = rightHandRef.current;
    const handsWrap = handsWrapRef.current;
    if (!section || !stage || !leftHand || !rightHand || !handsWrap) return;
    const mobile = isMobile3DDevice();

    const positionHand = (image: HTMLElement, layout: HandMotion, progress: number, width: number, height: number) => {
      const x = layout.initial.x + (layout.final.x - layout.initial.x) * progress;
      const y = layout.initial.y + (layout.final.y - layout.initial.y) * progress;
      const rotation = layout.initial.rotation + (layout.final.rotation - layout.initial.rotation) * progress;
      image.style.transform = `translate3d(${(x * width) / 100}px, ${(y * height) / 100}px, 0) translateY(-50%) rotate(${rotation}deg)`;
    };

    const updateProgress = () => {
      const rect = section.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      // Derived from the section's own position so it works with any scroll container.
      const progress = scrollDistance > 0
        ? THREE.MathUtils.clamp(-rect.top / scrollDistance, 0, 1)
        : 1;
      const handProgress = THREE.MathUtils.clamp(progress / HAND_SCROLL_END, 0, 1);
      const glowProgress = THREE.MathUtils.clamp((progress - HAND_SCROLL_END) / (1 - HAND_SCROLL_END), 0, 1);
      glowProgressRef.current = glowProgress;

      const stageRect = stage.getBoundingClientRect();
      const handLayout = stageRect.width <= MOBILE_CONNECT_LAYOUT.breakpoint
        ? MOBILE_CONNECT_LAYOUT.hands
        : HAND_IMAGE_LAYOUT;
      leftHand.style.left = handLayout.left.left;
      leftHand.style.right = "auto";
      leftHand.style.top = handLayout.left.top;
      leftHand.style.width = handLayout.left.width;
      rightHand.style.right = handLayout.right.right;
      rightHand.style.left = "auto";
      rightHand.style.top = handLayout.right.top;
      rightHand.style.width = handLayout.right.width;
      positionHand(leftHand, handLayout.left, handProgress, stageRect.width, stageRect.height);
      positionHand(rightHand, handLayout.right, handProgress, stageRect.width, stageRect.height);

      // Push into the center of the revealed background, then bring in the form.
      // Keep the background at its base scale during the entire foreground
      // reveal, then zoom it during the remaining scroll.
      const zoomProgress = THREE.MathUtils.clamp((glowProgress - 0.72) / 0.28, 0, 1);
      const zoomEase = zoomProgress * zoomProgress * (3 - 2 * zoomProgress);
      backgroundZoomRef.current = 1.025 + zoomEase * 2.05;
      if (backgroundLayerRef.current) {
        backgroundLayerRef.current.style.transform = mobile
          ? `translate3d(0, 0, 0) scale(${backgroundZoomRef.current})`
          : `scale(${backgroundZoomRef.current})`;
      }
      if (mobile) {
        const foreground = foregroundRef.current;
        const burn = mobileBurnRef.current;
        const maxRadius = Math.hypot(stageRect.width / 2, stageRect.height / 2);
        const edge = -0.45 * stageRect.height + (maxRadius + 0.9 * stageRect.height) * glowProgress;
        const feather = Math.max(18, stageRect.height * 0.14);

        if (foreground) {
          const mask = edge <= 0
            ? "none"
            : `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, edge)}px, #000 ${edge + feather}px)`;
          foreground.style.maskImage = mask;
          foreground.style.setProperty("-webkit-mask-image", mask);
        }

        if (burn) {
          if (edge <= 0 || edge >= maxRadius + feather) {
            burn.style.backgroundImage = "none";
            burn.style.opacity = "0";
          } else {
            const inner = Math.max(0, edge - feather);
            burn.style.backgroundImage = `radial-gradient(circle at 50% 50%, transparent ${inner}px, rgba(92, 42, 160, .28) ${Math.max(inner + 1, edge - feather * .35)}px, rgba(179, 132, 255, .95) ${edge}px, rgba(132, 76, 218, .68) ${edge + feather * .2}px, transparent ${edge + feather}px)`;
            burn.style.opacity = String(Math.min(1, glowProgress * 5, (1 - glowProgress) * 5));
          }
        }
      }
      if (contactCardRef.current) {
        const reveal = THREE.MathUtils.clamp((glowProgress - 0.9) / 0.1, 0, 1);
        contactCardRef.current.style.opacity = String(reveal);
        contactCardRef.current.style.transform = `translate(-50%, calc(-50% + ${(1 - reveal) * 28}px)) scale(${0.96 + reveal * 0.04})`;
        contactCardRef.current.style.pointerEvents = reveal > 0.85 ? "auto" : "none";
      }
      // Hands vanish with the same expanding, feathered radial wipe as the foreground.
      if (glowProgress > 0) {
        const aspect = stageRect.width / stageRect.height;
        const maxD = Math.hypot(aspect * 0.5, 0.5);
        const t = -0.45 + (maxD + 0.9) * glowProgress;
        const h = stageRect.height;
        const inner = Math.max(0, (t + 0.02) * h);
        const outer = Math.max(inner + 1, (t + 0.16) * h);
        const mask = `radial-gradient(circle at 50% 50%, transparent ${inner}px, #000 ${outer}px)`;
        handsWrap.style.maskImage = mask;
        handsWrap.style.setProperty("-webkit-mask-image", mask);
        handsWrap.style.visibility = glowProgress >= 1 ? "hidden" : "visible";
        if (transitionMessageRef.current) {
          // Let the headline linger just behind the foreground wipe so it is
          // already present whenever the foreground image is visible.
          const messageProgress = THREE.MathUtils.clamp((glowProgress - 0.07) / 0.93, 0, 1);
          const messageT = -0.45 + (maxD + 0.9) * messageProgress;
          const messageInner = Math.max(0, (messageT + 0.02) * h);
          const messageOuter = Math.max(messageInner + 1, (messageT + 0.16) * h);
          const messageMask = `radial-gradient(circle at 50% 50%, transparent ${messageInner}px, #000 ${messageOuter}px)`;
          transitionMessageRef.current.style.opacity = glowProgress >= 1 ? "0" : "1";
          transitionMessageRef.current.style.maskImage = messageMask;
          transitionMessageRef.current.style.setProperty("-webkit-mask-image", messageMask);
        }
      } else {
        handsWrap.style.maskImage = "none";
        handsWrap.style.setProperty("-webkit-mask-image", "none");
        handsWrap.style.visibility = "visible";
        if (transitionMessageRef.current) {
          transitionMessageRef.current.style.opacity = "1";
          transitionMessageRef.current.style.maskImage = "none";
          transitionMessageRef.current.style.setProperty("-webkit-mask-image", "none");
        }
      }
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    document.addEventListener("scroll", updateProgress, { passive: true, capture: true });
    window.addEventListener("resize", updateProgress);
    if (mobile && window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateProgress);
      window.visualViewport.addEventListener("scroll", updateProgress);
    }
    return () => {
      window.removeEventListener("scroll", updateProgress);
      document.removeEventListener("scroll", updateProgress, true);
      window.removeEventListener("resize", updateProgress);
      if (mobile && window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateProgress);
        window.visualViewport.removeEventListener("scroll", updateProgress);
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneNearViewport || isMobile3DDevice()) return;
    const mount = glowMountRef.current;
    const foreground = foregroundRef.current;
    if (!mount) return;

    const mobile = isMobile3DDevice();
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: mobile ? false : false,
      powerPreference: mobile ? "high-performance" : "default",
    });
    configureMobileRenderer(renderer, 1.75);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const uniforms = {
      uTex: { value: null as THREE.Texture | null },
      uProgress: { value: 0 },
      uAspect: { value: 1 },
      uImgAspect: { value: 1 },
      uTime: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERTEX,
      fragmentShader: GLOW_FRAGMENT,
      uniforms,
      transparent: true,
      blending: THREE.NoBlending,
      depthTest: false,
      depthWrite: false,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    quad.frustumCulled = false;
    scene.add(quad);

    let ready = false;
    let disposed = false;
    let texture: THREE.Texture | null = null;
    new THREE.TextureLoader().load("/letsconnect/foreground.png", (loaded) => {
      if (disposed) {
        loaded.dispose();
        return;
      }
      texture = loaded;
      loaded.minFilter = THREE.LinearFilter;
      loaded.generateMipmaps = false;
      uniforms.uTex.value = loaded;
      const img = loaded.image as { width: number; height: number };
      uniforms.uImgAspect.value = img.width / img.height;
      ready = true;
      // The canvas now draws the foreground; hide the static copy underneath.
      if (foreground) foreground.style.visibility = "hidden";
    });

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      uniforms.uAspect.value = width / height;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    let lastFrame = 0;
    let inView = false;
    const contextCleanup = mobile ? handleContextLoss(renderer, () => {
      renderer.domElement.style.display = "none";
      if (foreground) foreground.style.visibility = "visible";
    }) : () => {};
    const viewportObserver = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting);
    }, { rootMargin: "200px 0px" });
    if (mobile) viewportObserver.observe(sectionRef.current!);
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      if (!ready || (mobile && (!inView || document.hidden))) return;
      const now = performance.now();
      if (!canRenderFrame(now, lastFrame, mobile)) return;
      lastFrame = now;
      uniforms.uProgress.value = glowProgressRef.current;
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      viewportObserver.disconnect();
      contextCleanup();
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      texture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      if (foreground) foreground.style.visibility = "visible";
    };
  }, [sceneNearViewport]);

  useEffect(() => {
    if (!sceneNearViewport || isMobile3DDevice()) return;
    const mount = mountRef.current;
    const backgroundLayer = backgroundLayerRef.current;
    const foregroundLayer = foregroundLayerRef.current;
    const leftHandDepth = leftHandDepthRef.current;
    const rightHandDepth = rightHandDepthRef.current;
    if (!mount) return;

    const mobile = isMobile3DDevice();
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: mobile ? false : true,
      powerPreference: mobile ? "high-performance" : "default",
    });
    configureMobileRenderer(renderer, 1.75);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
    camera.position.set(0, 0, 21);

    const distantStars = makeStarField(1600, false);
    const galaxyStars = makeStarField(56000, true);
    scene.add(distantStars);

    const galaxy = new THREE.Group();
    galaxy.scale.setScalar(GALAXY_TRANSFORM.scale);
    galaxy.position.set(
      GALAXY_TRANSFORM.position.x,
      GALAXY_TRANSFORM.position.y,
      GALAXY_TRANSFORM.position.z,
    );
    galaxy.rotation.set(
      GALAXY_TRANSFORM.rotation.x,
      GALAXY_TRANSFORM.rotation.y,
      GALAXY_TRANSFORM.rotation.z,
    );
    galaxy.add(galaxyStars);
    const core = makeCoreGlow();
    galaxy.add(core.sprite);
    const coreSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, mobile ? 16 : 24, mobile ? 16 : 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }),
    );
    galaxy.add(coreSphere);
    scene.add(galaxy);
    const galaxyLayoutForWidth = (width: number) => width <= MOBILE_CONNECT_LAYOUT.breakpoint
      ? MOBILE_CONNECT_LAYOUT.galaxy
      : GALAXY_TRANSFORM;

    let targetPointerX = 0;
    let targetPointerY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let clickPulse = 0;
    const updatePointer = (event: PointerEvent) => {
      const bounds = mount.getBoundingClientRect();
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
        && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      targetPointerX = inside ? ((event.clientX - bounds.left) / bounds.width - 0.5) * 2 : 0;
      targetPointerY = inside ? ((event.clientY - bounds.top) / bounds.height - 0.5) * 2 : 0;
    };
    const pulseOnClick = (event: PointerEvent) => {
      const bounds = mount.getBoundingClientRect();
      if (event.clientX >= bounds.left && event.clientX <= bounds.right
        && event.clientY >= bounds.top && event.clientY <= bounds.bottom) {
        clickPulse = 1;
      }
    };
    window.addEventListener("pointermove", updatePointer);
    window.addEventListener("pointerdown", pulseOnClick);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const mobile = width <= MOBILE_CONNECT_LAYOUT.breakpoint;
      const galaxyLayout = galaxyLayoutForWidth(width);
      camera.position.z = mobile
        ? MOBILE_CONNECT_LAYOUT.cameraDistance
        : Math.max(21, 82.5 / Math.max(camera.aspect, 0.5));
      galaxy.position.set(galaxyLayout.position.x, galaxyLayout.position.y, galaxyLayout.position.z);
      galaxy.scale.setScalar(galaxyLayout.scale);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    let elapsedTime = 0;
    let frame = 0;
    let lastFrame = 0;
    let inView = false;
    let repeatedlyLost = false;
    const contextCleanup = mobile ? handleContextLoss(renderer, () => {
      repeatedlyLost = true;
      renderer.domElement.style.display = "none";
    }) : () => {};
    const viewportObserver = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting);
    }, { rootMargin: "200px 0px" });
    if (mobile) viewportObserver.observe(sectionRef.current!);
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      if (mobile && (!inView || document.hidden || repeatedlyLost)) return;
      const now = performance.now();
      if (!canRenderFrame(now, lastFrame, mobile)) return;
      lastFrame = now;
      const delta = Math.min(clock.getDelta(), 0.05);
      if (!reduceMotion) {
        elapsedTime += delta;
        const ease = Math.min(1, delta * 4);
        pointerX += (targetPointerX - pointerX) * ease;
        pointerY += (targetPointerY - pointerY) * ease;
        clickPulse = Math.max(0, clickPulse - delta * 2.2);
        const clickStrength = Math.sin((1 - clickPulse) * Math.PI);
        const moveLayer = (layer: HTMLElement | null, depth: number) => {
          if (!layer) return;
          layer.style.transform = `translate3d(${pointerX * depth}px, ${-pointerY * depth * 0.7}px, 0) scale(${1.025 + clickStrength * IMAGE_PARALLAX.clickScale})`;
        };
        if (backgroundLayer) {
          backgroundLayer.style.transform = `translate3d(${pointerX * IMAGE_PARALLAX.background}px, ${-pointerY * IMAGE_PARALLAX.background * 0.7}px, 0) scale(${backgroundZoomRef.current})`;
        }
        moveLayer(foregroundLayer, IMAGE_PARALLAX.foreground);
        moveLayer(leftHandDepth, IMAGE_PARALLAX.hands);
        moveLayer(rightHandDepth, IMAGE_PARALLAX.hands);
        const galaxyLayout = galaxyLayoutForWidth(mount.clientWidth);
        const parallax = mount.clientWidth <= MOBILE_CONNECT_LAYOUT.breakpoint ? 0.55 : 1;
        galaxy.position.x = galaxyLayout.position.x + pointerX * 1.1 * parallax;
        galaxy.position.y = galaxyLayout.position.y - pointerY * 0.8 * parallax;
        galaxy.scale.setScalar(galaxyLayout.scale * (1 + Math.sin((1 - clickPulse) * Math.PI) * 0.065));
        distantStars.position.x = pointerX * 0.3;
        distantStars.position.y = -pointerY * 0.22;
        galaxy.rotation.z = GALAXY_TRANSFORM.rotation.z + elapsedTime * GALAXY_TRANSFORM.spinSpeed;
        core.sprite.material.opacity = 0.82 + Math.sin(elapsedTime * 0.8) * 0.08;
        (distantStars.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;
        (galaxyStars.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;
      }
      const galaxyOpacity = 1 - glowProgressRef.current;
      (galaxyStars.material as THREE.ShaderMaterial).uniforms.uFade.value = galaxyOpacity;
      core.sprite.material.opacity = (0.82 + Math.sin(elapsedTime * 0.8) * 0.08) * galaxyOpacity;
      (coreSphere.material as THREE.MeshBasicMaterial).opacity = galaxyOpacity;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      viewportObserver.disconnect();
      contextCleanup();
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", pulseOnClick);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Points || object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      core.texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [sceneNearViewport]);

  return (
    <section
      ref={sectionRef}
      id="connectus"
      aria-label="Let's connect"
      className="relative h-[300vh] w-full bg-black"
      style={{ height: "300vh" }}
    >
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <div ref={mountRef} aria-hidden="true" className="absolute inset-0" />
        <div aria-hidden="true" className="mobile-connect-starfield pointer-events-none absolute inset-0 z-[1]">
          {MOBILE_UNIVERSE_STARS.map((star, index) => (
            <i
              key={index}
              className="mobile-connect-star"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: star.delay,
              }}
            />
          ))}
        </div>
        <div
          ref={backgroundLayerRef}
          aria-hidden="true"
          className="pointer-events-none absolute z-10"
          style={{ inset: "-2%", willChange: "transform", transformOrigin: "50% 50%" }}
        >
          <Image
            src="/letsconnect/background.png"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div
          ref={transitionMessageRef}
          className="pointer-events-none absolute left-1/2 top-[12%] z-40 w-[min(90vw,800px)] -translate-x-1/2 text-center"
          style={{ top: "calc(12% - 70px)" }}
        >
          <h2 className="connect-transition-heading text-4xl leading-tight text-white sm:text-6xl" style={{ fontFamily: "Hatolie, sans-serif", fontWeight: 700, textShadow: "0 0 10px rgba(255, 250, 242, .95), 0 0 32px rgba(255, 250, 242, .72)" }}>Ready to Grow Your Business?</h2>
          <p data-section-shine className="relative -top-2.5 mt-1 text-sm leading-relaxed text-violet-100 drop-shadow-[0_2px_18px_rgba(0,0,0,.8)] sm:text-lg" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>One message is all it takes to begin something new.</p>
        </div>
        <div
          ref={contactCardRef}
          className="absolute left-1/2 top-1/2 z-40 w-[min(92vw,1200px)] overflow-visible text-white opacity-0"
          style={{ transform: "translate(-50%, -50%) scale(.96)", transition: "opacity 120ms linear", pointerEvents: "none" }}
        >
          <div className="grid min-w-0 gap-10 md:grid-cols-[0.95fr_1.05fr] md:gap-14 lg:gap-20">
            <div className="flex min-w-0 items-center">
              <h2 className="max-w-[6ch] text-[150px] leading-[0.82] tracking-[-0.045em] text-[#fffaf2] max-md:text-[clamp(3.5rem,14vw,100px)]" style={{ fontFamily: "Hatolie, sans-serif" }}>
                Lets<br />Get In<br />Touch
              </h2>
            </div>
            <div className="min-w-0 pt-2 sm:pt-6">
              <form
                className="space-y-5 sm:space-y-7"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const formData = new FormData(form);
                  if (String(formData.get("website") ?? "").trim()) return;
                  if (!selectedService) {
                    setServiceMenuOpen(true);
                    return;
                  }
                  const data = formData;
                  const name = String(data.get("name") ?? "");
                  const service = String(data.get("service") ?? "");
                  const message = String(data.get("message") ?? "");
                  const body = encodeURIComponent(`Hi!, i'm ${name}, i am looking for ${service} service and ${message}`);
                  window.location.href = `https://wa.me/918300249089?text=${body}`;
                }}
              >
                <input type="text" name="website" autoComplete="off" tabIndex={-1} aria-hidden="true" hidden />
                <label className="block">
                  <span className="sr-only">Full name</span>
                  <input required name="name" placeholder="FULL NAME *" className="w-full border-0 border-b border-white/35 bg-transparent px-0 py-3 text-xs uppercase tracking-[0.16em] text-white outline-none placeholder:text-white/60 focus:border-white sm:text-sm" style={{ fontFamily: "'Staravenue', sans-serif" }} />
                </label>
                <div className="relative">
                  <span className="sr-only" id="connect-service-label">Service you are interested in</span>
                  <input type="hidden" name="service" value={selectedService} />
                  <button
                    type="button"
                    aria-labelledby="connect-service-label"
                    aria-haspopup="listbox"
                    aria-expanded={serviceMenuOpen}
                    onClick={() => setServiceMenuOpen((open) => !open)}
                    className="flex w-full items-center justify-between border-0 border-b border-white/35 bg-transparent px-0 py-3 text-left text-xs uppercase tracking-[0.16em] text-white outline-none focus:border-white sm:text-sm"
                    style={{ fontFamily: "'Staravenue', sans-serif" }}
                  >
                    <span className={selectedService ? "text-white" : "text-white/60"}>{selectedService || "SERVICE *"}</span>
                    <span aria-hidden="true" className="text-white/70">v</span>
                  </button>
                  {serviceMenuOpen && (
                    <ul role="listbox" aria-labelledby="connect-service-label" className="service-options-scroll absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(42vh,320px)] overflow-y-auto overscroll-contain rounded-lg border border-violet-200/30 bg-[#17131a]/95 py-1 shadow-[0_12px_36px_rgba(0,0,0,.55)] backdrop-blur-xl">
                      {SERVICES.map(({ name }) => (
                        <li key={name} role="option" aria-selected={selectedService === name}>
                          <button type="button" onClick={() => { setSelectedService(name); setServiceMenuOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm text-white/85 transition hover:bg-white/10 hover:text-white" style={{ fontFamily: "'Staravenue', sans-serif" }}>{name}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <label className="block">
                  <span className="sr-only">Message</span>
                  <textarea required name="message" rows={2} placeholder="MESSAGE *" className="w-full resize-none border-0 border-b border-white/35 bg-transparent px-0 py-3 text-xs uppercase tracking-[0.16em] text-white outline-none placeholder:text-white/60 focus:border-white sm:text-sm" style={{ fontFamily: "'Staravenue', sans-serif" }} />
                </label>
                <div className="flex justify-end pt-1">
                  <button type="submit" aria-label="Send project enquiry" className="group grid size-12 place-items-center text-4xl text-white transition hover:translate-x-1" style={{ fontFamily: "'Staravenue', sans-serif" }}>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </form>
              <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/20 pt-5 text-[9px] uppercase tracking-[0.1em] text-white/70 sm:gap-8 sm:pt-6 sm:text-[10px]" style={{ fontFamily: "'Staravenue', sans-serif" }}>
                <div>
                  <p className="mb-2 text-white/45">Instagram</p>
                  <a href="https://www.instagram.com/noospace.in/" target="_blank" rel="noreferrer" className="break-all text-white transition hover:text-violet-200">noospace.in</a>
                </div>
                <div>
                  <p className="mb-2 text-white/45">Gmail</p>
                  <a href="mailto:noospace.in@gmail.com" className="break-all normal-case tracking-normal text-white transition hover:text-violet-200">noospace.in@gmail.com</a>
                </div>
                <div>
                  <p className="mb-2 text-white/45">Phone</p>
                  <a href="tel:+918300249089" className="whitespace-nowrap text-white transition hover:text-violet-200">+91 83002 49089</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          ref={foregroundLayerRef}
          aria-hidden="true"
          className="pointer-events-none absolute z-20"
          style={{ inset: "-2%", willChange: "transform" }}
        >
          <Image
            ref={foregroundRef}
            src="/letsconnect/foreground.png"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div ref={mobileBurnRef} aria-hidden="true" className="connect-mobile-burn" />
          <div
            ref={glowMountRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          />
        </div>
        <div
          ref={handsWrapRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30"
        >
          <div
            ref={leftHandRef}
            aria-hidden="true"
            className="pointer-events-none absolute z-30 aspect-[3/1]"
            style={{
              left: HAND_IMAGE_LAYOUT.left.left,
              top: HAND_IMAGE_LAYOUT.left.top,
              width: HAND_IMAGE_LAYOUT.left.width,
              height: HAND_IMAGE_LAYOUT.left.height,
              transform: `translateY(-50%) rotate(${HAND_IMAGE_LAYOUT.left.initial.rotation}deg)`,
              willChange: "transform",
            }}
          >
            <div ref={leftHandDepthRef} className="absolute inset-0" style={{ willChange: "transform" }}>
              <Image src="/letsconnect2/handleft.webp" alt="" fill sizes="61vw" className="object-contain" />
            </div>
          </div>
          <div
            ref={rightHandRef}
            aria-hidden="true"
            className="pointer-events-none absolute z-30 aspect-[3/1]"
            style={{
              right: HAND_IMAGE_LAYOUT.right.right,
              top: HAND_IMAGE_LAYOUT.right.top,
              width: HAND_IMAGE_LAYOUT.right.width,
              height: HAND_IMAGE_LAYOUT.right.height,
              transform: `translateY(-50%) rotate(${HAND_IMAGE_LAYOUT.right.initial.rotation}deg)`,
              willChange: "transform",
            }}
          >
            <div ref={rightHandDepthRef} className="absolute inset-0" style={{ willChange: "transform" }}>
              <Image src="/letsconnect2/handright.webp" alt="" fill sizes="61vw" className="object-contain" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
