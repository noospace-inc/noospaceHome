import Link from "next/link";

export type LegalSection = { title: string; body: string };

export default function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <main className="min-h-screen bg-[#050607] px-6 py-20 text-white sm:px-10">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-violet-300 hover:text-violet-200">← Back to Noo Space</Link>
        <p className="mt-12 text-xs uppercase tracking-[0.3em] text-violet-300">Noo Space · Policies</p>
        <h1 className="mt-4 text-4xl sm:text-5xl" style={{ fontFamily: "Hatolie, sans-serif" }}>{title}</h1>
        <p className="mt-6 leading-7 text-white/65">{intro}</p>
        <p className="mt-4 text-xs text-white/40">Last updated: September 29, 2026</p>
        <div className="mt-12 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "Hatolie, sans-serif" }}>{section.title}</h2>
              <p className="mt-3 leading-7 text-white/65">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
