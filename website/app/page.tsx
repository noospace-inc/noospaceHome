import HeroSection from "./components/hero-section";
import ProjectSection from "./components/project-section";
import OurSteps from "./components/our-steps";
import AboutSection from "./components/about-section";
import ConnectUsSection from "./components/connectus-section";
import SiteFooter from "./components/site-footer";
import FAQSection from "./components/faq-section";
import SectionShineObserver from "./components/section-shine-observer";

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <SectionShineObserver />
        <HeroSection />
        <ProjectSection />
        <OurSteps />
        <AboutSection />
        <ConnectUsSection />
        <FAQSection />
      </main>
      <SiteFooter />
    </>
  );
}