import HeroSection from "./components/hero-section";
import ProjectSection from "./components/project-section";
import OurSteps from "./components/our-steps";
import AboutSection from "./components/about-section";
import ConnectUsSection from "./components/connectus-section";
import SiteFooter from "./components/site-footer";
import FAQSection from "./components/faq-section";
import SectionShineObserver from "./components/section-shine-observer";

const SERVICES = [
  { title: "Custom Web Development", description: "We build distinctive, efficient websites and web applications around the way your business works. Every solution is designed to be secure, reliable, and ready to grow." },
  { title: "Mobile App Development", description: "We create intuitive mobile experiences for your customers and teams. Thoughtful engineering keeps each app efficient, secure, and tailored to your needs." },
  { title: "Secure Backend and API Development", description: "We build dependable backends and APIs that protect your data and connect your systems. Clear architecture keeps your software efficient and easier to extend." },
  { title: "UI/UX Design", description: "We shape clear, accessible interfaces around real user needs. Each experience balances your brand with simple, efficient journeys." },
  { title: "Cloud and DevOps", description: "We help businesses deploy and operate software with confidence. Secure cloud infrastructure and streamlined delivery support dependable growth." },
  { title: "Maintenance and Support", description: "We keep your software secure, current, and performing well. Ongoing improvements help your tools stay efficient as your business changes." },
];

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <SectionShineObserver />
        <HeroSection />
        <section id="services" aria-labelledby="services-heading" className="bg-black px-6 py-20 text-white sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 id="services-heading" className="text-3xl sm:text-4xl" style={{ fontFamily: "Hatolie, sans-serif" }}>Our Services</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">Unique, secure, and efficient custom software, shaped around your business.</p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((service) => (
                <li key={service.title} className="rounded-2xl border border-violet-300/20 bg-white/[0.035] p-6 shadow-[inset_0_0_28px_rgba(139,92,246,.06)]">
                  <h3 className="text-lg text-white">{service.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{service.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <ProjectSection />
        <OurSteps />
        <AboutSection />
        <ConnectUsSection />
        <FAQSection />
        <section id="contact" aria-labelledby="contact-heading" className="bg-black px-6 py-20 text-white sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl rounded-2xl border border-violet-300/20 bg-white/[0.035] p-8 shadow-[inset_0_0_28px_rgba(139,92,246,.06)] sm:p-10">
            <h2 id="contact-heading" className="text-3xl sm:text-4xl" style={{ fontFamily: "Hatolie, sans-serif" }}>Contact Us</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">Tell us what you are building, and we’ll get back to you.</p>
            {/* TODO: Replace this placeholder with Noospace’s preferred contact email. */}
            <a className="mt-5 inline-flex text-violet-200 underline decoration-violet-200/50 underline-offset-4 hover:text-white" href="mailto:hello@example.com">hello@example.com</a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
