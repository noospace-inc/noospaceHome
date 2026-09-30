"use client";

// Requires:  npm i three
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const STEPS = [
  { title: "Initial Payment & Kickoff", text: "Once the initial payment is made, we get everything ready to start your project." },
  { title: "Discussion Meeting", text: "We meet with you to understand your business, goals, and requirements." },
  { title: "Sample Preview", text: "We build a sample of your website or product so you can see how it will look." },
  { title: "Development & Deployment", text: "We complete the project and deploy it so it's ready for testing." },
  { title: "Testing & Changes (1-2 Weeks)", text: "We test everything carefully, and you can share your changes during this time." },
  { title: "Final Payment & Official Launch", text: "After final checking and payment, we officially launch your product for the world to see." },
];

const N = STEPS.length;
const RADIUS = 3.6; // ring radius
const SIZE = 3.0; // each card is SIZE x SIZE (square, measured along the arc)
const RAIL = 9.5; // length of the electric rail on the cylinder axis
const DY = 3.3; // vertical distance between cards on the spiral
const ANG = 1.25; // angle between neighbouring cards (radians)
const Y0 = -0.35; // height of the active card
const LINE_START = 0; // begin the electric line at the top of the section
const HEADING_FONT = 'Hatolie, sans-serif';
const BODY_FONT = 'Staravenue, sans-serif';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ---------- card face (drawn to a canvas, used as a texture) ---------- */
function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? line + " " + word : word;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y);
      line = word;
      y += lh;
    } else line = test;
  }
  g.fillText(line, x, y);
  return y + lh;
}

