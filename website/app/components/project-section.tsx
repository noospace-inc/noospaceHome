"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback, type PointerEvent } from "react";
import NextImage from "next/image";
import AstronautReveal from "./astronaut-reveal";

export interface ProjectCardData {
  id: string;
  name: string;
  quote: string;
  description: string;
  category: string;
  tag: string;
  coverImage: string;
  behindImage: string;
}

export const PROJECT_CARDS: ProjectCardData[] = [
  {
    id: "tripfactory",
    name: "Tripfactory",
    quote: "Move like water, keep the fire quiet.",
    description:
      "A destination-first travel experience that turns ambitious plans into seamless journeys.",
    category: "Travel & Hospitality",
    tag: "TRIPFACTORY",
    coverImage: "/projects/tripfactorycover.webp",
    behindImage: "/projects/tripfactory.webp",
  },
  {
    id: "tamilakanews",
    name: "Tamilakanews",
    quote: "Stories that move fast, crafted for the modern reader.",
    description:
      "A high-performance digital newsroom engineered for instant updates and editorial gravity.",
    category: "Media & Journalism",
    tag: "TAMILAKA NEWS",
    coverImage: "/projects/tamilakanewsCover.webp",
    behindImage: "/projects/tamilakanews.webp",
  },
  {
    id: "tharanitextiles",
    name: "Tharanitextiles",
    quote: "Woven in heritage, tailored for contemporary elegance.",
    description:
      "A refined online storefront celebrating generational craftsmanship and artisanal beauty.",
    category: "Luxury E-Commerce",
    tag: "THARANI TEXTILES",
    coverImage: "/projects/tharanitextilesCover.webp",
    behindImage: "/projects/tharanitextiles.webp",
  },
  {
    id: "saravanatextiles",
    name: "Saravanatextiles",
    quote: "Heritage textures presented through modern commerce.",
    description:
      "A digital flagship balancing tactile tradition with effortless navigation and checkout.",
    category: "Wholesale & Retail",
    tag: "SARAVANA TRADERS",
    coverImage: "/projects/SaravanaTextilesCover.webp",
    behindImage: "/projects/SaravanaTextiles.webp",
  },
  {
    id: "srivari",
    name: "Srivaari",
    quote: "Where academic vision and institutional grace unite.",
    description:
      "An inspiring educational portal showcasing courses, achievements, and future opportunities.",
    category: "Education & Institution",
    tag: "SRI VAARI",
    coverImage: "/projects/SrivariCover.webp",
    behindImage: "/projects/Srivari.webp",
  },
  {
    id: "mellosoft",
    name: "Mellowsoft",
    quote: "Pure comfort engineered for restorative slumber.",
    description:
      "A confident digital storefront presenting luxury sleep systems and orthopedic innovations.",
    category: "Modern E-Commerce",
    tag: "MELLOSOFT",
    coverImage: "/projects/mellosoftCover.webp",
    behindImage: "/projects/mellosoft.webp",
  },
];

const projectCardTouchTimers = new WeakMap<HTMLElement, number>();

function updateProjectCardPointer(event: PointerEvent<HTMLElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  card.style.setProperty("--project-shine-x", `${x * 100}%`);
  card.style.setProperty("--project-shine-y", `${y * 100}%`);
  card.style.setProperty("--project-tilt-x", `${(0.5 - y) * 10}deg`);
  card.style.setProperty("--project-tilt-y", `${(x - 0.5) * 10}deg`);
}

function beginProjectCardInteraction(event: PointerEvent<HTMLElement>) {
  updateProjectCardPointer(event);
  const card = event.currentTarget;
  card.dataset.pointerActive = "true";

  if (event.pointerType !== "mouse") {
    card.dataset.touching = "true";
    const oldTimer = projectCardTouchTimers.get(card);
    if (oldTimer !== undefined) window.clearTimeout(oldTimer);
  }
}

