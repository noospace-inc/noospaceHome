import Image from "next/image";
import Link from "next/link";

const groups = [
  {
    title: "Quick links",
    links: [
      { label: "Home", href: "/#home" },
      { label: "Services", href: "/#services" },
      { label: "Projects", href: "/#projects" },
      { label: "Contact", href: "/#contact" },
      { label: "Our process", href: "/#our-steps" },
      { label: "About us", href: "/#about" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Services", href: "/#services" },
      { label: "Our work", href: "/#projects" },
      { label: "Contact us", href: "/#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms and conditions", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Cookie policy", href: "/cookies" },
      { label: "Cancellation policy", href: "/cancellations" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#050607] px-6 pb-6 pt-14 text-white sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-[1.5fr_2fr]">
          <div className="max-w-sm">
            <Link href="/#home" className="inline-flex items-center gap-3" aria-label="Noo Space home">
              <Image src="/logo.png" alt="" width={42} height={42} className="size-10 object-contain" />
              <span className="font-nasalization text-xl tracking-wide">NOO SPACE</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/55" style={{ fontFamily: "'Staravenue', sans-serif", letterSpacing: "0.02em" }}>
              Insight. Aesthetics. Innovation. We shape ideas into distinctive digital experiences.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {groups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/80" style={{ fontFamily: "'Staravenue', sans-serif" }}>{group.title}</h2>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link className="text-sm text-white/50 transition-colors hover:text-white" href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <div>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/80" style={{ fontFamily: "'Staravenue', sans-serif" }}>Contact</h2>
              <ul className="space-y-3 text-sm">
                <li><a className="text-white/50 transition-colors hover:text-white" href="https://www.instagram.com/noospace.in/" target="_blank" rel="noreferrer">Instagram</a></li>
                <li><a className="break-all text-white/50 transition-colors hover:text-white" href="mailto:noospace.in@gmail.com">noospace.in@gmail.com</a></li>
                <li><a className="text-white/50 transition-colors hover:text-white" href="tel:+918300249089">+91 83002 49089</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© Noospace</span>
          <span>Made for ideas with a little more space.</span>
        </div>
        <div aria-hidden="true" className="select-none whitespace-nowrap overflow-hidden bg-gradient-to-r from-[#35205f] via-[#b497ff] to-[#35205f] bg-clip-text text-center font-nasalization text-[clamp(3rem,13vw,11rem)] font-bold leading-[0.78] tracking-[-0.07em] text-transparent">
          NOO SPACE
        </div>
      </div>
    </footer>
  );
}
