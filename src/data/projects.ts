/**
 * Every project on the site, in the order they are shown.
 *
 * TEMPORARY: the titles and screenshots are real, but the roles, stacks and
 * summaries were written from the screenshots alone. Every project was built
 * between Feb and Aug 2026 (dates per project in project-details.ts). Confirm or
 * replace each one, and add `href` for every project that has a live site.
 */
export interface Project {
  slug: string;
  title: string;
  kind: string;
  year: string;
  role: string;
  stack: string[];
  summary: string;
  /** Screenshot in /public, about 2:1 (the page crops it to fit) */
  cover: string;
  /** More screenshots, shown after the cover in the project page's gallery. Leave out if there is only the cover. */
  gallery?: { src: string; caption: string }[];
  /** Live URL. Without one the page shows no "visit" link. */
  href?: string;
  /** Colour of the cursor pill over this project's card on the home page */
  accent: string;
  /** The case study, shown on the project's own page */
  caseStudy: CaseStudy;
}

export interface CaseStudy {
  client: string;
  /** What was asked for, and why */
  brief: string;
  /** What was built, one line each */
  built: string[];
  /** Outcomes; `value` counts up, so keep it numeric */
  results: { value: number; prefix?: string; suffix?: string; label: string }[];
}

export const PROJECTS: Project[] = [
  {
    slug: "ard-al-khair",
    accent: "#3BA7F2",
    title: "Ard Al Khair Properties",
    kind: "Real estate · Full-stack platform",
    year: "2026",
    role: "Full-stack development",
    stack: ["Next.js", "Node.js", "REST APIs", "Tailwind"],
    summary:
      "A property platform for a Dubai developer: listings that sell the skyline, and a custom dashboard behind them for syndication, secure sign-in and analytics across large portfolios.",
    cover: "/projects/ard-al-khair.webp",
    gallery: [
      { src: "/projects/ard-al-khair-listing.webp", caption: "A property page" },
      { src: "/projects/ard-al-khair-reviews.webp", caption: "Why invest, and what clients say" },
      { src: "/projects/ard-al-khair-contact.webp", caption: "The enquiry form" },
      { src: "/projects/ard-al-khair-blogs.webp", caption: "Blogs" },
    ],
    // DUMMY case study: replace with the real story and numbers
    caseStudy: {
      client: "Ard Al Khair Real Estate, Dubai",
      brief:
        "The developer sold premium residences off-plan, but its listings lived in spreadsheets and PDFs. Buyers couldn't browse, agents couldn't update, and every enquiry fell into one shared inbox.",
      built: [
        "A listings site that leads with the skyline and loads fast on a phone",
        "A custom dashboard where agents publish, price and syndicate properties",
        "Secure sign-in with roles for admins, agents and partners",
        "Analytics on views and enquiries for every property",
      ],
      results: [
        { value: 62, suffix: "%", label: "faster first load" },
        { value: 2.8, suffix: "×", label: "enquiries per listing" },
        { value: 43, label: "properties managed" },
      ],
    },
  },
  {
    slug: "amethyst-developers",
    accent: "#8B7CF6",
    title: "Amethyst Developers",
    kind: "Agency · Web, mobile & AI",
    year: "2026",
    role: "Design & front-end development",
    stack: ["Next.js", "Three.js", "GSAP", "Tailwind"],
    summary:
      "A dark, premium site for a web, mobile and AI agency: a 3D robot on the first screen, a scrolling services deck, an interactive delivery pipeline and plain-spoken pricing.",
    cover: "/projects/amethyst-developers.webp",
    gallery: [
      { src: "/projects/amethyst-services.webp", caption: "The services deck" },
      { src: "/projects/amethyst-pipeline.webp", caption: "The delivery pipeline" },
      { src: "/projects/amethyst-pricing.webp", caption: "Pricing, in plain numbers" },
      { src: "/projects/amethyst-project.webp", caption: "A project page" },
    ],
    // DUMMY case study: replace with the real story and numbers
    caseStudy: {
      client: "Amethyst Developers",
      brief:
        "An agency selling custom software and AI work needed a site that looked as senior as its engineers, and explained what it does, how it delivers and what it costs without a sales call.",
      built: [
        "A 3D robot hero with the agency's headline, proof figures and two clear actions",
        "A services deck that turns through six disciplines, each with its tools",
        "An interactive delivery pipeline, from planning to release",
        "Three transparent pricing plans with what each one includes",
      ],
      results: [
        { value: 1.9, suffix: "×", label: "quote requests" },
        { value: 48, suffix: "%", label: "more time on the services deck" },
        { value: 1.4, suffix: "s", label: "largest contentful paint" },
      ],
    },
  },
  {
    slug: "story-portfolio",
    accent: "#7FE7D6",
    title: "Interactive Story Portfolio",
    kind: "Portfolio · Web experience",
    year: "2026",
    role: "Design & development",
    stack: ["Next.js", "GSAP", "Three.js", "Lenis"],
    summary:
      "The site you are on: a liquid-mask hero, 3D scenes and page transitions that stitch every section into one piece told through scroll.",
    cover: "/projects/story-portfolio-v2.webp",
    // DUMMY case study: replace with the real story and numbers
    caseStudy: {
      client: "Personal project",
      brief:
        "A portfolio that reads like every other one gets skimmed. The aim was a site people remember and talk about, without giving up speed or accessibility to get there.",
      built: [
        "A story told through scroll, on GSAP timelines and Lenis smooth scrolling",
        "Three.js scenes: the liquid portrait, the football tech stack, this projects world",
        "One button style, one link style and a strict palette on every page",
        "Reduced-motion versions, and animation that pauses off screen",
      ],
      results: [
        { value: 94, label: "Lighthouse performance" },
        { value: 57, suffix: "fps", label: "on a mid-range laptop" },
        { value: 1.3, suffix: "s", label: "largest contentful paint" },
      ],
    },
  },
  {
    slug: "hra-studio",
    accent: "#5FC7E4",
    title: "HRA Studio",
    kind: "Agency · Brand site",
    year: "2026",
    role: "Design & development",
    stack: ["React", "GSAP", "Tailwind"],
    summary:
      "A studio site built around one idea, development that you need, indeed: a smoke-like hero, a calm monochrome palette and a clear route from first look to first call.",
    cover: "/projects/brother-portfolio.webp",
    // DUMMY case study: replace with the real story and numbers
    caseStudy: {
      client: "HRA Studio",
      brief:
        "A new studio needed a site that looked established from its first day, and a clear path that turned a first visit into a first call.",
      built: [
        "A monochrome identity with a single, slow smoke-like motion piece",
        "Service pages that answer the buyer's questions in order",
        "A two-step route from any page to booking a call",
        "A component system the studio can extend without a developer",
      ],
      results: [
        { value: 2.4, suffix: "×", label: "longer average visit" },
        { value: 37, suffix: "%", label: "more contact form starts" },
        { value: 1.2, suffix: "s", label: "largest contentful paint" },
      ],
    },
  },
  {
    slug: "mab-portfolio",
    accent: "#3BA7F2",
    title: "MAB Portfolio",
    kind: "Portfolio · First edition",
    year: "2026",
    role: "Design & development",
    stack: ["JavaScript", "Three.js", "CSS"],
    summary:
      "The first version of my portfolio, fronted by a friendly 3D robot. Where I learned that a personal site should feel like meeting the person.",
    cover: "/projects/ahmad-portfolio.webp",
    // DUMMY case study: replace with the real story and numbers
    caseStudy: {
      client: "Personal project",
      brief:
        "A first portfolio had to do one thing well: make a stranger feel they had met the developer behind it, and send them on to the projects and the CV.",
      built: [
        "A 3D robot mascot that greets visitors and follows the cursor",
        "A hero that says who, what and why in one screen",
        "Two clear routes onward: the projects and the CV",
        "A dark, quiet palette so the robot carries the personality",
      ],
      results: [
        { value: 1.4, suffix: "s", label: "first contentful paint" },
        { value: 2.3, suffix: "×", label: "clicks through to projects" },
        { value: 92, label: "Lighthouse accessibility" },
      ],
    },
  },
  {
    slug: "interactive-cv",
    accent: "#7FE7D6",
    title: "Interactive CV",
    kind: "Résumé · Web app",
    year: "2026",
    role: "Design & development",
    stack: ["HTML", "CSS", "JavaScript"],
    summary:
      "A résumé that behaves like a product: light and dark themes, switchable palettes, project highlights and a one-click PDF that matches the screen.",
    cover: "/projects/ahmad-cv.webp",
    // DUMMY case study: replace with the real story and numbers
    caseStudy: {
      client: "Personal project",
      brief:
        "A PDF résumé can't show how someone builds. The aim was a CV that is itself a small product: readable in seconds, themeable, and still one click from a clean PDF.",
      built: [
        "Light and dark themes with switchable colour palettes",
        "Project highlights laid out as cards, with the stack on each",
        "A print stylesheet so the PDF matches what is on screen",
        "Plain HTML, CSS and JavaScript, with no build step",
      ],
      results: [
        { value: 14, suffix: "KB", label: "of JavaScript in total" },
        { value: 96, label: "Lighthouse best practices" },
        { value: 1, label: "click to a matching PDF" },
      ],
    },
  },
];

/** The project's own page */
export const projectPath = (slug: string) => `/projects/${slug}`;
