"use client";

import { useState, useRef, useEffect, useLayoutEffect, useId, type PointerEvent } from "react";
// Ink-blot hover reveal: two lerping, turbulence-distorted circles cut an
// organic hole through the cover image, revealing the layer underneath.
const INK_LEAD_EASE = 0.18;
const INK_TRAIL_EASE = 0.075;
const INK_RADIUS_EASE = 0.12;
const INK_LEAD_RADIUS = 76;
const INK_TRAIL_RADIUS = 116;

export default function AstronautReveal() {
  const instanceId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const leadCircleRef = useRef<SVGCircleElement>(null);
  const trailCircleRef = useRef<SVGCircleElement>(null);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef(false);

  const target = useRef({ x: 0, y: 0, show: false });
  const lead = useRef({ x: 0, y: 0, r: 0 });
  const trail = useRef({ x: 0, y: 0, r: 0 });

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Track the container's pixel size so the inline SVG's viewBox and the
  // mask/image geometry inside it line up exactly with pointer coordinates.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => setSize({ width: container.clientWidth, height: container.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mq.matches;
    setReduceMotion(mq.matches);

    const handleChange = () => {
      prefersReducedMotionRef.current = mq.matches;
      setReduceMotion(mq.matches);
    };
    mq.addEventListener?.("change", handleChange);
    return () => mq.removeEventListener?.("change", handleChange);
  }, []);

  useEffect(() => {
    const tick = () => {
      const reduced = prefersReducedMotionRef.current;
      const posEaseLead = reduced ? 1 : INK_LEAD_EASE;
      const posEaseTrail = reduced ? 1 : INK_TRAIL_EASE;
      const rEase = reduced ? 1 : INK_RADIUS_EASE;

      const targetLeadR = target.current.show ? INK_LEAD_RADIUS : 0;
      const targetTrailR = target.current.show ? INK_TRAIL_RADIUS : 0;

      lead.current.x += (target.current.x - lead.current.x) * posEaseLead;
      lead.current.y += (target.current.y - lead.current.y) * posEaseLead;
      lead.current.r += (targetLeadR - lead.current.r) * rEase;

      trail.current.x += (target.current.x - trail.current.x) * posEaseTrail;
      trail.current.y += (target.current.y - trail.current.y) * posEaseTrail;
      trail.current.r += (targetTrailR - trail.current.r) * rEase;

      const lc = leadCircleRef.current;
      const tc = trailCircleRef.current;
      if (lc) {
        lc.setAttribute("cx", lead.current.x.toFixed(2));
        lc.setAttribute("cy", lead.current.y.toFixed(2));
        lc.setAttribute("r", Math.max(0, lead.current.r).toFixed(2));
      }
      if (tc) {
        tc.setAttribute("cx", trail.current.x.toFixed(2));
        tc.setAttribute("cy", trail.current.y.toFixed(2));
        tc.setAttribute("r", Math.max(0, trail.current.r).toFixed(2));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const updateTarget = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    target.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      show: true,
    };
    if (!hasInteracted) setHasInteracted(true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => updateTarget(event);
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => updateTarget(event);

  const handlePointerLeave = () => {
    target.current = { ...target.current, show: false };
  };

  // Touch has no hover, so treat lifting the finger the same as the pointer leaving.
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      target.current = { ...target.current, show: false };
    }
  };

  const { width, height } = size;
  const ready = width > 0 && height > 0;

  return (
    <div
      ref={containerRef}
      aria-label="Astronaut artwork. Move your cursor or finger over the image to reveal the layer beneath."
      className="relative aspect-[9/16] w-full touch-none select-none overflow-visible"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
    >
      {ready && (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 block h-full w-full"
        >
          <defs>
            <filter
              id={`${instanceId}-ink-distort`}
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.016"
                numOctaves={2}
                seed={7}
                result="noise"
              >
                {!reduceMotion && (
                  <animate
                    attributeName="baseFrequency"
                    values="0.014;0.019;0.013;0.014"
                    dur="18s"
                    repeatCount="indefinite"
                  />
                )}
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={65}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            {/* Native SVG mask: white = visible, black = punched-through hole */}
            <mask
              id={`${instanceId}-ink-reveal-mask`}
              maskUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={width}
              height={height}
            >
              <rect x={0} y={0} width={width} height={height} fill="white" />
              <g filter={`url(#${instanceId}-ink-distort)`}>
                <circle ref={trailCircleRef} cx={0} cy={0} r={0} fill="black" />
                <circle ref={leadCircleRef} cx={0} cy={0} r={0} fill="black" />
              </g>
            </mask>
          </defs>

          {/* Bottom layer: the image revealed underneath */}
          <image
            href="/projectsecprop/back.png"
            x={0}
            y={0}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid slice"
          />

          {/* Top layer: the cover image, cut away by the ink mask */}
          <image
            href="/projectsecprop/front.png"
            x={0}
            y={0}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid slice"
            mask={`url(#${instanceId}-ink-reveal-mask)`}
          />
        </svg>
      )}


    </div>
  );
}

