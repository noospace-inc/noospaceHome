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
  title: "Noospace",
  description: "Noospace digital solutions.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-intro-pending="true"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
