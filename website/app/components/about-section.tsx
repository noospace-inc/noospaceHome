"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import AstronautReveal from "./astronaut-reveal";
import BubbleOrbit from "./bubble-orbit";
import {
  siGooglesearchconsole, siSemrush, siLighthouse, siKotlin, siSwift, siFlutter,
  siCpanel, siCloudflare, siWordpress, siReact, siNodedotjs, siDocker,
  siGoogleads, siMeta, siGoogletagmanager, siMailchimp, siWhatsapp, siZapier,
  siAnthropic, siLangchain, siPython, siSolidity, siEthereum, siPolygon,
  siSelenium, siCypress, type SimpleIcon,
} from "simple-icons";

const ASTRONAUT_SRC = "/projectsecprop2/front.webp";

const SERVICE_ICONS: SimpleIcon[][] = [
  [siReact, siNodedotjs, siDocker], [siGoogleads, siMeta, siWordpress],
  [siGooglesearchconsole, siSemrush, siLighthouse], [siKotlin, siSwift, siFlutter],
  [siCpanel, siCloudflare, siWordpress], [siReact, siNodedotjs, siDocker],
  [siGoogleads, siMeta, siGoogletagmanager], [siMailchimp, siWhatsapp, siZapier],
  [siAnthropic, siLangchain, siPython], [siSolidity, siEthereum, siPolygon],
  [siCpanel, siCloudflare, siWordpress], [siCloudflare, siSelenium, siCypress],
];

