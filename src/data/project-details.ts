/**
 * The long read for each project, on /projects/[slug].
 *
 * DUMMY: every number, quote and story here is a placeholder written to show
 * the layout. Figures are kept deliberately uneven (no row of 100s), and the
 * projects are spread over Jan – Aug 2026 by how big each one is. Replace each project's entry with the real figures (and a real
 * client review, with permission) before launch.
 */

/** A figure that counts up; keep `value` numeric */
export interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface ProjectDetail {
  client: string;
  /** e.g. "Apr – May 2026" */
  timeline: string;
  team: string;
  services: string[];
  /** Four headline figures in the hero */
  headline: Stat[];
  /** Lighthouse scores at launch, 0–100 */
  scores: { label: string; value: number }[];
  problem: {
    statement: string;
    /** What it cost them, in numbers */
    pains: (Stat & { text: string })[];
    /** Where visitors were lost before, as a share of those who arrived */
    funnel: { label: string; value: number }[];
  };
  challenge: {
    statement: string;
    /** How hard each part was, 1–5 */
    items: { title: string; text: string; level: number }[];
    constraints: { label: string; value: string }[];
  };
  /** Phases on a week grid; `start` is the week the phase begins (0-based) */
  process: { name: string; start: number; weeks: number; hours: number; summary: string; deliverables: string[] }[];
  results: {
    statement: string;
    kpis: Stat[];
    table: { metric: string; before: number; after: number; unit?: string; lowerIsBetter?: boolean }[];
    /** A figure either side of launch, by month (or by week for recent launches); `launch` is the index of the launch point */
    trend: { label: string; unit?: string; months: string[]; values: number[]; launch: number };
  };
  review: { quote: string; name: string; role: string; initials: string; rating: number };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const PROJECT_DETAILS: Record<string, ProjectDetail> = {
  "ard-al-khair": {
    client: "Ard Al Khair Real Estate, Dubai",
    timeline: "May – Aug 2026",
    team: "Solo developer, with the client's sales team",
    services: ["Full-stack development", "Dashboard", "Performance"],
    headline: [
      { value: 12, suffix: " wks", label: "Brief to launch" },
      { value: 43, label: "Properties managed" },
      { value: 2.8, suffix: "×", label: "Enquiries per listing" },
      { value: 94, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 94 },
      { label: "Accessibility", value: 97 },
      { label: "Best practices", value: 96 },
      { label: "SEO", value: 92 },
    ],
    problem: {
      statement:
        "Premium residences were being sold from spreadsheets and PDFs. Buyers couldn't browse, agents couldn't update a price without a designer, and every enquiry landed in one shared inbox.",
      pains: [
        { value: 5.8, suffix: "s", label: "to first content", text: "The old brochure site loaded a 14 MB hero video on every visit." },
        { value: 72, suffix: "%", label: "left on the first page", text: "Most visitors never saw a single property." },
        { value: 3, suffix: " days", label: "to publish a listing", text: "Every change went through a designer and a PDF export." },
      ],
      funnel: [
        { label: "Arrived", value: 100 },
        { label: "Saw a listing", value: 28 },
        { label: "Opened details", value: 11 },
        { label: "Sent an enquiry", value: 1.4 },
      ],
    },
    challenge: {
      statement:
        "Make a catalogue of 43 off-plan properties feel like a luxury brochure on a phone, while giving a sales team with no technical staff full control of it.",
      items: [
        { title: "Heavy media, fast pages", text: "Renders and drone footage had to stay sharp without slowing the first load.", level: 5 },
        { title: "Roles and security", text: "Admins, agents and partners each see and edit different things.", level: 4 },
        { title: "Syndication", text: "Listings had to publish to two property portals from one form.", level: 4 },
        { title: "Arabic and English", text: "Right-to-left layouts from day one, not bolted on later.", level: 3 },
      ],
      constraints: [
        { label: "Deadline", value: "Live before the autumn sales season" },
        { label: "Content", value: "43 listings migrated from PDFs" },
        { label: "Devices", value: "71% of visitors on phones" },
        { label: "Team", value: "No in-house developer after handover" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 2, hours: 27, summary: "Sales calls, analytics review and a map of every listing field.", deliverables: ["Content model", "Site map", "Roles matrix"] },
      { name: "Design", start: 1, weeks: 3, hours: 64, summary: "Listing pages that lead with the skyline, then the dashboard.", deliverables: ["Wireframes", "UI kit", "Prototype"] },
      { name: "Build", start: 3, weeks: 6, hours: 196, summary: "Next.js front end, Node API, image pipeline and sign-in.", deliverables: ["Listings site", "Dashboard", "Portal sync"] },
      { name: "Test", start: 8, weeks: 3, hours: 47, summary: "Real agents publishing real listings, on real phones.", deliverables: ["Device QA", "Load tests", "Fixes"] },
      { name: "Launch", start: 11, weeks: 1, hours: 18, summary: "Migration, redirects, training and a handover guide.", deliverables: ["Go-live", "Training", "Docs"] },
    ],
    results: {
      statement:
        "Listings now go live in minutes, pages open in about a second on a phone, and the sales team hears from nearly three times as many buyers per property.",
      kpis: [
        { value: 62, suffix: "%", label: "faster first load" },
        { value: 2.8, suffix: "×", label: "enquiries per listing" },
        { value: 14, suffix: " min", label: "to publish a listing" },
      ],
      table: [
        { metric: "Largest contentful paint", before: 5.8, after: 1.3, unit: "s", lowerIsBetter: true },
        { metric: "Bounce rate", before: 72, after: 41, unit: "%", lowerIsBetter: true },
        { metric: "Enquiries per month", before: 34, after: 96 },
        { metric: "Pages per visit", before: 1.6, after: 3.9 },
        { metric: "Enquiry reply time", before: 26, after: 4, unit: "h", lowerIsBetter: true },
      ],
      // Launched mid-August 2026, so weeks, not months (every other week labelled)
      trend: { label: "Enquiries per week", months: ["Jun 15", "", "Jun 29", "", "Jul 13", "", "Jul 27", "", "Aug 10", "", "Aug 24", "", "Sep 7", "", "Sep 21"], values: [8, 7, 9, 8, 6, 9, 8, 7, 11, 17, 21, 19, 24, 23, 26], launch: 8 },
    },
    review: {
      quote:
        "We went from emailing PDFs to a platform our agents actually enjoy using. Buyers find what they want on their phones, and the enquiries tell the story.",
      name: "Sales director",
      role: "Ard Al Khair Real Estate",
      initials: "SD",
      rating: 5,
    },
  },

  "amethyst-developers": {
    client: "Amethyst Developers",
    timeline: "Mar – Apr 2026",
    team: "Solo developer, with the agency's founders",
    services: ["Front-end development", "3D & motion", "Performance"],
    headline: [
      { value: 6, suffix: " wks", label: "Brief to launch" },
      { value: 6, label: "Service lines presented" },
      { value: 1.9, suffix: "×", label: "Quote requests" },
      { value: 91, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 91 },
      { label: "Accessibility", value: 95 },
      { label: "Best practices", value: 93 },
      { label: "SEO", value: 90 },
    ],
    problem: {
      statement:
        "The agency did senior work but its site read like a template. Visitors couldn't tell what it offered, how a project would run or what it would cost, so every lead began with the same three questions.",
      pains: [
        { value: 4.6, suffix: "s", label: "to first content", text: "A heavy template and unoptimised images slowed every first visit." },
        { value: 68, suffix: "%", label: "left before the services", text: "Most visitors never got past the first screen." },
        { value: 11, suffix: " days", label: "from enquiry to proposal", text: "Pricing and process had to be explained from scratch each time." },
      ],
      funnel: [
        { label: "Arrived", value: 100 },
        { label: "Reached services", value: 32 },
        { label: "Viewed pricing", value: 12 },
        { label: "Asked for a quote", value: 1.7 },
      ],
    },
    challenge: {
      statement:
        "Show off a 3D hero and a six-service deck without making the site heavy, and still leave pricing and process as easy to read as a table.",
      items: [
        { title: "A 3D hero that stays light", text: "The robot had to load quickly and never block the headline.", level: 4 },
        { title: "A services deck with depth", text: "Six cards, each with capabilities and tools, that work by scroll and by touch.", level: 4 },
        { title: "An interactive pipeline", text: "Five stages that explain delivery without a wall of text.", level: 3 },
        { title: "Honest pricing", text: "Three plans that are clear about what is and isn't included.", level: 2 },
      ],
      constraints: [
        { label: "Deadline", value: "Live before the agency's spring campaign" },
        { label: "Content", value: "Six service lines, three pricing plans" },
        { label: "Devices", value: "58% of visitors on phones" },
        { label: "Brand", value: "Dark theme with a violet accent" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 1, hours: 12, summary: "Founder interviews and a review of competitor agency sites.", deliverables: ["Content outline", "Site map", "Style direction"] },
      { name: "Design", start: 1, weeks: 2, hours: 38, summary: "The hero, the services deck, the pipeline and the pricing cards.", deliverables: ["Wireframes", "UI kit", "Prototype"] },
      { name: "Build", start: 2, weeks: 3, hours: 74, summary: "Next.js pages, the 3D robot and the scroll-driven services deck.", deliverables: ["Pages", "3D hero", "Services deck"] },
      { name: "Test", start: 4, weeks: 1, hours: 16, summary: "Real devices, slow connections and reduced-motion checks.", deliverables: ["Device QA", "Performance pass", "Fixes"] },
      { name: "Launch", start: 5, weeks: 1, hours: 10, summary: "Redirects, analytics and a handover note for the team.", deliverables: ["Go-live", "Analytics", "Docs"] },
    ],
    results: {
      statement:
        "Visitors now see what the agency does, how it delivers and what it costs before they write, and the quotes that arrive are better briefed.",
      kpis: [
        { value: 1.9, suffix: "×", label: "quote requests" },
        { value: 48, suffix: "%", label: "more time on services" },
        { value: 6, suffix: " days", label: "enquiry to proposal" },
      ],
      table: [
        { metric: "Largest contentful paint", before: 4.6, after: 1.4, unit: "s", lowerIsBetter: true },
        { metric: "Bounce rate", before: 68, after: 44, unit: "%", lowerIsBetter: true },
        { metric: "Quote requests per month", before: 7, after: 13 },
        { metric: "Enquiry to proposal", before: 11, after: 6, unit: "d", lowerIsBetter: true },
      ],
      trend: { label: "Quote requests per month", months: MONTHS.slice(0, 9), values: [5, 6, 7, 8, 12, 12, 13, 14, 13], launch: 4 },
    },
    review: {
      quote:
        "The site finally sounds like us. Prospects arrive already knowing our process and our prices, so the first call starts further along.",
      name: "Co-founder",
      role: "Amethyst Developers",
      initials: "AD",
      rating: 5,
    },
  },
  "story-portfolio": {
    client: "Personal project",
    timeline: "Jun – Aug 2026",
    team: "Solo: design and development, evenings and weekends",
    services: ["Art direction", "Front-end", "3D and motion"],
    headline: [
      { value: 12, suffix: " wks", label: "Concept to launch" },
      { value: 9, label: "Pages and scenes" },
      { value: 57, suffix: "fps", label: "On a mid-range laptop" },
      { value: 94, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 94 },
      { label: "Accessibility", value: 96 },
      { label: "Best practices", value: 96 },
      { label: "SEO", value: 97 },
    ],
    problem: {
      statement:
        "Portfolios get skimmed in seconds. A grid of screenshots says what someone built, not how they think, and nobody remembers it an hour later.",
      pains: [
        { value: 11, suffix: "s", label: "average visit", text: "Visitors to the old grid portfolio left after one scroll." },
        { value: 81, suffix: "%", label: "never opened a project", text: "The work itself was the least visited part of the site." },
        { value: 1, label: "enquiry in three months", text: "It looked like every other developer portfolio." },
      ],
      funnel: [
        { label: "Arrived", value: 100 },
        { label: "Scrolled past the hero", value: 46 },
        { label: "Opened a project", value: 19 },
        { label: "Got in touch", value: 0.8 },
      ],
    },
    challenge: {
      statement:
        "Tell a story through scroll, with real 3D and motion on every page, without the site feeling slow, heavy or hard to use.",
      items: [
        { title: "Motion that stays smooth", text: "Every scene had to hold 60fps on a four-year-old laptop.", level: 5 },
        { title: "3D on phones", text: "The same scenes on a phone GPU, at a fraction of the power.", level: 5 },
        { title: "Accessible by default", text: "Reduced-motion versions and full keyboard use for every piece.", level: 4 },
        { title: "One visual language", text: "One button, one link style and a strict palette everywhere.", level: 3 },
      ],
      constraints: [
        { label: "Budget", value: "Evenings and weekends" },
        { label: "Performance", value: "Lighthouse 90+ on every page" },
        { label: "Devices", value: "Phones first, ultrawide last" },
        { label: "Motion", value: "Pauses off screen, respects settings" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 2, hours: 19, summary: "What people remember about a portfolio, and what they skip.", deliverables: ["Story outline", "References", "Site map"] },
      { name: "Design", start: 1, weeks: 3, hours: 58, summary: "Palette, type, the logo and every scene storyboarded.", deliverables: ["Style tiles", "Storyboards", "Logo"] },
      { name: "Build", start: 3, weeks: 6, hours: 171, summary: "Next.js, GSAP timelines, Lenis and three.js scenes.", deliverables: ["Home", "Projects world", "Story"] },
      { name: "Test", start: 8, weeks: 3, hours: 41, summary: "Frame-time budgets, reduced motion and real devices.", deliverables: ["Perf budget", "A11y audit", "Fixes"] },
      { name: "Launch", start: 11, weeks: 1, hours: 12, summary: "Metadata, sitemap, analytics and a quiet launch.", deliverables: ["Go-live", "Analytics", "OG images"] },
    ],
    results: {
      statement:
        "Visits last about five times longer, most visitors now open at least one project, and the site itself has become the first thing clients mention on a call.",
      kpis: [
        { value: 4.8, suffix: "×", label: "longer visits" },
        { value: 61, suffix: "%", label: "open a project" },
        { value: 94, label: "Lighthouse performance" },
      ],
      table: [
        { metric: "Average visit", before: 11, after: 53, unit: "s" },
        { metric: "Opened a project", before: 19, after: 61, unit: "%" },
        { metric: "Enquiries per month", before: 0.3, after: 4 },
        { metric: "Largest contentful paint", before: 3.1, after: 1.3, unit: "s", lowerIsBetter: true },
      ],
      // Launched at the end of August 2026, so weeks, not months (every other week labelled)
      trend: { label: "Average visit", unit: "s", months: ["Jun 29", "", "Jul 13", "", "Jul 27", "", "Aug 10", "", "Aug 24", "", "Sep 7", "", "Sep 21"], values: [12, 11, 12, 10, 11, 13, 11, 12, 29, 44, 51, 49, 53], launch: 8 },
    },
    review: {
      quote:
        "The first portfolio I've scrolled to the end of in years. It feels like meeting the person behind it, and it never once felt slow.",
      name: "Creative director",
      role: "Design studio",
      initials: "CD",
      rating: 5,
    },
  },

  "hra-studio": {
    client: "HRA Studio",
    timeline: "Apr – May 2026",
    team: "Solo developer, with the studio's founder",
    services: ["Brand site", "Design", "Development"],
    headline: [
      { value: 7, suffix: " wks", label: "Brief to launch" },
      { value: 7, label: "Pages" },
      { value: 37, suffix: "%", label: "More contact starts" },
      { value: 96, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 96 },
      { label: "Accessibility", value: 94 },
      { label: "Best practices", value: 96 },
      { label: "SEO", value: 91 },
    ],
    problem: {
      statement:
        "A new studio with strong work and no web presence. Prospects arrived from referrals, found a placeholder page, and quietly went elsewhere.",
      pains: [
        { value: 1, label: "page online", text: "A holding page with an email address and nothing else." },
        { value: 64, suffix: "%", label: "referrals lost", text: "Most referred prospects never got in touch." },
        { value: 9, suffix: " days", label: "to reply to a lead", text: "Leads arrived in personal inboxes with no context." },
      ],
      funnel: [
        { label: "Arrived", value: 100 },
        { label: "Read the services", value: 36 },
        { label: "Opened contact", value: 9 },
        { label: "Booked a call", value: 2.1 },
      ],
    },
    challenge: {
      statement:
        "Make a two-person studio look established from its first day, and give every visitor a short, obvious route to a first call.",
      items: [
        { title: "Look established", text: "A calm, confident identity with very little existing work to show.", level: 4 },
        { title: "One signature moment", text: "A slow smoke-like hero that stays light on the GPU.", level: 4 },
        { title: "A clear route", text: "From any page to a booked call in two steps.", level: 3 },
        { title: "Editable", text: "The founders update the site without a developer.", level: 2 },
      ],
      constraints: [
        { label: "Deadline", value: "Live before a pitch" },
        { label: "Budget", value: "Fixed, small" },
        { label: "Content", value: "Written during the build" },
        { label: "Team", value: "Two founders, no marketing" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 1, hours: 11, summary: "Who refers them, and what those prospects need to hear.", deliverables: ["Positioning", "Site map"] },
      { name: "Design", start: 1, weeks: 2, hours: 38, summary: "A monochrome system and the smoke hero, prototyped early.", deliverables: ["UI kit", "Hero prototype"] },
      { name: "Build", start: 2, weeks: 4, hours: 97, summary: "React, GSAP and a component library they can extend.", deliverables: ["Pages", "Components", "Booking flow"] },
      { name: "Test", start: 5, weeks: 1, hours: 17, summary: "Copy passes, devices and the booking route end to end.", deliverables: ["QA", "Copy edits"] },
      { name: "Launch", start: 6, weeks: 1, hours: 7, summary: "Domain, analytics and a handover walkthrough.", deliverables: ["Go-live", "Walkthrough"] },
    ],
    results: {
      statement:
        "The studio now looks the size of its work. Visitors stay more than twice as long, and more of them reach out, straight into a booked call.",
      kpis: [
        { value: 2.4, suffix: "×", label: "longer visits" },
        { value: 37, suffix: "%", label: "more contact starts" },
        { value: 1.2, suffix: "s", label: "largest contentful paint" },
      ],
      table: [
        { metric: "Average visit", before: 24, after: 57, unit: "s" },
        { metric: "Contact form starts", before: 9, after: 12.3, unit: "%" },
        { metric: "Calls booked per month", before: 2, after: 6 },
        { metric: "Reply time to a lead", before: 9, after: 1, unit: "d", lowerIsBetter: true },
      ],
      trend: { label: "Calls booked per month", months: MONTHS.slice(0, 9), values: [1, 2, 1, 2, 3, 5, 5, 6, 7], launch: 4 },
    },
    review: {
      quote:
        "We looked like a studio twice our size from the day it launched. The booking route alone paid for the project in the first month.",
      name: "Founder",
      role: "HRA Studio",
      initials: "HR",
      rating: 5,
    },
  },

  "mab-portfolio": {
    client: "Personal project",
    timeline: "Feb – Mar 2026",
    team: "Solo: design and development",
    services: ["Design", "Front-end", "3D"],
    headline: [
      { value: 5, suffix: " wks", label: "Concept to launch" },
      { value: 5, label: "Sections" },
      { value: 1, label: "3D robot guide" },
      { value: 86, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 86 },
      { label: "Accessibility", value: 92 },
      { label: "Best practices", value: 93 },
      { label: "SEO", value: 91 },
    ],
    problem: {
      statement:
        "Starting out with no clients and no portfolio: just a CV that looked like everyone else's and a few projects nobody could see.",
      pains: [
        { value: 0, label: "public projects", text: "Everything lived in local folders and zip files." },
        { value: 6, suffix: "s", label: "recruiter glance", text: "A plain CV got a few seconds of attention." },
        { value: 2, label: "replies in a month", text: "Applications rarely got an answer." },
      ],
      funnel: [
        { label: "Saw the CV", value: 100 },
        { label: "Read past the top", value: 30 },
        { label: "Looked at projects", value: 6 },
        { label: "Replied", value: 1.5 },
      ],
    },
    challenge: {
      statement: "Build a first portfolio that feels like meeting a person, while learning three.js from scratch.",
      items: [
        { title: "Learning 3D", text: "Models, lights and cameras, learned on the job.", level: 5 },
        { title: "Personality", text: "A friendly robot guide without it becoming a gimmick.", level: 3 },
        { title: "Speed", text: "Keeping a 3D landing page quick on older phones.", level: 4 },
      ],
      constraints: [
        { label: "Experience", value: "First three.js project" },
        { label: "Budget", value: "Zero" },
        { label: "Hosting", value: "Free static hosting" },
        { label: "Time", value: "Around full-time study" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 1, hours: 7, summary: "What a recruiter needs to see in the first few seconds.", deliverables: ["Outline"] },
      { name: "Design", start: 0, weeks: 2, hours: 23, summary: "The robot, the palette and the sections.", deliverables: ["Mockups", "Robot model"] },
      { name: "Build", start: 1, weeks: 3, hours: 86, summary: "Vanilla JS, CSS and a three.js scene.", deliverables: ["Landing scene", "Sections"] },
      { name: "Test", start: 3, weeks: 1, hours: 13, summary: "Phones, slow networks and friends as testers.", deliverables: ["Fixes"] },
      { name: "Launch", start: 4, weeks: 1, hours: 4, summary: "Deployed and shared.", deliverables: ["Go-live"] },
    ],
    results: {
      statement: "The first real replies from studios, and the start of everything since. It also taught me what not to do in version two.",
      kpis: [
        { value: 6.5, suffix: "×", label: "more replies" },
        { value: 41, suffix: "s", label: "average visit" },
        { value: 3, label: "first client projects" },
      ],
      table: [
        { metric: "Replies per month", before: 2, after: 13 },
        { metric: "Average visit", before: 6, after: 41, unit: "s" },
        { metric: "Projects online", before: 0, after: 6 },
      ],
      trend: { label: "Replies per month", months: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"], values: [1, 2, 1, 2, 4, 9, 11, 12, 14, 13, 15], launch: 4 },
    },
    review: {
      quote: "The robot got our attention; the code behind it got the interview. You could tell he cared about every detail.",
      name: "Hiring lead",
      role: "Digital agency",
      initials: "HL",
      rating: 5,
    },
  },

  "interactive-cv": {
    client: "Personal project",
    timeline: "Feb 2026",
    team: "Solo: design and development",
    services: ["Design", "Front-end", "Print styles"],
    headline: [
      { value: 3, suffix: " wks", label: "Concept to launch" },
      { value: 4, label: "Colour themes" },
      { value: 1, label: "Click to a PDF" },
      { value: 97, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 97 },
      { label: "Accessibility", value: 95 },
      { label: "Best practices", value: 96 },
      { label: "SEO", value: 90 },
    ],
    problem: {
      statement: "Keeping a CV current meant editing a design file, exporting a PDF and emailing it again, and the PDF never matched the website.",
      pains: [
        { value: 3, label: "versions to keep in sync", text: "Design file, PDF and website, always out of step." },
        { value: 40, suffix: " min", label: "per update", text: "Every small change meant a full export and re-send." },
        { value: 0, label: "interactivity", text: "A static page with nothing to explore." },
      ],
      funnel: [
        { label: "Opened", value: 100 },
        { label: "Read the summary", value: 55 },
        { label: "Reached projects", value: 21 },
        { label: "Downloaded", value: 4 },
      ],
    },
    challenge: {
      statement: "One source for the screen and the printed page, with themes, and nothing that breaks when printed.",
      items: [
        { title: "Print that matches", text: "The PDF had to look like the page, page breaks included.", level: 4 },
        { title: "Themes", text: "Light, dark and four palettes, all readable.", level: 3 },
        { title: "No framework", text: "Plain HTML, CSS and JavaScript, kept tiny.", level: 2 },
      ],
      constraints: [
        { label: "Size", value: "Under 50 KB of JavaScript" },
        { label: "Print", value: "A4 and US Letter" },
        { label: "Themes", value: "Contrast AA in every palette" },
        { label: "Hosting", value: "Static" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 1, hours: 5, summary: "What recruiters read first, on screen and on paper.", deliverables: ["Content audit"] },
      { name: "Design", start: 0, weeks: 1, hours: 14, summary: "Layout for screen and paper at the same time.", deliverables: ["Layouts", "Palettes"] },
      { name: "Build", start: 1, weeks: 2, hours: 37, summary: "Semantic HTML, CSS variables and print styles.", deliverables: ["CV page", "Theme switcher", "Print CSS"] },
      { name: "Test", start: 2, weeks: 1, hours: 7, summary: "Browsers, printers and screen readers.", deliverables: ["Fixes"] },
      { name: "Launch", start: 2, weeks: 1, hours: 3, summary: "Published with a short link.", deliverables: ["Go-live"] },
    ],
    results: {
      statement: "One file to edit, a PDF that always matches, and a CV that people actually play with before they read it.",
      kpis: [
        { value: 2, suffix: " min", label: "per update" },
        { value: 97, label: "Lighthouse performance" },
        { value: 3.2, suffix: "×", label: "more downloads" },
      ],
      table: [
        { metric: "Time per update", before: 40, after: 2, unit: "min", lowerIsBetter: true },
        { metric: "Versions to maintain", before: 3, after: 1, lowerIsBetter: true },
        { metric: "Downloads per month", before: 6, after: 19 },
      ],
      trend: { label: "Downloads per month", months: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"], values: [5, 6, 5, 7, 13, 15, 16, 18, 17, 19, 20], launch: 3 },
    },
    review: {
      quote: "The only CV I've ever switched to dark mode. It printed perfectly, too, which is rarer than it should be.",
      name: "Recruiter",
      role: "Tech recruitment firm",
      initials: "RC",
      rating: 5,
    },
  },

  "facebook-clone": {
    client: "Personal project",
    timeline: "Jan 2026",
    team: "Solo: front-end",
    services: ["Front-end", "Layout", "Responsive UI"],
    headline: [
      { value: 4, suffix: " wks", label: "Start to finish" },
      { value: 24, label: "Components" },
      { value: 3, label: "Breakpoints" },
      { value: 91, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 91 },
      { label: "Accessibility", value: 89 },
      { label: "Best practices", value: 93 },
      { label: "SEO", value: 87 },
    ],
    problem: {
      statement: "Tutorials teach one component at a time. I wanted to know how a very large product holds together, pixel by pixel, across screens.",
      pains: [
        { value: 1, label: "page layouts built", text: "Small exercises, never a full product screen." },
        { value: 0, label: "design systems used", text: "No habit of reusable, consistent pieces." },
        { value: 2, label: "breakpoints handled", text: "Layouts that broke between phone and desktop." },
      ],
      funnel: [
        { label: "Started", value: 100 },
        { label: "Feed", value: 70 },
        { label: "Stories and composer", value: 45 },
        { label: "Contacts and chat", value: 25 },
      ],
    },
    challenge: {
      statement: "Rebuild the feed faithfully in plain HTML, CSS and JavaScript, with no framework to lean on.",
      items: [
        { title: "Pixel accuracy", text: "Spacing, type and icons matched to the real product.", level: 4 },
        { title: "Three columns", text: "A layout that collapses cleanly from desktop to phone.", level: 4 },
        { title: "Reusable parts", text: "A small component system in plain CSS.", level: 3 },
      ],
      constraints: [
        { label: "Stack", value: "HTML, CSS, JavaScript only" },
        { label: "Reference", value: "The live product" },
        { label: "Screens", value: "Phone, tablet, desktop" },
        { label: "Time", value: "Four weeks, part-time" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 1, hours: 7, summary: "Took the real feed apart into parts and spacing rules.", deliverables: ["Component list"] },
      { name: "Design", start: 0, weeks: 1, hours: 5, summary: "Tokens for colour, type and spacing.", deliverables: ["Tokens"] },
      { name: "Build", start: 1, weeks: 3, hours: 58, summary: "Feed, stories, composer, contacts and chat.", deliverables: ["Feed", "Stories", "Chat"] },
      { name: "Test", start: 3, weeks: 1, hours: 9, summary: "Side-by-side checks at every breakpoint.", deliverables: ["Fixes"] },
      { name: "Launch", start: 3, weeks: 1, hours: 2, summary: "Published as a study.", deliverables: ["Go-live"] },
    ],
    results: {
      statement: "A faithful rebuild, and a lasting habit: think in components, tokens and breakpoints before writing a line of CSS.",
      kpis: [
        { value: 24, label: "reusable components" },
        { value: 3, label: "breakpoints" },
        { value: 91, label: "Lighthouse performance" },
      ],
      table: [
        { metric: "Components", before: 0, after: 24 },
        { metric: "Breakpoints handled", before: 2, after: 3 },
        { metric: "CSS size", before: 180, after: 61, unit: "KB", lowerIsBetter: true },
      ],
      trend: { label: "Components built per week", months: ["W1", "W2", "W3", "W4"], values: [4, 11, 19, 24], launch: 3 },
    },
    review: {
      quote: "Hard to tell apart from the real thing at a glance. The structure underneath was even more impressive than the look.",
      name: "Mentor",
      role: "Senior front-end engineer",
      initials: "MT",
      rating: 5,
    },
  },
};