function drawStepIcon(g: CanvasRenderingContext2D, step: number) {
  const x = 800;
  const y = 700;
  g.save();
  g.translate(x, y);
  g.scale(2.2, 2.2);
  g.globalAlpha = 0.28;
  g.lineWidth = 9;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = "rgba(211, 183, 255, .9)";
  g.fillStyle = "rgba(174, 128, 244, .12)";
  g.shadowColor = "rgba(177, 132, 255, .95)";
  g.shadowBlur = 42;

  if (step === 0) {
    // Payment card with a small approval check.
    g.beginPath();
    g.roundRect(-72, -54, 144, 108, 18);
    g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-48, -18); g.lineTo(12, -18); g.moveTo(-48, 10); g.lineTo(-12, 10); g.stroke();
    g.beginPath(); g.arc(42, 28, 22, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(31, 28); g.lineTo(40, 37); g.lineTo(55, 18); g.stroke();
  } else if (step === 1) {
    // Two overlapping conversation bubbles.
    g.beginPath(); g.roundRect(-70, -52, 112, 78, 18); g.stroke();
    g.beginPath(); g.moveTo(-37, 26); g.lineTo(-52, 43); g.lineTo(-12, 26); g.stroke();
    g.beginPath(); g.roundRect(-4, -14, 78, 66, 16); g.stroke();
    g.beginPath(); g.moveTo(44, 52); g.lineTo(58, 67); g.lineTo(26, 52); g.stroke();
    g.beginPath(); g.moveTo(-43, -22); g.lineTo(14, -22); g.moveTo(-43, 1); g.lineTo(-8, 1); g.stroke();
  } else if (step === 2) {
    // Browser preview with an image thumbnail.
    g.beginPath(); g.roundRect(-74, -58, 148, 116, 16); g.stroke();
    g.beginPath(); g.moveTo(-73, -29); g.lineTo(73, -29); g.stroke();
    [-52, -36, -20].forEach((cx) => { g.beginPath(); g.arc(cx, -44, 3, 0, Math.PI * 2); g.stroke(); });
    g.beginPath(); g.roundRect(-51, -8, 56, 46, 7); g.stroke();
    g.beginPath(); g.moveTo(-45, 28); g.lineTo(-26, 9); g.lineTo(-12, 23); g.lineTo(-1, 11); g.stroke();
    g.beginPath(); g.arc(-34, 2, 4, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(18, -2); g.lineTo(54, -2); g.moveTo(18, 18); g.lineTo(54, 18); g.moveTo(18, 38); g.lineTo(44, 38); g.stroke();
  } else if (step === 3) {
    // Code brackets and a slash.
    g.beginPath(); g.moveTo(-40, -48); g.lineTo(-70, 0); g.lineTo(-40, 48); g.moveTo(40, -48); g.lineTo(70, 0); g.lineTo(40, 48); g.stroke();
    g.beginPath(); g.moveTo(20, -58); g.lineTo(-20, 58); g.stroke();
  } else if (step === 4) {
    // Shield with a checkmark.
    g.beginPath();
    g.moveTo(0, -68); g.lineTo(60, -46); g.lineTo(54, 15);
    g.quadraticCurveTo(48, 49, 0, 70); g.quadraticCurveTo(-48, 49, -54, 15);
    g.lineTo(-60, -46); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-28, 0); g.lineTo(-8, 21); g.lineTo(31, -24); g.stroke();
  } else {
    // A simple rising rocket with exhaust.
    g.beginPath();
    g.moveTo(0, -76); g.quadraticCurveTo(54, -35, 42, 28); g.lineTo(0, 54); g.lineTo(-42, 28);
    g.quadraticCurveTo(-54, -35, 0, -76); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.arc(0, -19, 16, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(-42, 17); g.lineTo(-68, 45); g.lineTo(-36, 39);
    g.moveTo(42, 17); g.lineTo(68, 45); g.lineTo(36, 39);
    g.moveTo(-18, 51); g.lineTo(-10, 76); g.lineTo(0, 60); g.lineTo(10, 76); g.lineTo(18, 51); g.stroke();
  }
  g.restore();
}

function drawFace(canvas: HTMLCanvasElement, i: number) {
  const S = 1024;
  canvas.width = canvas.height = S;
  const g = canvas.getContext("2d")!;
  const pad = 92;
  g.clearRect(0, 0, S, S);
  drawStepIcon(g, i);

  // big bare number inside the card: no circle, no border, no background
  const numY = pad + 170;
  const ng = g.createLinearGradient(pad, numY - 170, pad + 190, numY);
  ng.addColorStop(0, "#F8D299");
  ng.addColorStop(1, "#F59E51");
  g.fillStyle = ng;
  g.font = `400 210px ${BODY_FONT}`;
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.fillText(String(i + 1), pad - 6, numY);

  g.fillStyle = "#FFF0D9";
  g.font = `400 68px ${BODY_FONT}`;
  const y = wrap(g, STEPS[i].title, pad, numY + 110, S - pad * 2, 78);

  g.fillStyle = "#DCC6E0";
  g.font = `400 42px ${BODY_FONT}`;
  wrap(g, STEPS[i].text, pad, y + 22, S - pad * 2, 60);
}

/* ---------- shaders ---------- */
const PANEL_VERT = `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

// Frosted, curved glass: translucent body, fresnel, top-left highlight, amber rim, text on the outer face.
const PANEL_FRAG = `
uniform sampler2D uMap; uniform float uActive; uniform float uTime; uniform float uFade;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
float sdBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q,0.0)) + min(max(q.x,q.y),0.0) - r; }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  float d = sdBox(vUv - 0.5, vec2(0.5), 0.075);
  if (d > 0.0) discard;
  vec3 n = normalize(vN); vec3 v = normalize(vV);
  if (!gl_FrontFacing) n = -n;
  float fr  = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
