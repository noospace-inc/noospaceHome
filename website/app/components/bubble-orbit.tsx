"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { canRenderFrame, configureMobileRenderer, handleContextLoss, isMobile3DDevice, lowMemoryDevice, MOBILE_CONFIG } from "./mobile-3d-config";
import {
  siGooglesearchconsole, siSemrush, siLighthouse,
  siKotlin, siSwift, siFlutter,
  siCpanel, siCloudflare, siWordpress,
  siReact, siNodedotjs, siDocker,
  siGoogleads, siMeta, siGoogletagmanager,
  siMailchimp, siWhatsapp, siZapier,
  siAnthropic, siLangchain, siPython,
  siSolidity, siEthereum, siPolygon,
  siSelenium, siCypress,
  type SimpleIcon,
} from "simple-icons";

/**
 * Labeled glass-bubble orbit around an astronaut cut-out, one bubble per service.
 *
 * AstronautReveal draws front.png inside an SVG with preserveAspectRatio
 * "slice" (= CSS object-fit: cover) in a 9/16 box. This component copies
 * that exact fit, measured every frame, so the orbit and the hiding shape
 * line up with the picture (floating animation included).
 *
 * Depth: an invisible plane shaped like the astronaut writes only depth.
 * Bubbles (and their labels) on the far half of the orbit are
 * hidden by the body; bubbles on the near half draw in front.
 */

const IMG_W = 493;
const IMG_H = 682;

// Orbit as drawn, in pixels of a 493 x 682 version of the image.
const CENTER_PX = { x: 250, y: 242 };
const ORBIT_OFFSET_X = 65;
const ORBIT_OFFSET_Y = 100; // an additional 50px below the existing 50px offset
const SEMI_MAJOR_PX = 300;
const MAJOR_AXIS_DEG = 35;
const TILT_COS = 0.3;

// One small glass bubble per technology category.
const BUBBLE_RADIUS = 0.07; // fraction of the astronaut's height, same for all
const SPEED = 0.24; // radians per second, same for all
const DEPTH_DIST = 1800; // camera distance in px

type IconSpec = { kind: "si"; icon: SimpleIcon } | { kind: "badge"; text: string; color: string };
const si = (icon: SimpleIcon): IconSpec => ({ kind: "si", icon });

const CATEGORIES: { serviceIndex: number; icons: IconSpec[] }[] = [
  { serviceIndex: 0, icons: [si(siReact), si(siNodedotjs), si(siDocker)] },
  { serviceIndex: 1, icons: [si(siGoogleads), si(siMeta), si(siWordpress)] },
  { serviceIndex: 2, icons: [si(siGooglesearchconsole), si(siSemrush), si(siLighthouse)] },
  { serviceIndex: 3, icons: [si(siKotlin), si(siSwift), si(siFlutter)] },
  { serviceIndex: 4, icons: [si(siCpanel), si(siCloudflare), si(siWordpress)] },
  { serviceIndex: 5, icons: [si(siReact), si(siNodedotjs), si(siDocker)] },
  { serviceIndex: 6, icons: [si(siGoogleads), si(siMeta), si(siGoogletagmanager)] },
  { serviceIndex: 7, icons: [si(siMailchimp), si(siWhatsapp), si(siZapier)] },
  { serviceIndex: 8, icons: [si(siAnthropic), si(siLangchain), si(siPython)] },
  { serviceIndex: 9, icons: [si(siSolidity), si(siEthereum), si(siPolygon)] },
  { serviceIndex: 10, icons: [si(siCpanel), si(siCloudflare), si(siWordpress)] },
  { serviceIndex: 11, icons: [si(siCloudflare), si(siSelenium), si(siCypress)] },
];

