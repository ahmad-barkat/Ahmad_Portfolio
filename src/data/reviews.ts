/**
 * Client reviews, shared by the Reviews section and the hero.
 */
export interface Review {
  quote: string;
  name: string;
  role: string;
  initials: string;
  rating: number;
  /**
   * The client's picture in /public, e.g. "/reviews/sarah.webp". For a real
   * review use the person's own photo, with their permission. The samples
   * use stock portraits (/public/reviews/*.webp), not real clients. Without one, the initials are shown instead.
   */
  photo?: string;
  /** Phrases from `quote` the hero lights up as the quote is read */
  highlight?: string[];
  /**
   * The hero's hover face: the same review told in shinobi terms. Wrap the
   * words to glow in *asterisks*. Optional; a stock line is used without it.
   */
  genjutsu?: string;
  /** Placeholder copy. Samples render in development only and never ship. */
  sample?: boolean;
}

// SAMPLE reviews — replace with real ones (and drop `sample`) before launch.
// Production builds leave samples out, and hide the section if none are left.
export const REVIEWS: Review[] = [
  {
    quote: "We came to Ahmad with a Notion doc and a lot of hand-waving. Three weeks later we had a site that actually sounds like us. The animations are subtle, which I didn't expect to love as much as I do.",
    name: "Sarah M.",
    role: "Founder, SaaS startup",
    initials: "SM",
    photo: "/reviews/founder.webp",
    rating: 5,
    highlight: ["actually sounds like us", "Three weeks later"],
    genjutsu: "Read our messy scroll with the *Sharingan*, and in three weeks forged a site worthy of the *Hokage*. Subtle, like a silent *Rasengan*.",
    sample: true,
  },
  {
    quote: "Honestly, the best part was the weekly preview link. I never had to chase him for an update, and launch day was boring in the best way. His handover docs are better than our own.",
    name: "Daniel R.",
    role: "Product lead, fintech platform",
    initials: "DR",
    photo: "/reviews/product-lead.webp",
    rating: 5,
    highlight: ["weekly preview link", "boring in the best way"],
    genjutsu: "Reported back like a true *ANBU*: every week, no *genjutsu*, zero surprises. The whole *scroll* was sealed and handed over.",
    sample: true,
  },
  {
    quote: "Our product pages were slow and we knew it. He took Lighthouse from the 50s into the 90s, and conversions went up the month after. He notices things nobody on our team would.",
    name: "Lina H.",
    role: "Marketing director, e-commerce brand",
    initials: "LH",
    photo: "/reviews/marketing-director.webp",
    rating: 5,
    highlight: ["from the 50s into the 90s", "conversions went up"],
    genjutsu: "Unleashed the chakra of a *Tailed Beast* on our load times, from the 50s into the 90s. He sees what only a *Byakugan* would catch.",
    sample: true,
  },
  {
    quote: "I was sure the 3D viewer would fall over on older phones. It didn't. People spend about twice as long on that page now, and our clients keep asking who built it.",
    name: "Noor A.",
    role: "Creative director, design studio",
    initials: "NA",
    photo: "/reviews/creative-director.webp",
    rating: 5,
    highlight: ["twice as long", "It didn't."],
    genjutsu: "Summoned a 3D viewer with *Kamui*-level smoothness. Visitors stay trapped in the *Tsukuyomi* twice as long.",
    sample: true,
  },
  {
    quote: "He asked more about our business in the first call than most agencies do in a month. When he disagreed with the plan he said so, with reasons, and he was usually right.",
    name: "Omar K.",
    role: "CTO, logistics company",
    initials: "OK",
    photo: "/reviews/cto.webp",
    rating: 5,
    highlight: ["usually right", "first call"],
    genjutsu: "Read the mission before drawing a single *kunai*. Challenged the plan like a *Kage*, and was right every time.",
    sample: true,
  },
  {
    quote: "We handed over the Figma file and got back exactly what we designed, down to the spacing. The component library he set up still saves us hours every week.",
    name: "Mei T.",
    role: "Design lead, agency partner",
    initials: "MT",
    photo: "/reviews/design-lead.webp",
    rating: 5,
    highlight: ["exactly what we designed", "saves us hours"],
    genjutsu: "Figma to production with a perfect *Transformation Jutsu*. His design system works like a squad of *Shadow Clones*.",
    sample: true,
  },
  {
    quote: "On time, on budget, and not a single outage since we launched in the spring. We've already booked him for phase two.",
    name: "Marcus L.",
    role: "Operations manager, healthcare provider",
    initials: "ML",
    photo: "/reviews/operations-manager.webp",
    rating: 5,
    highlight: ["not a single outage", "phase two"],
    genjutsu: "On time, on budget, and guarded by a *Susanoo*: not one outage since spring. Already booked for the next *mission*.",
    sample: true,
  },
  {
    quote: "It's rare to find someone who can design it and actually build it. The scroll story he made for our launch is still what people bring up when they message us.",
    name: "Carlos D.",
    role: "Co-founder, consumer app",
    initials: "CD",
    photo: "/reviews/co-founder.webp",
    rating: 5,
    highlight: ["actually build it", "scroll story"],
    genjutsu: "A rare *kekkei genkai*: engineer and designer in one. His scroll story burns like *Amaterasu*, people still talk about it.",
    sample: true,
  },
];

/** What actually renders: production builds leave samples out. */
export const PUBLISHED_REVIEWS = REVIEWS.filter(
  (r) => process.env.NODE_ENV !== "production" || !r.sample,
);
