"use client";

import { useEffect } from "react";

export default function SectionShineObserver() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-section-shine]"));
    const heroElements = elements.filter((element) => element.closest('[aria-label="Hero section"]'));
    const scrollElements = elements.filter((element) => !element.closest('[aria-label="Hero section"]'));
    let heroObserver: IntersectionObserver | null = null;

    // Keep the hero's existing entrance animation. All other marked headings
    // and taglines follow scroll position in both directions.
    if (heroElements.length && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("section-shine-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.2 });
      heroObserver = observer;
      heroElements.forEach((element) => observer.observe(element));
    } else {
      heroElements.forEach((element) => element.classList.add("section-shine-visible"));
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      scrollElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const availableTravel = Math.max(1, viewportHeight - Math.min(rect.height, viewportHeight - 1));
        const progress = Math.max(0, Math.min(1, (viewportHeight - rect.bottom) / availableTravel));
        element.style.setProperty("--scroll-reveal-progress", progress.toFixed(3));
        element.style.setProperty("--scroll-shine-position", `${100 - progress * 100}%`);
        element.style.setProperty("--scroll-reveal-offset", `${(1 - progress) * 14}px`);
        element.classList.add("scroll-linked-reveal");
      });
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    document.addEventListener("scroll", scheduleUpdate, { passive: true, capture: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      heroObserver?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      document.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return null;
}
