import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import IntroLoadingScreen from "./components/intro-loading-screen";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://noospace.in"),
  title: "Noospace | Custom Software Development Services",
  description: "Noospace builds unique, secure and efficient custom software for businesses. Explore our services, see our projects, and contact us today.",
  alternates: { canonical: "/" },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Noospace | Custom Software Development Services",
    description: "Noospace builds unique, secure and efficient custom software for businesses. Explore our services, see our projects, and contact us today.",
    url: "https://noospace.in/",
    siteName: "Noospace",
    type: "website",
    images: [{ url: "/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noospace | Custom Software Development Services",
    description: "Noospace builds unique, secure and efficient custom software for businesses. Explore our services, see our projects, and contact us today.",
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Noospace",
      url: "https://noospace.in",
      logo: "https://noospace.in/logo.png",
      description: "Noospace builds unique, secure and efficient custom software for businesses.",
    },
    { "@type": "WebSite", name: "Noospace", url: "https://noospace.in" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-intro-pending="true"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <IntroLoadingScreen />
        {children}
      </body>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-EF93C9BLY1"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];\nfunction gtag(){window.dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-EF93C9BLY1');`}
      </Script>
    </html>
  );
}
