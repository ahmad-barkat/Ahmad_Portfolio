import type { Metadata } from "next";
import "./globals.css";
import LenisProvider from "@/components/ui/LenisProvider";
import TransitionProvider from "@/components/ui/TransitionProvider";
import HamburgerMenu from "@/components/ui/HamburgerMenu";
import Analytics from "@/components/ui/Analytics";

const BASE_URL = "https://ahmadbarkat.dev";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Muhammad Ahmad Barkat | Software Engineer & UI Architect",
    template: "%s | Ahmad Barkat",
  },
  description:
    "Portfolio of Muhammad Ahmad Barkat — a Software Engineer specialising in interactive web experiences, creative UI architecture, and high-performance applications.",
  keywords: [
    "Muhammad Ahmad Barkat",
    "Software Engineer",
    "Frontend Developer",
    "UI Architect",
    "Next.js Portfolio",
    "React Developer",
    "Interactive Web Design",
    "GSAP Animations",
    "Pakistan Developer",
  ],
  authors: [{ name: "Muhammad Ahmad Barkat", url: BASE_URL }],
  creator: "Muhammad Ahmad Barkat",
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
    siteName: "Ahmad Barkat Portfolio",
    title: "Muhammad Ahmad Barkat | Software Engineer & UI Architect",
    description:
      "Explore the portfolio of Ahmad Barkat — creative software engineering, interactive experiences, and premium digital craftsmanship.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ahmad Barkat Portfolio — Software Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muhammad Ahmad Barkat | Software Engineer",
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
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="font-sans"
        style={{ margin: 0, padding: 0, backgroundColor: "#081C15" }}
      >
        <LenisProvider>
          <TransitionProvider>
            <Analytics />
            <HamburgerMenu />
            {children}
          </TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