float rim = 1.0 - smoothstep(0.0, 0.008, -d);
  float hl  = pow(clamp(1.0 - distance(vUv, vec2(0.04, 0.98)) * 1.05, 0.0, 1.0), 2.0) * 0.24;
  float sw  = smoothstep(0.0, 1.0, 1.0 - abs(vUv.x + vUv.y - fract(uTime * 0.05) * 3.0 + 0.6) * 3.0) * 0.07;
  float grain = (hash(vUv * 700.0) - 0.5) * 0.03;

  vec3 plum  = vec3(0.502, 0.290, 0.541);  // #804A8A
  vec3 deep  = vec3(0.227, 0.012, 0.325);  // #3A0353
  vec3 peach = vec3(0.973, 0.824, 0.600);  // #F8D299
  vec3 col = mix(plum, deep, smoothstep(0.95, 0.05, vUv.y));
  float a = 0.50 + hl * 0.8 + sw + fr * 0.30 + grain + uActive * 0.10;
  col = mix(col, peach, clamp(hl * 1.6 + fr * 0.35 + sw, 0.0, 0.6));
  col = mix(col, vec3(0.94, 0.94, 1.0), rim * 0.52);
  a += rim * 0.16;

  vec2 tuv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
  vec4 t = texture2D(uMap, tuv);
  col = mix(col, t.rgb, t.a);
  a = mix(a, 1.0, t.a * (gl_FrontFacing ? 1.0 : 0.6));
  a *= mix(0.7, 1.0, uActive);
  gl_FragColor = vec4(col, a * uFade);
}`;

const RAIL_VERT = `
uniform float uTime; uniform float uL; uniform float uAmp;
varying float vY; varying vec3 vN; varying vec3 vV;
float h(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float noise(float x){ float i = floor(x); float f = fract(x); return mix(h(i), h(i + 1.0), f * f * (3.0 - 2.0 * f)); }
void main(){
  vec3 p = position;
  vY = 0.5 - position.y / uL; // 0 at top, 1 at bottom
  float t = floor(uTime * 14.0);
  p.x += (noise(position.y * 5.0 + t * 3.1) - 0.5) * uAmp;
  p.z += (noise(position.y * 5.0 + t * 7.7 + 40.0) - 0.5) * uAmp;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const RAIL_FRAG = `
uniform float uP; uniform float uT; uniform float uO; uniform float uTime; uniform float uGain; uniform float uPow; uniform vec3 uColor;
varying float vY; varying vec3 vN; varying vec3 vV;
void main(){
  float lit  = smoothstep(uT, uT + 0.012, vY) * (1.0 - smoothstep(uP - 0.012, uP, vY));
  float tail = mix(0.2, 1.0, clamp((vY - uT) / max(uP - uT, 0.001), 0.0, 1.0));
  float pulse = 0.65 + 0.35 * sin(vY * 55.0 - uTime * 8.0);
  float f = pow(max(dot(normalize(vN), normalize(vV)), 0.0), uPow);
  float a = lit * tail * pulse * f * uO;
  gl_FragColor = vec4(uColor * uGain, a);
}`;

/* ---------- component ---------- */
export default function OurSteps() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [noGL, setNoGL] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      setNoGL(true);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    // A sparse, slow-moving star field stays behind the cards and electric rail.
    const starCount = window.innerWidth < 700 ? 650 : 1200;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPositions[i * 3] = (Math.random() - 0.5) * 34;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      starPositions[i * 3 + 2] = -8 - Math.random() * 24;
      const tint = Math.random() < 0.55
        ? new THREE.Color("#d8c7ff")
        : new THREE.Color("#f5eaff");
      const brightness = 0.55 + Math.random() * 0.45;
      starColors[i * 3] = tint.r * brightness;
      starColors[i * 3 + 1] = tint.g * brightness;
      starColors[i * 3 + 2] = tint.b * brightness;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.renderOrder = -10;
    scene.add(stars);

    /* electric rail on the cylinder axis */
    const railU = (gain: number, pw: number, amp: number) => ({
      uP: { value: 0 },
      uT: { value: 0 },
      uO: { value: 0 },
      uTime: { value: 0 },
      uL: { value: RAIL },
      uAmp: { value: amp },
      uGain: { value: gain },
      uPow: { value: pw },
      uColor: { value: new THREE.Color(0.96, 0.62, 0.32) },
    });
    const railMats = [
      new THREE.ShaderMaterial({ vertexShader: RAIL_VERT, fragmentShader: RAIL_FRAG, uniforms: railU(2.2, 0.35, 0.16), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      new THREE.ShaderMaterial({ vertexShader: RAIL_VERT, fragmentShader: RAIL_FRAG, uniforms: railU(0.9, 2.2, 0.16), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    ];
    const railCore = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, RAIL, 8, 220, true), railMats[0]);
    const railHalo = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, RAIL, 20, 220, true), railMats[1]);
    railCore.renderOrder = railHalo.renderOrder = 20;
    scene.add(railCore, railHalo);

    // glowing head of the line
    const hc = document.createElement("canvas");
    hc.width = hc.height = 128;
    const hg = hc.getContext("2d")!;
    const grad = hg.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.2, "rgba(248,210,153,0.95)");
    grad.addColorStop(0.5, "rgba(245,158,81,0.38)");
    grad.addColorStop(1, "rgba(245,158,81,0)");
    hg.fillStyle = grad;
    hg.fillRect(0, 0, 128, 128);
    const headTex = new THREE.CanvasTexture(hc);
    const headMat = new THREE.SpriteMaterial({ map: headTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const head = new THREE.Sprite(headMat);
    head.scale.setScalar(0.85);
    head.renderOrder = 20;
    scene.add(head);

    /* ring of curved glass cards */
    const ring = new THREE.Group();
    scene.add(ring);
    const theta = SIZE / RADIUS;
    const cards = STEPS.map((_, i) => {
      const canvasFace = document.createElement("canvas");
      drawFace(canvasFace, i);
      const tex = new THREE.CanvasTexture(canvasFace);
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const mat = new THREE.ShaderMaterial({
        vertexShader: PANEL_VERT,
        fragmentShader: PANEL_FRAG,
        uniforms: { uMap: { value: tex }, uActive: { value: 0 }, uTime: { value: 0 }, uFade: { value: 1 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const geo = new THREE.CylinderGeometry(RADIUS, RADIUS, SIZE, 48, 1, true, -theta / 2, theta);
      const mesh = new THREE.Mesh(geo, mat);
      ring.add(mesh);
      return { mesh, mat, tex, canvasFace, i };
    });

    // redraw once the display font is ready
    if (document.fonts?.load) {
      Promise.all([document.fonts.load(`400 210px ${BODY_FONT}`), document.fonts.load(`400 68px ${BODY_FONT}`), document.fonts.load(`400 43px ${BODY_FONT}`)])
        .then(() => cards.forEach((c) => { drawFace(c.canvasFace, c.i); c.tex.needsUpdate = true; }))
        .catch(() => {});
    }

    /* sizing */
    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const dist = Math.max(8.6, (SIZE * 1.4) / (2 * half * camera.aspect));
      camera.position.set(0, 2.1, RADIUS + dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    /* loop */
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let rot = 0;
    let lp = 0;
    let lt = 0;

    const tick = (now: number) => {
      raf = visible ? requestAnimationFrame(tick) : 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = reduce ? 0 : now * 0.001;

      const r = section.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const p = clamp(-r.top / span);
      if (!reduce) stars.rotation.y = time * 0.003;
      if (titleRef.current) {
        titleRef.current.style.opacity = String(1 - sstep(0.13, 0.19, p));
      }

      // cards use the first 86% of the scroll; the last card then holds while the line winds down
      const cp = clamp(p / 0.86);
      const t = cp * (N - 1);
      const k = Math.min(Math.floor(t), N - 2);
      const target = k + sstep(0.28, 0.72, t - k);
      rot += (target - rot) * (1 - Math.exp(-dt * 6));

      // electric line: the head runs down from the top as you scroll (reaches the end with card 6),
      // then the tail catches up from the top to the bottom until the line is gone
      lp += (clamp(p / 0.84) - lp) * (1 - Math.exp(-dt * 8));
      lt += (sstep(0, 1, clamp((p - 0.86) / 0.14)) - lt) * (1 - Math.exp(-dt * 8));
      const o = sstep(0, 0.03, p) * (1 - sstep(0.97, 1, p));
      const lineHeadProgress = LINE_START + lp * (1 - LINE_START);
      const lineTailProgress = LINE_START + lt * (1 - LINE_START);
      for (const m of railMats) {
        m.uniforms.uP.value = lineHeadProgress;
        m.uniforms.uT.value = lineTailProgress;
        m.uniforms.uO.value = o;
        m.uniforms.uTime.value = time;
      }
      head.position.set(0, RAIL / 2 - lineHeadProgress * RAIL, 0);
      headMat.opacity = o * (1 - lt) * (0.8 + 0.2 * Math.sin(time * 40));
      head.scale.setScalar(0.7 + 0.25 * Math.sin(time * 9));

      // spiral: card i sits (i - rot) steps away from the front; it rises as you scroll
      cards.forEach((c) => {
        const d = c.i - rot;
        c.mesh.position.y = Y0 - d * DY;
        c.mesh.rotation.y = d * ANG;
        c.mat.uniforms.uActive.value = 1 - sstep(0.15, 0.85, Math.abs(d));
        c.mat.uniforms.uTime.value = time;
        const y = c.mesh.position.y;
        c.mat.uniforms.uFade.value = (1 - sstep(1.5, 2.6, y)) * sstep(-DY * 1.9, -DY * 1.35, y);
        c.mesh.renderOrder = 20 + Math.round(Math.cos(d * ANG) * 4);
      });

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(section);

    return () => {
      visible = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      cards.forEach((c) => { c.mesh.geometry.dispose(); c.mat.dispose(); c.tex.dispose(); });
      starGeometry.dispose(); starMaterial.dispose();
      railCore.geometry.dispose(); railHalo.geometry.dispose(); railMats.forEach((m) => m.dispose());
      headTex.dispose(); headMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="our-steps"
      aria-label="Our steps"
      data-gl={noGL ? "0" : "1"}
      className="relative w-full"
      style={{ background: "#000", ...(noGL ? {} : { height: `${(N + 2) * 100}vh` }) }}
    >
      <style>{CSS}</style>
      <div ref={stageRef} className="os-stage">
        <canvas ref={canvasRef} className="os-canvas" style={noGL ? { display: "none" } : undefined} />
        <header ref={titleRef} className="os-title">
          <h2 data-section-shine>Your Project, Step by Step</h2>
          <p data-section-shine>A clear path from your first payment to your official launch.</p>
        </header>

        {/* Screen-reader list; shown as plain glass cards if WebGL is unavailable */}
        <ol className={noGL ? "os-fallback" : "os-sr"}>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="os-num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const CSS = `
#our-steps { font-family: 'Staravenue', sans-serif; }
#our-steps .os-stage {
  position: sticky; top: 0; height: 100vh; overflow: hidden;
  background: #000;
}
#our-steps .os-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

#our-steps .os-title {
  position: absolute; z-index: 2; top: clamp(24px, 6vh, 64px); left: 0; right: 0;
  text-align: center; padding: 0 24px; pointer-events: none;
}
#our-steps .os-title h2 { margin: 0; color: #FFF0D9; font-family: 'Hatolie', sans-serif; font-weight: 400; letter-spacing: -.025em; line-height: 1.08; font-size: clamp(1.7rem, 4.4vw, 3.1rem); }
#our-steps .os-title p { margin: 10px auto 0; max-width: 46ch; color: #DCC6E0; font-family: 'Staravenue', sans-serif; font-size: clamp(.92rem, 1.5vw, 1.1rem); line-height: 1.5; }

#our-steps .os-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0; list-style: none;
}

/* fallback (no WebGL) */
#our-steps[data-gl="0"] .os-stage { position: relative; height: auto; overflow: visible; padding: 0 20px 96px; }
#our-steps[data-gl="0"] .os-title { position: relative; top: auto; padding: 72px 0 40px; }
#our-steps .os-fallback {
  list-style: none; margin: 0 auto; padding: 0; max-width: 1000px;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;
}
#our-steps .os-fallback li {
  aspect-ratio: 1; padding: 28px; border-radius: 22px; color: #FFF0D9;
  background: linear-gradient(155deg, rgba(128,74,138,.75), rgba(58,3,83,.85));
  -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
  border: 1px solid rgba(245,158,81,.5); box-shadow: inset 0 1px 0 rgba(255,235,205,.18);
}
#our-steps .os-fallback .os-num {
  display: block; font-size: 4rem; line-height: 1; font-weight: 600; color: #F59E51;
}
#our-steps .os-fallback h3 { margin: 18px 0 8px; font-family: 'Staravenue', sans-serif; font-size: 1.25rem; font-weight: 400; }
#our-steps .os-fallback p { margin: 0; color: #DCC6E0; line-height: 1.55; }
`;
