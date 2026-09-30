"use client";

import { useEffect, useState } from "react";

const STARS = Array.from({ length: 110 }, (_, index) => {
  // A repeatable distribution keeps the server and client markup identical.
  const seed = index + 1;
  return {
    left: `${(seed * 47.173) % 100}%`,
    top: `${(seed * 71.319) % 100}%`,
    size: `${seed % 13 === 0 ? 2 : 1}px`,
    delay: `${((seed * 19) % 50) / 10}s`,
    duration: `${2.2 + ((seed * 7) % 30) / 10}s`,
  };
});

export default function IntroLoadingScreen() {
  const [revealing, setRevealing] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const revealDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 600 : 1400;
    const revealTimer = window.setTimeout(() => setRevealing(true), 3000);
    const releaseHeroTimer = window.setTimeout(() => {
      document.documentElement.removeAttribute("data-intro-pending");
    }, 3000 + revealDuration + 50);
    const removeTimer = window.setTimeout(() => setVisible(false), 3000 + revealDuration + 150);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(releaseHeroTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-label="Loading website"
      role="status"
      className={`intro-screen${revealing ? " intro-screen-revealing" : ""}`}
    >
      <div aria-hidden="true" className="intro-starfield">
        {STARS.map((star, index) => (
          <i
            key={index}
            className={`intro-star${index % 5 === 0 ? " intro-star-twinkle" : ""}`}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>

      <div aria-hidden="true" className="intro-center-star">
        <span className="intro-star-ray intro-star-ray-horizontal" />
        <span className="intro-star-ray intro-star-ray-vertical" />
        <span className="intro-star-core" />
      </div>

      <style jsx>{`
        .intro-screen {
          --intro-radius: 0%;
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #000;
          isolation: isolate;
          -webkit-mask-image: radial-gradient(circle at center, transparent 0, transparent var(--intro-radius), #000 calc(var(--intro-radius) + 1%));
          mask-image: radial-gradient(circle at center, transparent 0, transparent var(--intro-radius), #000 calc(var(--intro-radius) + 1%));
          pointer-events: auto;
        }
        .intro-screen-revealing {
          animation: intro-center-reveal 1.4s cubic-bezier(.72, 0, .2, 1) forwards;
        }
        .intro-starfield {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(1px 1px at 12% 21%, rgba(199, 190, 255, .78) 98%, transparent),
            radial-gradient(1px 1px at 73% 12%, rgba(255, 255, 255, .8) 98%, transparent),
            radial-gradient(1px 1px at 86% 67%, rgba(171, 155, 255, .7) 98%, transparent),
            radial-gradient(1px 1px at 31% 78%, rgba(255, 255, 255, .72) 98%, transparent),
            radial-gradient(1px 1px at 55% 36%, rgba(182, 165, 255, .72) 98%, transparent);
          opacity: .8;
        }
        .intro-star {
          position: absolute;
          border-radius: 50%;
          background: #e6e2ff;
          opacity: .58;
          box-shadow: 0 0 5px rgba(174, 154, 255, .55);
        }
        .intro-star-twinkle {
          animation-name: intro-twinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .intro-center-star {
          position: relative;
          display: grid;
          width: 84px;
          height: 84px;
          place-items: center;
          animation: intro-star-glow 1.7s ease-in-out infinite;
        }
        .intro-star-core {
          z-index: 1;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 12px 5px rgba(255,255,255,.95), 0 0 34px 16px rgba(203,190,255,.85), 0 0 90px 42px rgba(130,91,255,.5);
        }
        .intro-star-ray {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.92), transparent);
          filter: blur(1px);
        }
        .intro-star-ray-horizontal { width: 84px; height: 2px; }
        .intro-star-ray-vertical { width: 2px; height: 84px; background: linear-gradient(180deg, transparent, rgba(255,255,255,.92), transparent); }
        @keyframes intro-star-glow {
          0%, 100% { transform: scale(.78); filter: brightness(.8); }
          50% { transform: scale(1.2); filter: brightness(1.45); }
        }
        @keyframes intro-twinkle {
          0%, 100% { opacity: .2; transform: scale(.7); }
          50% { opacity: .95; transform: scale(1.35); }
        }
        @keyframes intro-center-reveal {
          from { --intro-radius: 0%; }
          to { --intro-radius: 160%; }
        }
        @property --intro-radius {
          syntax: "<percentage>";
          inherits: false;
          initial-value: 0%;
        }
        @media (prefers-reduced-motion: reduce) {
          .intro-star-twinkle, .intro-center-star { animation-duration: 4s; }
          .intro-screen-revealing { animation-duration: .6s; }
        }
      `}</style>
    </div>
  );
}
