import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/ui/LenisProvider";
import TransitionProvider from "@/components/ui/TransitionProvider";
import Navbar from "@/components/ui/Navbar";
import Analytics from "@/components/ui/Analytics";
import GlobalPreloader from "@/components/ui/GlobalPreloader";
import AnimationGovernor from "@/components/ui/AnimationGovernor";
import MailFab from "@/components/ui/mail-fab";
import { PROFILE, personJsonLd } from "@/data/profile";

const BASE_URL = "https://ahmadbarkat.dev";

// The site's type: Geist for text and headings, Geist Mono for labels and
// numbers. Self-hosted by next/font, exposed as --font-sans / --font-mono.
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const TITLE = "Ahmad Barkat | Full-Stack Developer, open to remote & relocation";
const DESCRIPTION =
  "Ahmad Barkat is a full-stack developer (Next.js, React, TypeScript) open to full-time roles, remote or with visa sponsorship, and freelance projects. See his work, skills and how to reach him.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: TITLE, template: "%s | Ahmad Barkat" },
  description: DESCRIPTION,
  keywords: [
    "Ahmad Barkat",
    "Full-Stack Developer",
    "Next.js Developer",
    "React Developer",
    "TypeScript Developer",
    "Remote Developer",
    "Developer open to relocation",
    "Visa sponsorship",
    "Hire developer from Pakistan",
    "Freelance web developer",
  ],
  authors: [{ name: PROFILE.name, url: BASE_URL }],
  creator: PROFILE.name,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "profile",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Ahmad Barkat",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ahmad Barkat, Full-Stack Developer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()).replace(/</g, "\u003c") }}
        />
        <LenisProvider>
          <TransitionProvider>
            <Analytics />
            <AnimationGovernor />
            <GlobalPreloader />
            <Navbar />
            <MailFab />
            {children}
          </TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
