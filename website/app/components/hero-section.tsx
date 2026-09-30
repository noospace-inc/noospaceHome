"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import AsteroidField from "./asteroid-field";
import LiquidPlanet from "./liquid-planet";

function FadeText({ text, delay = 0, shine = false }: { text: string; delay?: number; shine?: boolean }) {
  return (
    <span data-section-shine={shine ? "" : undefined} className="hero-basic-fade" style={{ animationDelay: `${delay}ms` }}>
      {text}
    </span>
  );
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState("");

  // Force the page itself black — if a global stylesheet/layout has a grid or
  // any other background on <html>/<body>, it can otherwise show through
  // around this section. This guarantees it can't.
  useEffect(() => {
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#000000";
    document.body.style.backgroundColor = "#000000";
    return () => {
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Dubai",
        })
      );
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  // depth helpers: higher depth = moves more with mouse
  const shift = (depth: number, axis: "x" | "y") =>
    (axis === "x" ? mouse.x : mouse.y) * depth;

  // Generate a starfield once: most stars are tiny and static, a subset are
  // larger and sparkle (animated twinkle).
  const stars = useMemo(() => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: 90 }, (_, i) => {
      const sparkle = i % 6 === 0; // ~1 in 6 stars sparkle
      return {
        top: `${rand() * 100}%`,
        left: `${rand() * 100}%`,
        size: sparkle ? 2 + rand() * 1.5 : 1 + rand() * 1,
        sparkle,
        duration: 2 + rand() * 3,
        delay: rand() * 5,
        depth: 4 + rand() * 10,
      };
    });
  }, []);

  return (
    <section
      ref={containerRef}
      aria-label="Hero section"
      className="relative flex min-h-screen w-full flex-col bg-black"
      style={{ backgroundColor: "#000000", overflow: "hidden" }}
    >
      {/* dedicated base layer — guarantees solid black fill regardless of parent/page styles */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "#000000", zIndex: 0 }}
      />

      {/* starfield */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 1,
          transform: `translate(${shift(8, "x")}px, ${shift(8, "y")}px)`,
          transition: "transform 0.4s ease-out",
        }}
      >
        {stars.map((s, i) => (
          <div
            key={i}
            className={s.sparkle ? "animate-[twinkle_ease-in-out_infinite]" : ""}
            style={{
              position: "absolute",
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              opacity: s.sparkle ? 0.9 : 0.5,
              boxShadow: s.sparkle
                ? "0 0 6px 1px rgba(255,255,255,0.9), 0 0 12px 3px rgba(180,140,240,0.5)"
                : "none",
              animationDuration: s.sparkle ? `${s.duration}s` : undefined,
              animationDelay: s.sparkle ? `${s.delay}s` : undefined,
            }}
          />
        ))}
      </div>

      {/* fog atmosphere, centered at the bottom */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[70%] blur-3xl"
        style={{
          zIndex: 2,
          background:
            "radial-gradient(65% 75% at 50% 100%, rgba(139,92,246,0.4), transparent 70%)",
          transform: `translate(${shift(14, "x")}px, ${shift(6, "y")}px)`,
          transition: "transform 0.5s ease-out",
        }}
      />

      {/* background wordmark, sitting behind the planet so the sphere naturally covers part of it.
          Logo and text share one grid cell — the text is declared second, so it always paints
          on top of the logo, with no z-index involved to be overridden by anything else. */}
      <div
        className="pointer-events-none absolute inset-x-0 isolate grid place-items-center select-none"
        style={{
          zIndex: 2,
          bottom: "54%",
          transform: `translate(${shift(6, "x")}px, ${shift(4, "y")}px)`,
          transition: "transform 0.5s ease-out",
        }}
      >
        <span
          className="hero-wordmark col-start-1 row-start-1 whitespace-nowrap font-nasalization font-semibold leading-none"
          style={{
            animation: "hero-wordmark-rise 0.75s cubic-bezier(0.2, 0.75, 0.25, 1) 1s both",
            fontSize: "min(150px, 12vw)",
            letterSpacing: "0.08em",
            color: "transparent",
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(196,164,246,0.85) 55%, rgba(120,90,170,0.65) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            textShadow: "0 0 60px rgba(160,120,220,0.25)",
          }}
        >
          NOOSPACE
        </span>
      </div>

      {/* planet — centering handled by this flex wrapper (no calc/transform), so it always
          sits dead-center at the bottom regardless of parallax transforms on the child */}
      <div
        className="hero-planet-wrapper pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center"
        style={{ zIndex: 3, animation: "hero-sphere-rise 1.4s cubic-bezier(0.2, 0.75, 0.25, 1) both" }}
      >
        <div
          className="relative"
          style={{
            width: "min(1280px, 132vw)",
            height: "min(1280px, 132vw)",
            flexShrink: 0,
            transform: `translate(${shift(-16, "x")}px, ${shift(-10, "y")}px)`,
            transition: "transform 0.5s ease-out",
          }}
        >
          {/* ambient glow behind the planet */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow:
                "0 -10px 160px 50px rgba(139,92,246,0.24), 0 -40px 220px rgba(200,170,255,0.12)",
            }}
          />
          <LiquidPlanet className="absolute inset-0 h-full w-full" />
        </div>
      </div>

      <AsteroidField />

      {/* darkness at the very bottom, deepening the shadow under the planet */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%]"
        style={{
          zIndex: 5,
          background: "linear-gradient(to top, #000000 0%, transparent 100%)",
        }}
      />

      {/* nav */}
      <header
        className="hero-navbar relative flex items-center justify-between px-4 py-5 md:px-12"
        style={{ zIndex: 20, animation: "hero-fade-up 1.2s cubic-bezier(0.2, 0.75, 0.25, 1) both" }}
      >
        <nav className="flex items-center gap-3 text-[11px] text-white/75 md:gap-6 md:text-[13px] md:text-white/60">
          <a href="#projects" className="hidden transition-colors hover:text-white md:inline">Projects</a>
          <a href="#about" className="transition-colors hover:text-white">About Us</a>
          <a href="#connectus" className="hidden transition-colors hover:text-white md:inline">Contact Us</a>
          <a href="#about" className="transition-colors hover:text-white">Services</a>
        </nav>

        <div className="flex items-center gap-4 text-[13px] text-white/50">

          <a
            href="#connectus"
            className="relative flex items-center gap-1 overflow-hidden rounded-full px-2.5 py-1.5 text-[11px] text-white/90 md:gap-1.5 md:px-4 md:py-2 md:text-[13px]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
              backgroundSize: "200% 100%",
              animation: "sheen 3.5s linear infinite",
            }}
          >
            Contact Us
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 17L17 7M17 7H9M17 7V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </header>

      {/* content */}
      <div
        className="relative flex flex-1 flex-col items-center justify-center px-6 text-center"
        style={{ zIndex: 20 }}
      >
        <div
          className="hero-tagline mb-0 flex items-center gap-0 text-white"
          style={{ fontFamily: "Hatolie, sans-serif", fontSize: "clamp(28px, 2.7vw, 40px)", textShadow: "0 2px 18px rgba(0,0,0,0.85)", transform: "translateY(-150px)" }}
        >
          <Image
            src="/logo.png"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="hero-tagline-icon"
            style={{ width: "1em", height: "1em", objectFit: "contain", position: "relative", top: "-4px" }}
          />
          <FadeText text="Insight. Aesthetics. Innovation." delay={1750} shine />
        </div>


        <p
          className="hero-slogan relative top-[50px] mt-0 font-medium tracking-[0.12em] text-white"
          style={{ fontFamily: "'Staravenue', sans-serif", fontSize: "clamp(20px, 2vw, 30px)", letterSpacing: "0.02em", textShadow: "0 2px 18px rgba(0,0,0,0.9)" }}
        >
          <FadeText text="STOP BEING FORGETTABLE · START BEING ICONIC." delay={2200} shine />
        </p>

        <p
          className="hero-subtitle relative top-[50px] mt-3 max-w-2xl text-white/65"
          style={{ fontFamily: "'Staravenue', sans-serif", fontSize: "clamp(16px, 1.25vw, 20px)", letterSpacing: "0.02em", textShadow: "0 2px 18px rgba(0,0,0,0.9)" }}
        >
          <FadeText text="Turning Your Ideas Into a Distinct Digital Identity" delay={2650} shine />
        </p>

        <a
          href="#projects"
          className="hero-cta-button relative top-[50px] mt-8 flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-medium text-white"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #f5b470, #d98a3f, #f5b470, #d98a3f)",
            backgroundSize: "300% 100%",
            animation: "sheen 4s linear infinite, hero-fade-pull-in 0.55s cubic-bezier(0.2, 0.75, 0.25, 1) 3.2s both",
            boxShadow: "0 0 40px rgba(245,180,112,0.45)",
          }}
        >
          <FadeText text="Explore our projects" delay={3200} />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 17L17 7M17 7H9M17 7V15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      <style>{`
        .hero-basic-fade {
          display: inline-block;
          animation: hero-basic-fade-in 0.7s ease both;
        }
        .hero-tagline-icon {
          animation: hero-fade-pull-in 0.55s cubic-bezier(0.2, 0.75, 0.25, 1) 2.646s both;
        }
        @keyframes hero-fade-pull-in {
          from { opacity: 0; transform: translateY(10px) scale(0.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hero-basic-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes hero-rise {
          from { transform: translateY(100vh); }
          to { transform: translateY(0); }
        }
        @keyframes hero-sphere-rise {
          from { translate: 0 100vh; }
          to { translate: 0 0; }
        }
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-wordmark-rise {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-planet-wrapper, .hero-asteroid-field, .hero-wordmark, .hero-navbar { animation: none !important; }
          .hero-basic-fade { animation: none; opacity: 1; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes sheen {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </section>
  );
}



