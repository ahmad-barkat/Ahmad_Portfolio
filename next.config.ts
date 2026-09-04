import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  ...(process.env.NODE_ENV === "production"
    ? { generateBuildId: async () => "portfolio-build" }
    : {}),

  // lenis, gsap, and @gsap/react ESM packages transpilation
  transpilePackages: ["lenis", "@gsap/react", "gsap"],

  async headers() {
    return [
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
