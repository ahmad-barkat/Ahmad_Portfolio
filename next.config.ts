import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  ...(process.env.NODE_ENV === "production"
    ? { generateBuildId: async () => "portfolio-build" }
    : {}),

  // lenis, gsap, and @gsap/react ESM packages transpilation
  transpilePackages: ["lenis", "@gsap/react", "gsap"],

  experimental: {
    optimizePackageImports: ["lucide-react", "three", "framer-motion"],
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
      {
        source: "/:all*(svg|jpg|png|webp|avif|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/laptop/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
