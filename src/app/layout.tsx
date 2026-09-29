import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/ui/LenisProvider";
import TransitionProvider from "@/components/ui/TransitionProvider";
import Navbar from "@/components/ui/Navbar";
import Analytics from "@/components/ui/Analytics";
import GlobalPreloader from "@/components/ui/GlobalPreloader";
import AnimationGovernor from "@/components/ui/AnimationGovernor";

const BASE_URL = "https://ahmadbarkat.dev";

// The site's type: Geist for text and headings, Geist Mono for labels and
// numbers. Self-hosted by next/font, exposed as --font-sans / --font-mono.
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AHMAD Barkat | Software Engineer & UI Architect",
    template: "%s | AHMAD Barkat",
  },
  description:
    "Portfolio of AHMAD Barkat — a Software Engineer specialising in interactive web experiences, creative UI architecture, and high-performance applications.",
  keywords: [
    "AHMAD Barkat",
    "Software Engineer",
    "Frontend Developer",
    "UI Architect",
    "Next.js Portfolio",
    "React Developer",
    "Interactive Web Design",
    "GSAP Animations",
    "Pakistan Developer",
  ],
  authors: [{ name: "AHMAD Barkat", url: BASE_URL }],
  creator: "AHMAD Barkat",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "AHMAD Barkat Portfolio",
    title: "AHMAD Barkat | Software Engineer & UI Architect",
    description:
      "Explore the portfolio of AHMAD Barkat — creative software engineering, interactive experiences, and premium digital craftsmanship.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AHMAD Barkat Portfolio — Software Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AHMAD Barkat | Software Engineer",
    description: "Software Engineer & UI Architect building interactive web experiences.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${sans.variable} ${mono.variable}`}>
      <body
        suppressHydrationWarning
        className="font-sans"
        style={{ margin: 0, padding: 0 }}
      >
        <LenisProvider>
          <TransitionProvider>
            <Analytics />
            <AnimationGovernor />
            <GlobalPreloader />
            <Navbar />
            {children}
          </TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
