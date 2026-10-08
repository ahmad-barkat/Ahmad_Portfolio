import { MetadataRoute } from "next";

/** Search engines and AI assistants are all welcome: hiring managers and
 *  their AI tools should be able to find and cite the site. */
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot",
  "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://ahmadbarkat.dev";

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/dev/"] },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