/** Paint one logo on a small beveled square tile. */
function makeIconTexture(spec: IconSpec): THREE.CanvasTexture {
  const S = 192;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const roundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  };
  roundedRect(28, 24, 146, 146, 25);
  const side = ctx.createLinearGradient(28, 24, 174, 170);
  side.addColorStop(0, "rgba(190, 210, 255, 0.22)");
  side.addColorStop(1, "rgba(55, 72, 112, 0.16)");
  ctx.fillStyle = side;
  ctx.fill();
  roundedRect(16, 12, 146, 146, 25);
  const face = ctx.createLinearGradient(20, 12, 150, 158);
  face.addColorStop(0, "rgba(255, 255, 255, 0.38)");
  face.addColorStop(0.55, "rgba(205, 220, 255, 0.2)");
  face.addColorStop(1, "rgba(122, 151, 210, 0.1)");
  ctx.fillStyle = face;
  ctx.shadowColor = "rgba(170, 200, 255, 0.18)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "rgba(238, 246, 255, 0.62)";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  if (spec.kind === "si") {
    const pad = S * 0.27;
    const scale = (S - pad * 2) / 24;
    ctx.save();
    ctx.translate(pad, pad);
    ctx.scale(scale, scale);
    ctx.fillStyle = `#${spec.icon.hex}`;
    ctx.fill(new Path2D(spec.icon.path));
    ctx.restore();
  } else {
    const b = S * 0.6;
    const x = (S - b) / 2;
    const r = b * 0.2;
    ctx.beginPath();
    ctx.moveTo(x + r, x);
    ctx.arcTo(x + b, x, x + b, x + b, r);
    ctx.arcTo(x + b, x + b, x, x + b, r);
    ctx.arcTo(x, x + b, x, x, r);
    ctx.arcTo(x, x, x + b, x, r);
    ctx.closePath();
    ctx.fillStyle = spec.color;
    ctx.fill();
    ctx.fillStyle = "#001e36";
    ctx.font = `700 ${b * 0.5}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spec.text, S / 2, S / 2 + b * 0.03);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const COUNT = CATEGORIES.length;

const vertexShader = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uPop;
  varying vec3 vNormalV;
  varying vec3 vViewPos;

  vec3 film(float t) {
    return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
  }

  void main() {
    vec3 N = normalize(vNormalV);
    vec3 V = normalize(-vViewPos);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.2);

    float swirl = sin(N.x * 3.1 + uTime * 0.35 + uSeed * 6.0)
                + sin(N.y * 4.3 - uTime * 0.28 + uSeed * 3.0);
    float thick = 0.55 + 0.18 * swirl + (1.0 - N.y) * 0.22;
    vec3 irid = film(thick * 1.25 + (1.0 - ndv) * 0.9);

    vec3 L1 = normalize(vec3(-0.55, 0.70, 0.55));
    vec3 L2 = normalize(vec3(0.65, -0.45, 0.35));
    float s1 = pow(max(dot(reflect(-L1, N), V), 0.0), 60.0);
    float s2 = pow(max(dot(reflect(-L2, N), V), 0.0), 35.0) * 0.4;
    float sheen = pow(max(dot(N, L1), 0.0), 3.0) * (1.0 - ndv) * 0.3;

    // Keep the film subtle so the logo tiles remain visible through it.
    vec3 col = irid * (0.28 + fres * 1.3) + vec3(1.0) * (s1 + s2 + sheen);
    float burst = exp(-pow((uPop - 0.14) / 0.12, 2.0));
    col = mix(col, vec3(1.0, 0.86, 1.0), burst * 0.8);
    float alpha = clamp(0.035 + fres * 0.48 + s1 + s2 * 0.45 + sheen * 0.3, 0.0, 0.8) * (1.0 - uPop);
    gl_FragColor = vec4(col, alpha);
  }
`;

type Props = {
  /** The cover image AstronautReveal draws (its front.png). */
  imageSrc: string;
  /** Wrapper around <AstronautReveal /> (its box is what the image covers). */
  targetRef: RefObject<HTMLElement | null>;
  onBubblePop: (serviceIndex: number) => void;
  revealed?: boolean;
};

export default function BubbleOrbit({ imageSrc, targetRef, onBubblePop, revealed = true }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const mobile = isMobile3DDevice();
    // The existing astronaut artwork beneath this decorative orbit is the
    // low-memory static fallback.
    if (lowMemoryDevice()) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: mobile ? false : true,
      powerPreference: mobile ? "high-performance" : "default",
    });
    configureMobileRenderer(renderer, 2);
    renderer.setClearColor(0x000000, 0);
    const cv = renderer.domElement;
    cv.style.cssText = "width:100%;height:100%;display:block";
    mount.appendChild(cv);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 10, 6000);
    camera.position.set(0, 0, DEPTH_DIST);

    // Depth-only silhouette of the astronaut. Bubbles stay hidden until its
    // mask is ready, otherwise a blank plane would hide every far bubble.
    const occluderMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });
    const occluder = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), occluderMat);
    occluder.renderOrder = -1;
    occluder.visible = false;
    scene.add(occluder);

    let disposed = false;
    let imgAspect = IMG_W / IMG_H;
    let ready = false;
    let maskTex: THREE.CanvasTexture | null = null;

    const im = new Image();
    im.onload = () => {
      if (disposed) return;
      const iw = im.naturalWidth;
      const ih = im.naturalHeight;
      imgAspect = iw / ih;

      // Build the silhouette from the image itself. If the PNG really has
      // transparency use its alpha; if it was exported with a solid black
      // backdrop, treat near-black as empty so the rectangle never blocks.
      const k = Math.min(1, 768 / Math.max(iw, ih));
      const w = Math.max(1, Math.round(iw * k));
      const h = Math.max(1, Math.round(ih * k));
      const src = document.createElement("canvas");
      src.width = w;
      src.height = h;
      const sctx = src.getContext("2d", { willReadFrequently: true })!;
      sctx.drawImage(im, 0, 0, w, h);
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      try {
        const data = sctx.getImageData(0, 0, w, h);
        const d = data.data;
        let hasAlpha = false;
        for (let i = 3; i < d.length; i += 4) {
          if (d[i] < 250) {
            hasAlpha = true;
            break;
          }
        }
        for (let i = 0; i < d.length; i += 4) {
          const solid = hasAlpha
            ? d[i + 3] > 20
            : Math.max(d[i], d[i + 1], d[i + 2]) > 26;
          d[i] = d[i + 1] = d[i + 2] = 255;
          d[i + 3] = solid ? 255 : 0;
        }
        out.getContext("2d")!.putImageData(data, 0, 0);
        maskTex = new THREE.CanvasTexture(out);
      } catch {
        maskTex = new THREE.CanvasTexture(src);
      }
      occluderMat.map = maskTex;
      occluderMat.needsUpdate = true;
      occluder.visible = true;
      ready = true;
    };
    im.src = imageSrc;

    const geo = new THREE.SphereGeometry(1, mobile ? MOBILE_CONFIG.sphereWidthSegments : 48, mobile ? MOBILE_CONFIG.sphereHeightSegments : 32);
    const meshes = Array.from({ length: COUNT }, (_, i) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        uniforms: { uTime: { value: 0 }, uSeed: { value: i * 0.31 }, uPop: { value: 0 } },
      });
      const m = new THREE.Mesh(geo, mat);
      m.renderOrder = 2; // shell draws before the icon sprites over it
      scene.add(m);
      return m;
    });

    // 2-3 icon sprites clustered inside each bubble. Sprites are children of
    // the bubble mesh, so they move/scale with it, always face the camera, and
    // stay depth-tested against the astronaut.
    const iconMats: THREE.SpriteMaterial[] = [];
    const iconTextures: THREE.Texture[] = [];
    const iconMatsByBubble: THREE.SpriteMaterial[][] = [];
    meshes.forEach((bubble, i) => {
      const icons = CATEGORIES[i]!.icons;
      const n = icons.length;
      const size = n >= 3 ? 0.52 : 0.64;
      const slots = n >= 3 ? [[0, 0.36], [-0.4, -0.3], [0.4, -0.3]] : [[-0.42, 0], [0.42, 0]];
      const bubbleMats: THREE.SpriteMaterial[] = [];
      icons.forEach((spec, j) => {
        const tex = makeIconTexture(spec);
        iconTextures.push(tex);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true, depthWrite: false });
        iconMats.push(mat);
        bubbleMats.push(mat);
        const sprite = new THREE.Sprite(mat);
        sprite.renderOrder = 3;
        sprite.position.set(slots[j]![0]!, slots[j]![1]!, 0.5);
        sprite.scale.set(size, size, 1);
        bubble.add(sprite);
      });
      iconMatsByBubble.push(bubbleMats);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const popped = Array<boolean>(COUNT).fill(false);
    const popStarted = Array<number | null>(COUNT).fill(null);
    const currentAngles = Array.from({ length: COUNT }, (_, i) => (i / COUNT) * Math.PI * 2);
    const targetAngles = [...currentAngles];
    const popSound = new Audio("/sound/bubble_popsound.mp3");
    const popBubbleAtPointer = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("[data-about-controls]")) return;
      const rect = cv.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes.filter((_, i) => !popped[i]), false)[0];
      if (!hit) return;
      const index = meshes.indexOf(hit.object as (typeof meshes)[number]);
      if (index < 0 || popped[index]) return;

      popped[index] = true;
      popStarted[index] = performance.now();
      onBubblePop(CATEGORIES[index]!.serviceIndex);
      const survivors = meshes.map((_, i) => i).filter((i) => !popped[i]);
      survivors.forEach((bubbleIndex, slot) => {
        targetAngles[bubbleIndex] = (slot / Math.max(survivors.length, 1)) * Math.PI * 2;
      });
      popSound.currentTime = 0;
      void popSound.play().catch(() => undefined);
    };
    window.addEventListener("pointerdown", popBubbleAtPointer);

    let cw = 0;
    let ch = 0;
    const resize = () => {
      cw = mount.clientWidth;
      ch = mount.clientHeight;
      if (!cw || !ch) return;
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      camera.fov = (2 * Math.atan(ch / 2 / DEPTH_DIST) * 180) / Math.PI;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    // Same maths as SVG preserveAspectRatio="xMidYMid slice".
    const measure = () => {
      const target = targetRef.current;
      if (!target) return null;
      const r = target.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      const bh = Math.max(r.width / imgAspect, r.height); // cover fit
      const bw = bh * imgAspect;
      const c = cv.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2 - (c.left + c.width / 2),
        cy: -(r.top + r.height / 2 - (c.top + c.height / 2)),
        w: bw,
        h: bh,
      };
    };

    const ang = (MAJOR_AXIS_DEG * Math.PI) / 180;
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    const vx = -Math.sin(ang);
    const vy = Math.cos(ang);
    const sinTilt = Math.sqrt(1 - TILT_COS * TILT_COS);

    const clock = new THREE.Clock();
    let raf = 0;
    let previousTime = 0;
    let lastFrame = 0;
    let inView = !mobile;
    let repeatedlyLost = false;
    const contextCleanup = mobile ? handleContextLoss(renderer, () => {
      repeatedlyLost = true;
      renderer.domElement.style.display = "none";
    }) : () => {};
    const viewportObserver = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting);
    }, { rootMargin: "400px 0px" });
    if (mobile) viewportObserver.observe(mount);
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (mobile && (!inView || document.hidden || repeatedlyLost)) return;
      const now = performance.now();
      if (!canRenderFrame(now, lastFrame, mobile)) return;
      lastFrame = now;
      const box = measure();
      if (!box || !cw || !ready) return;
      const t = reduceMotion ? 0 : clock.getElapsedTime();
      const frameDelta = Math.min(Math.max(t - previousTime, 0), 0.05);
      previousTime = t;
      const { w: bw, h: bh } = box;

      occluder.position.set(box.cx, box.cy, 0);
      occluder.scale.set(bw, bh, 1);

      const R = (SEMI_MAJOR_PX / IMG_H) * bh;
      const ox = box.cx + ((CENTER_PX.x + ORBIT_OFFSET_X) / IMG_W - 0.5) * bw;
      const oy = box.cy - (CENTER_PX.y / IMG_H - 0.5) * bh - ORBIT_OFFSET_Y;
      const rad = BUBBLE_RADIUS * bh;

      meshes.forEach((m, i) => {
        const material = m.material as THREE.ShaderMaterial;
        if (popped[i]) {
          const started = popStarted[i];
          if (started === null) return;
          const progress = Math.min((performance.now() - started) / 500, 1);
          m.scale.setScalar(rad * (1 - progress));
          material.uniforms.uPop.value = progress;
          iconMatsByBubble[i]!.forEach((iconMaterial) => { iconMaterial.opacity = 1 - progress; });
          if (progress >= 1) {
            m.visible = false;
            popStarted[i] = null;
          }
          return;
        }
        m.visible = true;
        const angleDelta = Math.atan2(Math.sin(targetAngles[i]! - currentAngles[i]!), Math.cos(targetAngles[i]! - currentAngles[i]!));
        currentAngles[i]! += angleDelta * Math.min(1, frameDelta * 5);
        const theta = currentAngles[i]! + t * SPEED;
        const a = Math.cos(theta) * R;
        const s = Math.sin(theta) * R;
        m.position.set(
          ox + ux * a + vx * s * TILT_COS,
          oy + uy * a + vy * s * TILT_COS,
          s * sinTilt // > 0 in front of astronaut, < 0 behind
        );
        m.scale.setScalar(rad);
        material.uniforms.uTime.value = t;
        material.uniforms.uPop.value = 0;
        iconMatsByBubble[i]!.forEach((iconMaterial) => { iconMaterial.opacity = 1; });
      });
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", popBubbleAtPointer);
      viewportObserver.disconnect();
      contextCleanup();
      ro.disconnect();
      geo.dispose();
      meshes.forEach((m) => (m.material as THREE.Material).dispose());
      occluder.geometry.dispose();
      occluderMat.dispose();
      maskTex?.dispose();
      iconMats.forEach((mm) => mm.dispose());
      iconTextures.forEach((tx) => tx.dispose());
      renderer.dispose();
      cv.remove();
    };
  }, [imageSrc, targetRef, onBubblePop]);

  // Covers the entire section: no wrapper in between can clip it.
  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      data-revealed={revealed ? "true" : "false"}
      className="about-orbit-reveal pointer-events-none absolute inset-0 z-10"
    />
  );
}