const SERVICES = [
  { name: "Website Development", tagline: "Your business, open online 24/7.", what: "Building a website for your business.", helps: "Customers can find you and trust you.", example: "A clinic site where patients book appointments." },
  { name: "E-commerce Store Development", tagline: "Sell more, from anywhere.", what: "Creating an online shop with payments.", helps: "You can sell products day and night.", example: "A clothing store taking orders online." },
  { name: "Search Engine Optimization (SEO)", tagline: "Be the first result they see.", what: "Improving your site to rank higher on Google.", helps: "More people find you without paying for ads.", example: "A bakery showing up for ‘cakes near me’." },
  { name: "Mobile App Development", tagline: "Your business in every pocket.", what: "Making apps for Android and iPhone.", helps: "Customers reach you faster and stay connected.", example: "A food delivery app for a local restaurant." },
  { name: "Website Maintenance & Support", tagline: "We keep your website safe and running.", what: "Regular updates, fixes, and security checks.", helps: "Your site stays fast and free from problems.", example: "Fixing a broken checkout page quickly." },
  { name: "SaaS Product Development", tagline: "Turn your idea into a subscription product.", what: "Building online software people pay to use monthly.", helps: "You earn steady income from users.", example: "An online billing tool for small shops." },
  { name: "Digital Marketing", tagline: "Reach the right people, grow faster.", what: "Promoting your business through ads and social media.", helps: "You get more customers and sales.", example: "Instagram ads for a new gym." },
  { name: "Email & WhatsApp Marketing Automation", tagline: "The right message, sent automatically.", what: "Sending emails and WhatsApp messages without manual work.", helps: "You save time and keep customers engaged.", example: "An auto-message reminding customers about their order." },
  { name: "AI Chatbots & Voice Assistants", tagline: "Instant answers, any time of day.", what: "Smart bots that talk to your customers.", helps: "Questions get answered without extra staff.", example: "A chatbot answering store timing and prices." },
  { name: "Blockchain & Web3 Development", tagline: "Secure and transparent digital solutions.", what: "Building apps using blockchain technology.", helps: "Data stays safe and can’t be easily changed.", example: "A digital certificate that can’t be faked." },
  { name: "CRM & Business Software", tagline: "Manage your customers and work in one place.", what: "Custom tools to track customers, sales, and daily tasks.", helps: "Your team stays organized and never misses a lead.", example: "A system that tracks every customer enquiry and follow-up." },
  { name: "Cybersecurity", tagline: "Protect your business from online threats.", what: "Checking and securing your website, apps, and data.", helps: "Hackers and data leaks are stopped before they cause harm.", example: "A security check that finds and fixes weak spots in your site." },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const astronautRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [bubbleTransition, setBubbleTransition] = useState<{ from: number; to: number; direction: "left" | "right" } | null>(null);
  const service = SERVICES[active]!;
  const change = (step: number) => setActive((index) => (index + step + SERVICES.length) % SERVICES.length);
  const swipeServices = (distance: number) => {
    if (Math.abs(distance) <= 40) return;
    const direction = distance > 0 ? "right" : "left";
    const step = direction === "right" ? -1 : 1;
    const next = (active + step + SERVICES.length) % SERVICES.length;
    setBubbleTransition({ from: active, to: next, direction });
    setActive(next);
  };

  useEffect(() => {
    if (!bubbleTransition) return;
    const timeout = window.setTimeout(() => setBubbleTransition(null), 460);
    return () => window.clearTimeout(timeout);
  }, [bubbleTransition]);

  useEffect(() => {
    const section = sectionRef.current;
    const headingParts = Array.from(section?.querySelectorAll<HTMLElement>("[data-about-heading] [data-section-shine]") ?? []);
    const astronaut = section?.querySelector<HTMLElement>(".about-reveal-astronaut");
    const rightPanel = section?.querySelector<HTMLElement>("[data-about-right]");
    const leftItems = Array.from(section?.querySelectorAll<HTMLElement>("[data-about-left] [data-about-reveal-item]") ?? []);
    const orbit = section?.querySelector<HTMLElement>(".about-orbit-reveal");
    if (!section || !astronaut || !rightPanel || !orbit || !headingParts.length) return;

    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visibleProgress = (element: HTMLElement, viewportHeight: number) => {
      const rect = element.getBoundingClientRect();
      const elementHeight = Math.min(rect.height, viewportHeight);
      const endTop = viewportHeight - elementHeight;
      const startTop = viewportHeight;
      return clamp((startTop - rect.top) / (startTop - endTop));
    };
    const applyReveal = (element: HTMLElement, progress: number, offset = 22) => {
      element.style.opacity = progress.toFixed(3);
      element.style.transform = reduceMotion
        ? "none"
        : `translateY(${((1 - progress) * offset).toFixed(1)}px)`;
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const sectionTop = section.getBoundingClientRect().top;
      // Anchor the sequence to the About section itself, so nothing reveals
      // while the section is still below the viewport.
      const sectionProgress = clamp((viewportHeight - sectionTop) / (viewportHeight * 0.9));
      const headingProgress = Math.min(sectionProgress, ...headingParts.map((part) => visibleProgress(part, viewportHeight)));
      const astronautSequence = clamp((sectionProgress - 0.42) / 0.5);
      const astronautProgress = Math.min(visibleProgress(astronaut, viewportHeight), headingProgress, astronautSequence);
      applyReveal(astronaut, astronautProgress);
      applyReveal(orbit, astronautProgress, 12);
      orbit.style.transform = reduceMotion
        ? "none"
        : `translateY(${((1 - astronautProgress) * 12).toFixed(1)}px) scale(${(0.96 + astronautProgress * 0.04).toFixed(3)})`;
      astronaut.style.pointerEvents = astronautProgress > 0.98 ? "auto" : "none";

      const rightProgress = Math.min(visibleProgress(rightPanel, viewportHeight), astronautProgress);
      applyReveal(rightPanel, rightProgress);
      rightPanel.style.pointerEvents = rightProgress > 0.98 ? "auto" : "none";

      leftItems.forEach((item, index) => {
        const rowProgress = visibleProgress(item, viewportHeight);
        const stagger = index * 0.045;
        const staggeredProgress = clamp((rowProgress - stagger) / (1 - stagger));
        const progress = Math.min(staggeredProgress, astronautProgress);
        applyReveal(item, progress);
        item.style.pointerEvents = progress > 0.98 ? "auto" : "none";
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
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      document.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  const renderServiceBubble = (serviceIndex: number, motionClass = "", outgoing = false) => (
    <div key={`${serviceIndex}-${motionClass}`} aria-hidden={outgoing || undefined} role={outgoing ? undefined : "img"} aria-label={outgoing ? undefined : `${SERVICES[serviceIndex]!.name} service bubble`} className={`service-bubble-slide absolute inset-0 flex items-center justify-center ${motionClass}`}>
      <div className="service-glass-bubble flex size-full items-center justify-center rounded-full border border-white/50 shadow-[inset_12px_12px_28px_rgba(255,255,255,.22),inset_-14px_-18px_32px_rgba(86,30,160,.32),0_0_38px_rgba(167,110,255,.3)]">
        <div className="grid grid-cols-2 gap-3">
          {SERVICE_ICONS[serviceIndex]!.map((icon, iconIndex) => (
            <span key={icon.title} style={{ animationDelay: `${iconIndex * 0.45}s` }} className="service-glass-icon grid size-10 place-items-center rounded-lg border border-white/35 bg-white/15 shadow-[inset_0_1px_8px_rgba(255,255,255,.2)] last:col-span-2 last:mx-auto">
              <svg viewBox={`0 0 ${icon.width} ${icon.height}`} className="size-5" aria-hidden="true"><path d={icon.path} fill={`#${icon.hex}`} /></svg>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section ref={sectionRef} id="about" aria-label="About us" className="relative isolate min-h-screen w-full overflow-hidden bg-black px-4 py-12 text-white sm:px-7 lg:min-h-[760px] lg:px-10 lg:py-10">
      <header data-about-heading className="relative z-20 mx-auto mb-8 max-w-4xl text-center lg:mb-6">
        <h1 data-section-shine className="relative -top-3 text-3xl leading-tight text-white sm:text-4xl lg:text-5xl" style={{ fontFamily: "Hatolie, sans-serif" }}>One Team. Every Digital Solution.</h1>
        <p data-section-shine className="relative -top-8 mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>We build, promote, and protect your business online so you can focus on running it.</p>
      </header>
      <div className="relative mx-auto grid min-h-[calc(100vh-11rem)] w-full max-w-[1700px] grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,320px)_minmax(420px,1fr)_minmax(340px,410px)] xl:items-start xl:gap-6">
        <nav aria-label="Services" data-about-controls data-about-left className="order-2 relative z-20 grid grid-cols-2 content-start gap-2 sm:grid-cols-3 xl:order-none xl:-translate-y-14 xl:grid-cols-2 xl:gap-2">
          <div data-about-reveal-item style={{ "--about-reveal-index": 0 } as CSSProperties} className="col-span-2 mb-1 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 shadow-[inset_0_0_28px_rgba(139,92,246,.06)] sm:col-span-3 xl:col-span-2">
            <h2 className="mb-3 text-center text-[10px] uppercase tracking-[.2em] text-violet-200/75" style={{ fontFamily: "'Staravenue', sans-serif" }}>Top 3 services</h2>
            <div className="grid grid-cols-3 items-end gap-2">
              {[10, 1, 2].map((serviceIndex, position) => {
                const item = SERVICES[serviceIndex]!;
                const icon = SERVICE_ICONS[serviceIndex]![0]!;
                const featured = position === 1;
                return (
                  <button key={item.name} type="button" onClick={() => setActive(serviceIndex)} aria-label={item.name}
                    className={`flex min-w-0 flex-col items-center rounded-xl px-1.5 pb-1 pt-2 text-center transition ${featured ? "bg-violet-500/15 shadow-[0_0_22px_rgba(168,85,247,.2)]" : "hover:bg-white/[0.04]"}`}>
                    <span className={`${featured ? "size-12" : "size-10"} mb-2 grid place-items-center rounded-full border border-violet-200/40 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.38),rgba(128,75,194,.24)_40%,rgba(22,13,38,.9)_100%)] shadow-[0_0_18px_rgba(139,92,246,.2)]`}>
                      <svg viewBox={`0 0 ${icon.width} ${icon.height}`} className="size-5" aria-hidden="true"><path d={icon.path} fill={`#${icon.hex}`} /></svg>
                    </span>
                    <span className={`line-clamp-2 text-[9px] leading-tight ${featured ? "text-white" : "text-white/65"}`}>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {SERVICES.map((item, index) => (
            <button key={item.name} type="button" onClick={() => setActive(index)} aria-current={active === index ? "true" : undefined} data-about-reveal-item style={{ "--about-reveal-index": index + 1 } as CSSProperties}
              className={`min-h-[68px] rounded-xl border px-2.5 py-2 text-left text-[12px] leading-snug transition duration-300 sm:px-3 sm:text-[13px] ${active === index ? "border-violet-200/80 bg-violet-500/25 text-white shadow-[0_0_22px_rgba(168,85,247,.25)]" : "border-white/15 bg-white/[0.035] text-white/65 hover:border-violet-300/50 hover:bg-violet-500/10 hover:text-white"}`}>
              {item.name}
            </button>
          ))}
        </nav>

        <div data-about-astronaut className="about-reveal-astronaut order-1 relative flex min-h-[330px] items-center justify-center xl:order-none xl:min-h-[580px] xl:self-center">
          <div ref={astronautRef} className="about-astronaut-float relative z-[2] w-full max-w-[250px] sm:max-w-[300px] xl:max-w-[340px]">
            <AstronautReveal />
          </div>
        </div>

        <div data-about-controls data-about-right className="order-3 relative z-20 grid content-start gap-4 xl:order-none xl:-translate-y-14">
          <div
            data-about-controls
            className="relative flex aspect-square min-h-[340px] touch-pan-y flex-col items-center justify-center overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.035] p-5 shadow-[inset_0_0_40px_rgba(139,92,246,.06)]"
            style={{ touchAction: "pan-y" }}
            onPointerDown={(event) => {
              if (event.pointerType !== "mouse") return;
              swipeStartX.current = event.clientX;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={(event) => {
              if (event.pointerType !== "mouse") return;
              if (swipeStartX.current === null) return;
              const distance = event.clientX - swipeStartX.current;
              swipeStartX.current = null;
              swipeServices(distance);
            }}
            onPointerCancel={(event) => { if (event.pointerType === "mouse") swipeStartX.current = null; }}
            onTouchStart={(event) => { swipeStartX.current = event.changedTouches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => {
              if (swipeStartX.current === null) return;
              const endX = event.changedTouches[0]?.clientX;
              const distance = endX === undefined ? 0 : endX - swipeStartX.current;
              swipeStartX.current = null;
              swipeServices(distance);
            }}
          >
            <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-violet-200/65 sm:hidden" style={{ fontFamily: "'Staravenue', sans-serif" }}>Swipe here →</p>
            <h2 className="mb-4 text-center text-xs uppercase tracking-[0.16em] text-violet-200/80 sm:text-sm" style={{ fontFamily: "'Staravenue', sans-serif" }}>Know more about your niche</h2>
            <div className="flex w-full items-center justify-center">
              <div className="relative size-[min(48vw,220px)] shrink-0 overflow-visible">
                {bubbleTransition && renderServiceBubble(
                  bubbleTransition.from,
                  bubbleTransition.direction === "right" ? "service-bubble-exit-right" : "service-bubble-exit-left",
                  true,
                )}
                {renderServiceBubble(
                  bubbleTransition?.to ?? active,
                  bubbleTransition ? (bubbleTransition.direction === "right" ? "service-bubble-enter-left" : "service-bubble-enter-right") : "",
                )}
              </div>
            </div>
            <h2 className="mt-5 text-center text-sm leading-snug text-white sm:text-base" style={{ fontFamily: "'Staravenue', sans-serif" }}>{service.name}</h2>
            <p className="mt-2 text-center text-xs leading-relaxed text-violet-100/75" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>{service.tagline}</p>
          </div>

          <article aria-live="polite" className="rounded-[28px] border border-violet-300/20 bg-[linear-gradient(145deg,rgba(30,18,48,.82),rgba(8,8,14,.9))] p-5 shadow-[0_18px_60px_rgba(0,0,0,.3)] sm:p-6">
            <dl className="space-y-3 text-xs leading-relaxed sm:text-sm">
              <div><dt className="inline font-semibold text-white">What it is: </dt><dd className="inline text-white/70">{service.what}</dd></div>
              <div><dt className="inline font-semibold text-white">How it helps: </dt><dd className="inline text-white/70">{service.helps}</dd></div>
              <div><dt className="inline font-semibold text-white">Example: </dt><dd className="inline text-white/70">{service.example}</dd></div>
            </dl>
          </article>
        </div>
      </div>

      {/* The service selector and detail panels sit above the existing orbit. */}
      <BubbleOrbit imageSrc={ASTRONAUT_SRC} targetRef={astronautRef} onBubblePop={setActive} revealed />
      <style jsx>{`
        .service-glass-bubble {
          background: radial-gradient(circle at 28% 22%, rgba(255,255,255,.38), rgba(183,145,255,.18) 28%, rgba(63,35,112,.2) 58%, rgba(14,12,26,.75) 100%);
          backdrop-filter: blur(2px);
          animation: service-globe-spin 24s linear infinite;
          transform-style: preserve-3d;
        }
        .service-glass-icon {
          animation: service-icon-float 3.2s ease-in-out infinite;
        }
        .service-bubble-slide { will-change: transform, opacity; }
        .service-bubble-enter-left { animation: service-bubble-from-left 420ms cubic-bezier(.2,.75,.25,1) both; }
        .service-bubble-enter-right { animation: service-bubble-from-right 420ms cubic-bezier(.2,.75,.25,1) both; }
        .service-bubble-exit-left { animation: service-bubble-to-left 420ms cubic-bezier(.2,.75,.25,1) both; }
        .service-bubble-exit-right { animation: service-bubble-to-right 420ms cubic-bezier(.2,.75,.25,1) both; }
        @keyframes service-bubble-from-left {
          from { transform: translateX(-115%) scale(.82); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes service-bubble-from-right {
          from { transform: translateX(115%) scale(.82); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes service-bubble-to-left {
          from { transform: translateX(0) scale(1); opacity: 1; }
          to { transform: translateX(-115%) scale(.82); opacity: 0; }
        }
        @keyframes service-bubble-to-right {
          from { transform: translateX(0) scale(1); opacity: 1; }
          to { transform: translateX(115%) scale(.82); opacity: 0; }
        }
        @keyframes service-globe-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes service-icon-float {
          0%, 100% { translate: 0 2px; }
          50% { translate: 0 -5px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .service-glass-bubble, .service-glass-icon { animation: none; }
        }
      `}</style>
    </section>
  );
}
