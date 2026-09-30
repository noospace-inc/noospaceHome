"use client";

import { useEffect, useRef, useState } from "react";

const FAQS = [
  {
    question: "I'm new to all this. Can you guide me from start to finish?",
    answer: "Absolutely! You don't need any technical knowledge. We explain everything in simple words and handle the work for you.",
  },
  {
    question: "How long will it take to get my website or online store ready?",
    answer: "A basic project, like a simple e-commerce site, takes around 4 weeks. We'll share a clear timeline before we start.",
  },
  {
    question: "What do I need to give you to get started?",
    answer: "Just tell us about your business and share your logo, photos, or product details. We'll take care of the rest.",
  },
  {
    question: "Will I be able to see progress while you work?",
    answer: "Yes! We keep you updated at each step, so there are no surprises when your site is ready.",
  },
  {
    question: "Will my website work well on mobile phones?",
    answer: "Definitely. Every site we build looks great and works smoothly on phones, tablets, and computers.",
  },
  {
    question: "Can I manage my products and content myself?",
    answer: "Yes. We build it so you can easily add products, change prices, and update content without needing a developer.",
  },
  {
    question: "How will this help me get more customers?",
    answer: "Your website is built to be easy to find and easy to use, with SEO and marketing options available. More visitors can find you, trust you, and buy from you.",
  },
  {
    question: "What happens if something goes wrong after my site goes live?",
    answer: "Don't worry, you're covered! Every project comes with 1 year of free maintenance, so we'll fix issues and keep things running smoothly.",
  },
  {
    question: "Can I make changes after my website is launched?",
    answer: "Yes, limited changes are included after deployment. We review everything with you before launch so your site is just how you want it.",
  },
  {
    question: "Does the price include hosting and domain?",
    answer: "Our invoice covers only our service charges. Hosting and domain are paid separately to the providers, and we'll help you choose the right ones.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rows = faqListRef.current?.querySelectorAll<HTMLElement>(".faq-row");
    if (!rows?.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        const elementHeight = Math.min(rect.height, viewportHeight);
        const endTop = viewportHeight - elementHeight;
        const startTop = viewportHeight;
        const progress = Math.max(0, Math.min(1, (startTop - rect.top) / (startTop - endTop)));
        row.style.opacity = progress.toFixed(3);
        row.style.transform = `translateY(${((1 - progress) * 24).toFixed(1)}px)`;
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

  return (
    <section id="faq" aria-labelledby="faq-heading" className="relative isolate overflow-hidden bg-black px-5 py-20 text-white sm:px-8 sm:py-28">
      <div aria-hidden="true" className="faq-violet-glow pointer-events-none absolute -right-40 top-[12%] h-[640px] w-[640px] rounded-full opacity-80 blur-[90px]" />
      <div aria-hidden="true" className="faq-magenta-glow pointer-events-none absolute -bottom-64 -left-40 h-[560px] w-[560px] rounded-full opacity-60 blur-[105px]" />
      <div className="relative mx-auto max-w-[900px]">
        <header className="mb-10 text-center sm:mb-14">
          <h2 data-section-shine id="faq-heading" className="text-3xl leading-tight text-white sm:text-4xl" style={{ fontFamily: "Hatolie, sans-serif" }}>
            Got Questions? We&apos;ve Got Answers
          </h2>
          <p data-section-shine className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>
            Clear, honest answers to what most clients ask before getting started.
          </p>
        </header>

        <div ref={faqListRef} className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025] px-5 shadow-[0_24px_90px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-xl sm:px-9">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}`;
            return (
              <div key={faq.question} className="faq-row border-b border-white/[0.12] last:border-b-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-5 py-5 text-left sm:py-6"
                >
                  <span className="text-sm leading-relaxed text-white/90 sm:text-base" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>{faq.question}</span>
                  <span aria-hidden="true" className={`shrink-0 text-2xl font-light leading-none text-violet-200 transition-transform duration-300 ${isOpen ? "rotate-45" : "rotate-0"}`}>+</span>
                </button>
                <div id={answerId} hidden={!isOpen}>
                  <p className="max-w-[760px] pb-5 pr-8 text-sm leading-7 text-white/55 sm:pb-6" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .faq-row {
          opacity: 0;
          transform: translateY(24px);
          will-change: opacity, transform;
        }
        .faq-violet-glow {
          background: radial-gradient(circle, rgba(168, 85, 247, .82) 0%, rgba(126, 34, 206, .56) 28%, rgba(76, 29, 149, .28) 52%, rgba(0, 0, 0, 0) 73%);
          animation: faq-glow-drift 12s ease-in-out infinite alternate;
        }
        .faq-magenta-glow {
          background: radial-gradient(circle, rgba(124, 58, 237, .58) 0%, rgba(88, 28, 135, .32) 40%, rgba(0, 0, 0, 0) 72%);
          animation: faq-magenta-drift 15s ease-in-out infinite alternate;
        }
        @keyframes faq-glow-drift {
          from { transform: translate3d(0, -5%, 0) scale(.9); }
          to { transform: translate3d(-20%, 8%, 0) scale(1.12); }
        }
        @keyframes faq-magenta-drift {
          from { transform: translate3d(0, 0, 0) scale(.88); }
          to { transform: translate3d(16%, -12%, 0) scale(1.12); }
        }
        @media (prefers-reduced-motion: reduce) {
          .faq-violet-glow, .faq-magenta-glow { animation: none; }
          .faq-row { transform: none; }
        }
      `}</style>
    </section>
  );
}