function endProjectCardTouch(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === "mouse") return;
  const card = event.currentTarget;
  const oldTimer = projectCardTouchTimers.get(card);
  if (oldTimer !== undefined) window.clearTimeout(oldTimer);
  const timer = window.setTimeout(() => {
    delete card.dataset.touching;
    delete card.dataset.pointerActive;
    card.style.setProperty("--project-tilt-x", "0deg");
    card.style.setProperty("--project-tilt-y", "0deg");
    projectCardTouchTimers.delete(card);
  }, 900);
  projectCardTouchTimers.set(card, timer);
}

function leaveProjectCard(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;
  delete event.currentTarget.dataset.pointerActive;
  event.currentTarget.style.setProperty("--project-tilt-x", "0deg");
  event.currentTarget.style.setProperty("--project-tilt-y", "0deg");
}

interface ScratchCanvasProps {
  coverSrc: string;
  behindSrc: string;
  name: string;
  isActive: boolean;
  showControls?: boolean;
  mediaClassName?: string;
}

function ScratchCanvas({
  coverSrc,
  behindSrc,
  name,
  isActive,
  showControls = true,
  mediaClassName = "aspect-[4/3] rounded-t-[26px]",
}: ScratchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScratching = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Initialize or re-draw canvas with cover photo
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use untransformed client dimensions to avoid CSS scale distortion in stack
    const width = container.clientWidth || container.offsetWidth;
    const height = container.clientHeight || container.offsetHeight;
    if (!width || !height) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverSrc;

    const render = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);

      // Pre-fill white background so nothing behind ever bleeds through edges
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Draw cover photo precisely filling the entire container
      ctx.drawImage(img, 0, 0, width, height);
      setRevealed(false);
      setScratchPercent(0);
    };

    if (img.complete && img.naturalWidth !== 0) {
      render();
    } else {
      img.onload = render;
    }
  }, [coverSrc]);

  useEffect(() => {
    initCanvas();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      initCanvas();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [initCanvas, isActive]);

  const scratchAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const brushRadius = 38;

    if (lastPoint.current) {
      // Draw smooth interpolated brush line between lastPoint and current point
      const dx = x - lastPoint.current.x;
      const dy = y - lastPoint.current.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / 6));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const curX = lastPoint.current.x + dx * t;
        const curY = lastPoint.current.y + dy * t;

        const radial = ctx.createRadialGradient(curX, curY, 0, curX, curY, brushRadius);
        radial.addColorStop(0, "rgba(0, 0, 0, 1)");
        radial.addColorStop(0.7, "rgba(0, 0, 0, 0.85)");
        radial.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(curX, curY, brushRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const radial = ctx.createRadialGradient(x, y, 0, x, y, brushRadius);
      radial.addColorStop(0, "rgba(0, 0, 0, 1)");
      radial.addColorStop(0.7, "rgba(0, 0, 0, 0.85)");
      radial.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    lastPoint.current = { x, y };

    setScratchPercent((prev) => Math.min(100, prev + 2));
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!isActive) return;
    isScratching.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPoint.current = { x, y };
    scratchAt(x, y);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Both hovering (with pointer hovering over image) and active dragging scratch!
    scratchAt(x, y);
  };

  const handlePointerUp = () => {
    isScratching.current = false;
    lastPoint.current = null;
  };

  const handleRevealAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setRevealed(true);
    setScratchPercent(100);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    initCanvas();
  };

  return (
    <div
      ref={containerRef}
      className={`scratch-card-media relative w-full ${mediaClassName} touch-none select-none overflow-hidden bg-[#ffffff]`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Revealed behind screenshot */}
      <NextImage
        src={behindSrc}
        alt={`${name} preview`}
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        className="absolute inset-0 h-full w-full object-cover object-top select-none pointer-events-none"
      />

      {/* Top canvas cover that scratches away */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 block h-full w-full transition-opacity duration-300 ${
          revealed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {/* Subtle Hint & Scratch Controls */}
      {isActive && showControls && (
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between pointer-events-none">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase backdrop-blur-md transition-opacity duration-300 ${
              scratchPercent > 40 ? "opacity-0" : "bg-black/60 text-white/90 border border-white/10"
            }`}
          >
            <span aria-hidden className="text-amber-300">✦</span>
            Scratch to reveal
          </span>

          <div className="flex gap-1.5 pointer-events-auto">
            {scratchPercent > 5 && (
              <button
                type="button"
                onClick={handleReset}
                title="Reset cover"
                aria-label="Reset cover"
                className="grid size-7 place-items-center rounded-full bg-black/60 text-white/80 border border-white/10 backdrop-blur-md hover:bg-black/80 hover:text-white transition-colors"
              >
                <span aria-hidden className="text-xs">↻</span>
              </button>
            )}
            {!revealed && (
              <button
                type="button"
                onClick={handleRevealAll}
                title="Reveal all"
                aria-label="Reveal full screenshot"
                className="grid size-7 place-items-center rounded-full bg-black/60 text-white/80 border border-white/10 backdrop-blur-md hover:bg-black/80 hover:text-white transition-colors"
              >
                <span aria-hidden className="text-xs">◉</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectScratchStack() {
  const [deck, setDeck] = useState(PROJECT_CARDS);
  const [swipeState, setSwipeState] = useState<{
    swiping: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    swipingOut: boolean;
    direction: "next" | "prev";
  }>({
    swiping: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    swipingOut: false,
    direction: "next",
  });

  const nextCard = useCallback(() => {
    setSwipeState((prev) => ({ ...prev, swipingOut: true, direction: "next" }));
    setTimeout(() => {
      setDeck((prev) => {
        const [first, ...rest] = prev;
        return first ? [...rest, first] : prev;
      });
      setSwipeState({
        swiping: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        swipingOut: false,
        direction: "next",
      });
    }, 320);
  }, []);

  const prevCard = useCallback(() => {
    setSwipeState((prev) => ({ ...prev, swipingOut: true, direction: "prev" }));
    setTimeout(() => {
      setDeck((prev) => {
        const last = prev[prev.length - 1];
        const rest = prev.slice(0, prev.length - 1);
        return last ? [last, ...rest] : prev;
      });
      setSwipeState({
        swiping: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        swipingOut: false,
        direction: "prev",
      });
    }, 320);
  }, []);

  // Handle pointer drag on the content section (below the image)
  const handleContentPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (swipeState.swipingOut) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSwipeState({
      swiping: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      swipingOut: false,
      direction: "next",
    });
  };

  const handleContentPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!swipeState.swiping || swipeState.swipingOut) return;
    setSwipeState((prev) => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
    }));
  };

  const handleContentPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!swipeState.swiping || swipeState.swipingOut) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaY = swipeState.currentY - swipeState.startY;
    const dist = Math.hypot(deltaX, deltaY);

    if (dist > 50) {
      if (deltaX < -30) {
        nextCard();
      } else if (deltaX > 30) {
        prevCard();
      } else {
        nextCard();
      }
    } else {
      // Tap advances to next card
      nextCard();
    }
  };

  // Compute live drag transform
  const dragDeltaX = swipeState.swiping ? swipeState.currentX - swipeState.startX : 0;
  const dragDeltaY = swipeState.swiping ? swipeState.currentY - swipeState.startY : 0;
  const dragRotation = dragDeltaX * 0.04;

  const currentProject = deck[0] ?? PROJECT_CARDS[0]!;
  const activeIndex = PROJECT_CARDS.findIndex((p) => p.id === currentProject.id);

  return (
    <div className="project-3d-deck-wrapper relative flex flex-col items-center justify-center py-10">
      {/* 3D Card Stack Container */}
      <div className="relative h-[500px] w-full max-w-[320px] select-none perspective-[1200px] sm:h-[520px] sm:max-w-[340px]">
        {/* Render stacked cards backwards so top card renders last */}
        {deck
          .slice(0, 4)
          .reverse()
          .map((project, reverseIndex) => {
            const depthIndex = deck.slice(0, 4).length - 1 - reverseIndex;
            const isTop = depthIndex === 0;

            // 3D positioning per depth layer
            const translateY = depthIndex * 15;
            const scale = 1 - depthIndex * 0.055;
            const zIndex = 30 - depthIndex;
            const opacity = depthIndex === 0 ? 1 : Math.max(0.35, 1 - depthIndex * 0.28);
            const brightness = depthIndex === 0 ? 1 : 0.85 - depthIndex * 0.15;

            // Active swipe animation style
            let cardTransform = `translateY(${translateY}px) scale(${scale})`;
            let cardOpacity = opacity;

            if (isTop) {
              if (swipeState.swipingOut) {
                const outX = swipeState.direction === "next" ? -500 : 500;
                const outRot = swipeState.direction === "next" ? -24 : 24;
                cardTransform = `translate3d(${outX}px, 40px, 0) rotate(${outRot}deg) scale(0.9)`;
                cardOpacity = 0;
              } else if (swipeState.swiping) {
                cardTransform = `translate3d(${dragDeltaX}px, ${dragDeltaY}px, 0) rotate(${dragRotation}deg) scale(1)`;
              }
            }

            return (
              <div
                key={project.id}
                className={`project-interactive-card project-deck-card project-card-violet-gradient absolute inset-x-0 top-0 overflow-hidden rounded-[28px] border border-violet-300/40 shadow-[0_24px_65px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all duration-300 ${
                  isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
                }`}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") beginProjectCardInteraction(event);
                }}
                onPointerMove={(event) => {
                  updateProjectCardPointer(event);
                  if (event.pointerType === "mouse" || event.currentTarget.dataset.touching) {
                    event.currentTarget.dataset.pointerActive = "true";
                  }
                }}
                onPointerDown={beginProjectCardInteraction}
                onPointerUp={endProjectCardTouch}
                onPointerCancel={endProjectCardTouch}
                onPointerLeave={leaveProjectCard}
                style={{
                  zIndex,
                  transform: `${cardTransform} rotateX(var(--project-tilt-x, 0deg)) rotateY(var(--project-tilt-y, 0deg))`,
                  opacity: cardOpacity,
                  filter: `brightness(${brightness})`,
                  transition: swipeState.swiping
                    ? "none"
                    : "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease",
                }}
              >
                {/* Centered project title; drag here to move through the stack. */}
                <div
                  className="project-card-content relative flex h-[110px] flex-col items-center justify-center px-7 py-3 text-[#f6f3ee]"
                  onPointerDown={isTop ? handleContentPointerDown : undefined}
                  onPointerMove={isTop ? handleContentPointerMove : undefined}
                  onPointerUp={isTop ? handleContentPointerUp : undefined}
                  onPointerCancel={isTop ? handleContentPointerUp : undefined}
                >
                  <span className="mb-1 font-mono text-[9px] uppercase tracking-[0.24em] text-violet-200">
                    {project.category}
                  </span>
                  <h3 className="max-w-full text-center text-[25px] font-medium leading-[1.05] tracking-[0.04em] text-[#f5b470] sm:text-[28px]" style={{ fontFamily: "Hatolie, sans-serif" }}>
                    {project.name}
                  </h3>
                  <span className="project-card-arrow-gradient absolute right-5 top-5 grid size-8 place-items-center rounded-full text-[#201036]">
                    <span aria-hidden className="-translate-y-px text-sm">↗</span>
                  </span>
                </div>

                <div className="relative px-3">
                  <ScratchCanvas
                    coverSrc={project.coverImage}
                    behindSrc={project.behindImage}
                    name={project.name}
                    isActive={isTop}
                    mediaClassName="aspect-[4/3] rounded-[18px]"
                  />
                  <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-violet-200/20 bg-[#201036]/90 px-3 py-1 text-[9px] font-medium text-violet-100 backdrop-blur-md">
                    Explore project
                  </span>
                </div>

                <div className="flex h-[88px] items-center justify-center px-5 py-3 text-center">
                  <p className="line-clamp-3 max-w-[270px] text-[13px] font-semibold leading-snug text-[#d4d6cc]" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>
                    {project.description}
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      {/* Navigation Controls matching the reference image */}
      <div className="mt-7 flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-[0.24em] text-[#938c82]">
        <button
          type="button"
          onClick={prevCard}
          className="flex items-center gap-1 transition-colors hover:text-white"
          aria-label="Previous card"
        >
          <span aria-hidden>‹</span>
          <span>DRAG PREV</span>
        </button>
        <span className="text-white/20">·</span>
        <button
          type="button"
          onClick={nextCard}
          className="transition-colors hover:text-white"
          aria-label="Tap next card"
        >
          <span>TAP NEXT</span>
        </button>
        <span className="text-white/20">·</span>
        <button
          type="button"
          onClick={nextCard}
          className="flex items-center gap-1 transition-colors hover:text-white"
          aria-label="Next card"
        >
          <span>DRAG NEXT</span>
          <span aria-hidden>›</span>
        </button>
      </div>

      {/* Progress Dots */}
      <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
        {PROJECT_CARDS.map((p, idx) => (
          <span
            key={p.id}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === activeIndex ? "w-6 bg-violet-400" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConstellationField — a from-scratch particle-network canvas background.
// Thin, crisp (DPR-aware) node/line rendering with slow drift and gentle
// distance-based line fading. No external package or remote source involved.
// ---------------------------------------------------------------------------

interface ConstellationFieldProps {
  mode?: "dark" | "light";
  speed?: number;
  size?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
}

interface FieldParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function ConstellationField({
  mode = "dark",
  speed = 1,
  size = 1,
  length = 1,
  density = 1,
  opacity = 1,
  hue = 260,
  saturation = 0.55,
  brightness = 1,
  className = "",
}: ConstellationFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<FieldParticle[]>([]);
  const rafRef = useRef<number | null>(null);
  const dimsRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Base line length nodes will connect across, and roughly how many
    // particles per 10,000px^2 of canvas — both scaled by props.
    const CONNECT_DISTANCE = 130 * Math.max(0.4, length);
    const AREA_PER_PARTICLE = 9000 / Math.max(0.2, density);

    const nodeColor = `hsl(${hue}, ${Math.round(saturation * 100)}%, ${Math.round(
      (mode === "dark" ? 70 : 35) * brightness,
    )}%)`;
    const lineColor = `hsl(${hue}, ${Math.round(saturation * 100)}%, ${Math.round(
      (mode === "dark" ? 55 : 45) * brightness,
    )}%)`;

    const seedParticles = (width: number, height: number) => {
      const count = Math.max(8, Math.round((width * height) / AREA_PER_PARTICLE));
      const drift = 0.18 * Math.max(0.1, speed);
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * drift,
        vy: (Math.random() - 0.5) * drift,
      }));
    };

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimsRef.current = { width, height };
      seedParticles(width, height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const drawFrame = () => {
      const { width, height } = dimsRef.current;
      const particles = particlesRef.current;
      ctx.clearRect(0, 0, width, height);

      // Advance + wrap particle positions (skipped entirely if motion is reduced).
      if (!prefersReducedMotion) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;
        }
      }

      // Thin connector lines between nearby nodes, fading with distance.
      ctx.lineWidth = 0.75 * Math.max(0.5, size);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]!;
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECT_DISTANCE) {
            const lineAlpha = (1 - dist / CONNECT_DISTANCE) * 0.5 * opacity;
            if (lineAlpha <= 0.002) continue;
            ctx.strokeStyle = lineColor;
            ctx.globalAlpha = lineAlpha;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Crisp small node dots on top of the connector lines.
      ctx.globalAlpha = 1;
      ctx.fillStyle = nodeColor;
      const radius = 1.3 * Math.max(0.4, size);
      for (const p of particles) {
        ctx.globalAlpha = 0.85 * opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, speed, size, length, density, opacity, hue, saturation, brightness]);

  return (
    <div ref={containerRef} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

function ProjectCarousel({ revealProgress }: { revealProgress: number }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [drag, setDrag] = useState({ active: false, startX: 0, currentX: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setStageWidth(stage.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const move = useCallback((direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + PROJECT_CARDS.length) % PROJECT_CARDS.length);
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest(".scratch-card-media")) return;
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ active: true, startX: event.clientX, currentX: event.clientX });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.active) return;
    if (Math.abs(event.clientX - drag.startX) > 8) didDragRef.current = true;
    setDrag((current) => ({ ...current, currentX: event.clientX }));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.active) return;
    const delta = drag.currentX - drag.startX;
    if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
    setDrag({ active: false, startX: 0, currentX: 0 });
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const cardStep = stageWidth < 720 ? stageWidth * 0.58 : Math.min(300, stageWidth * 0.235);
  const dragOffset = drag.active ? drag.currentX - drag.startX : 0;
  const cardColors = [
    { border: "rgba(189, 171, 201, 0.55)", surface: "linear-gradient(155deg, rgba(128,74,138,.75), rgba(58,3,83,.85))", accent: "#bdabc9", glow: "rgba(150, 108, 161, 0.34)" },
    { border: "rgba(189, 171, 201, 0.55)", surface: "linear-gradient(155deg, rgba(128,74,138,.75), rgba(58,3,83,.85))", accent: "#bdabc9", glow: "rgba(150, 108, 161, 0.34)" },
    { border: "rgba(189, 171, 201, 0.55)", surface: "linear-gradient(155deg, rgba(128,74,138,.75), rgba(58,3,83,.85))", accent: "#bdabc9", glow: "rgba(150, 108, 161, 0.36)" },
    { border: "rgba(189, 171, 201, 0.55)", surface: "linear-gradient(155deg, rgba(128,74,138,.75), rgba(58,3,83,.85))", accent: "#bdabc9", glow: "rgba(150, 108, 161, 0.34)" },
    { border: "rgba(189, 171, 201, 0.55)", surface: "linear-gradient(155deg, rgba(128,74,138,.75), rgba(58,3,83,.85))", accent: "#bdabc9", glow: "rgba(150, 108, 161, 0.34)" },
    { border: "rgba(189, 171, 201, 0.55)", surface: "linear-gradient(155deg, rgba(128,74,138,.75), rgba(58,3,83,.85))", accent: "#bdabc9", glow: "rgba(150, 108, 161, 0.34)" },
  ];

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1320px]">
      <h2
        data-section-shine
        className="mx-auto max-w-3xl text-center text-[45px] font-normal leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl"
        style={{ fontFamily: "Hatolie, sans-serif" }}
      >
        Work That Speaks for Itself
      </h2>
      <p data-section-shine className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-white/65 sm:text-base" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>
        See how we&apos;ve helped businesses like yours go online and grow.
      </p>

      <div
        ref={stageRef}
        className="project-carousel-stage relative mt-10 h-[420px] touch-pan-y select-none overflow-hidden sm:mt-14 sm:h-[460px]"
        style={{ perspective: "1400px" }}
      >
        {PROJECT_CARDS.map((project, index) => {
          let offset = (index - activeIndex + PROJECT_CARDS.length) % PROJECT_CARDS.length;
          if (offset > PROJECT_CARDS.length / 2) offset -= PROJECT_CARDS.length;
          const visualOffset = offset * revealProgress;
          const distance = Math.abs(offset);
          const visualDistance = distance * revealProgress;
          const scale = 1 - visualDistance * 0.1;
          const opacity = visualDistance > 2 ? 0 : 1 - visualDistance * 0.19;

          const hovered = hoveredIndex === index;
          const color = cardColors[index % cardColors.length]!;

          return (
            <article
              key={project.id}
              aria-label={`${project.name}, card ${index + 1} of ${PROJECT_CARDS.length}`}
              aria-current={offset === 0 ? "true" : undefined}
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
                if (offset < 0) move(-1);
                if (offset > 0) move(1);
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="project-interactive-card project-deck-card absolute left-1/2 top-1/2 w-[min(72vw,270px)] overflow-hidden rounded-[28px] border"
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") beginProjectCardInteraction(event);
              }}
              onPointerMove={(event) => {
                updateProjectCardPointer(event);
                if (event.pointerType === "mouse" || event.currentTarget.dataset.touching) {
                  event.currentTarget.dataset.pointerActive = "true";
                }
              }}
              onPointerDown={beginProjectCardInteraction}
              onPointerUp={endProjectCardTouch}
              onPointerCancel={endProjectCardTouch}
              onPointerLeave={leaveProjectCard}
              style={{
                zIndex: 10 - distance,
                opacity,
                pointerEvents: distance > 2 ? "none" : "auto",
                filter: visualDistance === 0 ? "none" : `brightness(${1 - visualDistance * 0.12})`,
                borderColor: color.border,
                backgroundImage: color.surface,
                boxShadow: hovered
                  ? `0 0 30px ${color.glow}, 0 25px 80px rgba(0,0,0,0.65)`
                  : "0 24px 65px rgba(0,0,0,0.65)",
                transform: `translate(-50%, -50%) translateX(${visualOffset * cardStep + dragOffset}px) rotateY(${visualOffset * -17}deg) scale(${scale}) rotateX(var(--project-tilt-x, 0deg)) rotateY(var(--project-tilt-y, 0deg))`,
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                transition: drag.active
                  ? "none"
                  : revealProgress < 0.999
                    ? "none"
                    : "transform 650ms cubic-bezier(0.2, 0.75, 0.25, 1), opacity 500ms ease",
              }}
            >
              <div
                className="project-card-content relative flex h-[110px] flex-col items-center justify-center px-7 py-3 text-[#f6f3ee]"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <span className="mb-1 font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: color.accent }}>
                  {project.category}
                </span>
                <h3 className="max-w-full text-center text-[25px] font-medium leading-[1.05] tracking-[0.04em] text-[#f5b470] sm:text-[28px]" style={{ fontFamily: "Hatolie, sans-serif" }}>
                  {project.name}
                </h3>
                <span
                  aria-hidden="true"
                  className="project-card-arrow-gradient absolute right-5 top-5 grid size-8 place-items-center rounded-full text-[#20261a]"
                >
                  <span className="-translate-y-px text-sm">↗</span>
                </span>
              </div>

              <div className="relative px-3">
                <ScratchCanvas
                  coverSrc={project.coverImage}
                  behindSrc={project.behindImage}
                  name={project.name}
                  isActive={offset === 0}
                  showControls={false}
                  mediaClassName="aspect-[4/3] rounded-[18px]"
                />
              </div>

              <div className="flex h-[88px] items-center justify-center px-5 py-3 text-center">
                <p className="line-clamp-3 max-w-[270px] text-[13px] font-semibold leading-snug text-[#d4d6cc]" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>
                  {project.description}
                </p>
              </div>
            </article>
          );
        })}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[clamp(28px,8vw,120px)] bg-gradient-to-r from-black via-black/65 to-transparent backdrop-blur-[3px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-30 w-[clamp(28px,8vw,120px)] bg-gradient-to-l from-black via-black/65 to-transparent backdrop-blur-[3px]"
        />
      </div>


    </div>
  );
}

export function ProjectSectionContent({
  headingId,
  showAstronaut = true,
}: {
  headingId: string;
  showAstronaut?: boolean;
}) {
  return (
    <>
      <ConstellationField
        mode="dark"
        speed={0.7}
        size={1}
        length={1.1}
        density={0.9}
        opacity={0.8}
        hue={262}
        saturation={0.5}
        brightness={1}
      />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">
              <span className="mr-3 text-white/40">01</span>Selected work
            </p>
            <h2
              data-section-shine
              id={headingId}
              className="mt-5 max-w-2xl font-semibold text-4xl leading-tight tracking-tight sm:text-6xl"
              style={{ fontFamily: "Hatolie, sans-serif" }}
            >
              Built to be noticed.
            </h2>
          </div>
          <p data-section-shine className="max-w-md leading-7 text-white/60" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>
            A selection of digital products, platforms, and experiences made for brands moving forward.
          </p>
        </div>
        <div className={showAstronaut ? "grid items-center gap-10 lg:grid-cols-2 lg:gap-12" : "flex justify-center"}>
          {showAstronaut && (
            <div className="mx-auto w-full max-w-[350px]">
              <AstronautReveal />
            </div>
          )}
          <div className={showAstronaut ? "min-w-0" : "w-full max-w-[440px]"}>
            <ProjectScratchStack />
          </div>
        </div>
      </div>
    </>
  );
}

const PROJECT_BACKGROUND_STARS = [
  [4, 12, 1.4, 0.2], [12, 28, 1, 1.4], [18, 8, 1.8, 0.7], [23, 74, 1.2, 1.8],
  [29, 17, 1, 0.9], [35, 88, 1.7, 1.2], [41, 9, 1.1, 2.1], [47, 79, 1.4, 0.5],
  [53, 14, 1, 1.6], [59, 92, 1.8, 0.3], [65, 7, 1.2, 1.1], [71, 83, 1, 2.4],
  [77, 19, 1.6, 0.8], [83, 68, 1, 1.9], [89, 11, 1.3, 0.4], [96, 38, 1.8, 1.5],
  [7, 58, 1, 2.2], [15, 91, 1.5, 0.6], [26, 46, 1.1, 1.7], [38, 65, 1.7, 0.1],
  [62, 44, 1.3, 1.3], [74, 52, 1.8, 2.3], [86, 89, 1, 0.6], [93, 72, 1.4, 1.8],
] as const;

function ProjectBackgroundStars() {
  return (
    <div aria-hidden="true" className="project-starfield pointer-events-none absolute inset-0 z-0">
      {PROJECT_BACKGROUND_STARS.map(([x, y, size, delay], index) => (
        <span
          key={`${x}-${y}`}
          className={`project-star${index % 3 === 0 ? " project-star-twinkle" : ""}`}
          style={{ left: `${x}%`, top: `${y}%`, width: `${size}px`, height: `${size}px`, animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

export default function ProjectSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealProgress, setRevealProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = section?.querySelector<HTMLElement>(".project-carousel-stage");
    if (!stage) return;

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const rect = stage.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementHeight = Math.min(rect.height, viewportHeight);
      const endTop = viewportHeight - elementHeight;
      const startTop = viewportHeight;
      const raw = Math.max(0, Math.min(1, (startTop - rect.top) / (startTop - endTop)));
      setRevealProgress(raw * raw * (3 - 2 * raw));
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    document.addEventListener("scroll", scheduleUpdate, { passive: true, capture: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      document.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="projects"
      aria-label="Selected projects"
      className="project-section relative isolate flex min-h-screen w-full items-center overflow-hidden bg-black px-4 pt-32 pb-20 text-white sm:px-10 sm:pt-36 lg:px-16"
    >
      <ProjectBackgroundStars />
      <ProjectCarousel revealProgress={revealProgress} />
    </section>
  );
}
