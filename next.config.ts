import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Content-Security-Policy. Next.js injects inline bootstrap scripts, so
// script-src keeps 'unsafe-inline' (a nonce would force every page dynamic).
// Everything else is locked to this site plus the two services it uses:
// Calendly (booking embed) and Formspree (contact form).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://assets.calendly.com`,
  "style-src 'self' 'unsafe-inline' https://assets.calendly.com",
  "img-src 'self' data: blob: https://*.calendly.com",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://formspree.io https://calendly.com https://*.calendly.com" + (isProd ? "" : " ws: wss:"),
  "frame-src https://calendly.com https://*.calendly.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formspree.io",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  compress: true,
  ...(process.env.NODE_ENV === "production"
    ? { generateBuildId: async () => "portfolio-build" }
    : {}),

  // lenis, gsap, and @gsap/react ESM packages transpilation
  transpilePackages: ["lenis", "@gsap/react", "gsap"],

  experimental: {
    optimizePackageImports: ["lucide-react", "three", "motion"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },

  async redirects() {
    return [
      // The About page became the home page, which now lives at /home
      { source: "/about", destination: "/home", permanent: true },
      // The nav directory is now the site's front door
      { source: "/nav", destination: "/", permanent: true },
    ];
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/:all*(svg|jpg|png|webp|avif|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
