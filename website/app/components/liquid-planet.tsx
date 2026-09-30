"use client";

export default function LiquidPlanet({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-full ${className ?? ""}`} style={{ isolation: "isolate" }}>
      {/* base dark sphere tone, sits under everything */}
      <div className="absolute inset-0" style={{ background: "#170e27" }} />

      {/* liquid blobs, merged into flowing shapes by the goo filter below */}
      <div className="planet-goo absolute inset-0">
        <div className="planet-blob planet-blob-a" />
        <div className="planet-blob planet-blob-b" />
        <div className="planet-blob planet-blob-c" />
        <div className="planet-blob planet-blob-d" />
      </div>

      {/* sphere shading: darkens toward the rim so it still reads as a 3D ball */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 45%, rgba(0,0,0,0.75) 100%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* uniform darkening pass so the overall sphere reads as a planet, not a glowing orb */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: "rgba(5,2,12,0.4)", mixBlendMode: "multiply" }}
      />

      {/* soft top-left specular highlight, like the original light source */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 42% 12%, rgba(255,255,255,0.22), transparent 24%)",
          mixBlendMode: "screen",
        }}
      />

      {/* slow-orbiting glassy sheen: a moving bright spot that reads as light catching a liquid surface */}
      <div className="planet-sheen pointer-events-none absolute inset-0 rounded-full" />

      {/* diagonal glass streak: a thin sweeping highlight, like light refracting through liquid glass */}
      <div className="planet-streak pointer-events-none absolute inset-0 rounded-full" />

      {/* fine grain texture, carried over from the original design */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-40 mix-blend-overlay"
        style={{
          background:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 6px)",
        }}
      />

      {/* hidden SVG filter that melts the blobs into liquid shapes where they overlap.
          primitiveUnits="objectBoundingBox" makes the blur scale with the sphere's own
          size, so the goo reads at any diameter instead of vanishing on a big sphere. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="planetGoo" primitiveUnits="objectBoundingBox">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.028 0.028" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12"
              result="goo"
            />
          </filter>
        </defs>
      </svg>

      <style>{`
        .planet-goo {
          filter: url(#planetGoo) saturate(1.15);
          animation: planetBreathe 16s ease-in-out infinite;
        }
        .planet-blob {
          position: absolute;
          inset: -18%;
          border-radius: 50%;
          filter: blur(2px);
        }
        .planet-blob-a {
          background: radial-gradient(circle at 35% 30%, #c084fc 0%, #6b21a8 45%, transparent 70%);
          animation: liquidA 9s ease-in-out infinite;
        }
        .planet-blob-b {
          background: radial-gradient(circle at 65% 62%, #9333ea 0%, #4c1d95 50%, transparent 72%);
          animation: liquidB 11s ease-in-out infinite;
        }
        .planet-blob-c {
          background: radial-gradient(circle at 50% 78%, #6d28d9 0%, #2e1065 55%, transparent 75%);
          animation: liquidC 13s ease-in-out infinite;
        }
        .planet-blob-d {
          background: radial-gradient(circle at 25% 55%, #a855f7 0%, #581c87 55%, transparent 70%);
          animation: liquidD 10s ease-in-out infinite;
        }
        @keyframes liquidA {
          0%, 100% { transform: translate(-12%, -8%) scale(1); }
          50% { transform: translate(16%, 14%) scale(1.35); }
        }
        @keyframes liquidB {
          0%, 100% { transform: translate(12%, 10%) scale(1.1); }
          50% { transform: translate(-18%, -12%) scale(0.8); }
        }
        @keyframes liquidC {
          0%, 100% { transform: translate(0%, 8%) rotate(0deg) scale(1); }
          50% { transform: translate(10%, -14%) rotate(22deg) scale(1.3); }
        }
        @keyframes liquidD {
          0%, 100% { transform: translate(-9%, 6%) scale(1.15); }
          50% { transform: translate(14%, -9%) scale(0.82); }
        }
        @keyframes planetBreathe {
          0%, 100% { filter: url(#planetGoo) saturate(1) brightness(0.92); }
          50% { filter: url(#planetGoo) saturate(1.15) brightness(1); }
        }
        .planet-sheen {
          background: radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 35%, transparent 65%);
          background-size: 55% 55%;
          background-repeat: no-repeat;
          mix-blend-mode: screen;
          opacity: 0.45;
          animation: sheenOrbit 12s ease-in-out infinite;
        }
        @keyframes sheenOrbit {
          0%   { background-position: 20% 15%; }
          25%  { background-position: 65% 20%; }
          50%  { background-position: 55% 55%; }
          75%  { background-position: 25% 50%; }
          100% { background-position: 20% 15%; }
        }
        .planet-streak {
          background: linear-gradient(
            115deg,
            transparent 42%,
            rgba(255,255,255,0.18) 48%,
            rgba(255,255,255,0.03) 52%,
            transparent 58%
          );
          mix-blend-mode: screen;
          opacity: 0.4;
          filter: blur(3px);
          animation: streakSweep 10s ease-in-out infinite;
        }
        @keyframes streakSweep {
          0%, 100% { transform: translate(-20%, -10%) rotate(0deg); }
          50% { transform: translate(20%, 12%) rotate(8deg); }
        }
      `}</style>
    </div>
  );
}