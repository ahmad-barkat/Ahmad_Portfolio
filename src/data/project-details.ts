/**
 * The long read for each project, on /projects/[slug].
 *
 * DUMMY: every number, quote and story here is a placeholder written to show
 * the layout. Replace each project's entry with the real figures (and a real
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
  /** e.g. "Mar – May 2024" */
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
    /** A monthly figure either side of launch; `launch` is the index of the launch month */
    trend: { label: string; unit?: string; months: string[]; values: number[]; launch: number };
  };
  review: { quote: string; name: string; role: string; initials: string; rating: number };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const PROJECT_DETAILS: Record<string, ProjectDetail> = {
  "ard-al-khair": {
    client: "Ard Al Khair Real Estate, Dubai",
    timeline: "Feb – May 2024",
    team: "Solo developer, with the client's sales team",
    services: ["Full-stack development", "Dashboard", "Performance"],
    headline: [
      { value: 12, suffix: " wks", label: "Brief to launch" },
      { value: 40, suffix: "+", label: "Properties managed" },
      { value: 3, suffix: "×", label: "Enquiries per listing" },
      { value: 96, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 96 },
      { label: "Accessibility", value: 98 },
      { label: "Best practices", value: 100 },
      { label: "SEO", value: 100 },
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
        "Make a catalogue of 40+ off-plan properties feel like a luxury brochure on a phone, while giving a sales team with no technical staff full control of it.",
      items: [
        { title: "Heavy media, fast pages", text: "Renders and drone footage had to stay sharp without slowing the first load.", level: 5 },
        { title: "Roles and security", text: "Admins, agents and partners each see and edit different things.", level: 4 },
        { title: "Syndication", text: "Listings had to publish to two property portals from one form.", level: 4 },
        { title: "Arabic and English", text: "Right-to-left layouts from day one, not bolted on later.", level: 3 },
      ],
      constraints: [
        { label: "Deadline", value: "Launch before the spring expo" },
        { label: "Content", value: "40 listings migrated from PDFs" },
        { label: "Devices", value: "70% of visitors on phones" },
        { label: "Team", value: "No in-house developer after handover" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 2, hours: 30, summary: "Sales calls, analytics review and a map of every listing field.", deliverables: ["Content model", "Site map", "Roles matrix"] },
      { name: "Design", start: 1, weeks: 3, hours: 70, summary: "Listing pages that lead with the skyline, then the dashboard.", deliverables: ["Wireframes", "UI kit", "Prototype"] },
      { name: "Build", start: 3, weeks: 6, hours: 210, summary: "Next.js front end, Node API, image pipeline and sign-in.", deliverables: ["Listings site", "Dashboard", "Portal sync"] },
      { name: "Test", start: 8, weeks: 3, hours: 50, summary: "Real agents publishing real listings, on real phones.", deliverables: ["Device QA", "Load tests", "Fixes"] },
      { name: "Launch", start: 11, weeks: 1, hours: 20, summary: "Migration, redirects, training and a handover guide.", deliverables: ["Go-live", "Training", "Docs"] },
    ],
    results: {
      statement:
        "Listings now go live in minutes, pages open in about a second on a phone, and the sales team hears from three times as many buyers per property.",
      kpis: [
        { value: 62, suffix: "%", label: "faster first load" },
        { value: 3, suffix: "×", label: "enquiries per listing" },
        { value: 15, suffix: " min", label: "to publish a listing" },
      ],
      table: [
        { metric: "Largest contentful paint", before: 5.8, after: 1.2, unit: "s", lowerIsBetter: true },
        { metric: "Bounce rate", before: 72, after: 38, unit: "%", lowerIsBetter: true },
        { metric: "Enquiries per month", before: 34, after: 118 },
        { metric: "Pages per visit", before: 1.6, after: 4.3 },
        { metric: "Time to publish", before: 72, after: 0.25, unit: "h", lowerIsBetter: true },
      ],
      trend: { label: "Enquiries per month", months: MONTHS, values: [28, 31, 34, 30, 36, 64, 82, 95, 104, 112, 118, 126], launch: 5 },
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

  "story-portfolio": {
    client: "Personal project",
    timeline: "Jun – Sep 2026",
    team: "Solo: design and development",
    services: ["Art direction", "Front-end", "3D and motion"],
    headline: [
      { value: 14, suffix: " wks", label: "Concept to launch" },
      { value: 9, label: "Pages and scenes" },
      { value: 60, suffix: "fps", label: "On mid-range laptops" },
      { value: 98, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 98 },
      { label: "Accessibility", value: 100 },
      { label: "Best practices", value: 100 },
      { label: "SEO", value: 100 },
    ],
    problem: {
      statement:
        "Portfolios get skimmed in seconds. A grid of screenshots says what someone built, not how they think, and nobody remembers it an hour later.",
      pains: [
        { value: 11, suffix: "s", label: "average visit", text: "Visitors to the old grid portfolio left after one scroll." },
        { value: 81, suffix: "%", label: "never opened a project", text: "The work itself was the least visited part of the site." },
        { value: 0, label: "follow-up enquiries", text: "It looked like every other developer portfolio." },
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
        { label: "Performance", value: "Lighthouse 95+ on every page" },
        { label: "Devices", value: "Phones first, ultrawide last" },
        { label: "Motion", value: "Pauses off screen, respects settings" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 2, hours: 25, summary: "What people remember about a portfolio, and what they skip.", deliverables: ["Story outline", "References", "Site map"] },
      { name: "Design", start: 1, weeks: 4, hours: 80, summary: "Palette, type, the logo and every scene storyboarded.", deliverables: ["Style tiles", "Storyboards", "Logo"] },
      { name: "Build", start: 4, weeks: 7, hours: 260, summary: "Next.js, GSAP timelines, Lenis and three.js scenes.", deliverables: ["Home", "Projects world", "Story"] },
      { name: "Test", start: 10, weeks: 3, hours: 60, summary: "Frame-time budgets, reduced motion and real devices.", deliverables: ["Perf budget", "A11y audit", "Fixes"] },
      { name: "Launch", start: 13, weeks: 1, hours: 15, summary: "Metadata, sitemap, analytics and a quiet launch.", deliverables: ["Go-live", "Analytics", "OG images"] },
    ],
    results: {
      statement:
        "Visits last five times longer, most visitors now open at least one project, and the site itself has become the first thing clients mention on a call.",
      kpis: [
        { value: 5, suffix: "×", label: "longer visits" },
        { value: 64, suffix: "%", label: "open a project" },
        { value: 98, label: "Lighthouse performance" },
      ],
      table: [
        { metric: "Average visit", before: 11, after: 58, unit: "s" },
        { metric: "Opened a project", before: 19, after: 64, unit: "%" },
        { metric: "Enquiries per month", before: 0.5, after: 6 },
        { metric: "Largest contentful paint", before: 3.1, after: 1.1, unit: "s", lowerIsBetter: true },
      ],
      trend: { label: "Enquiries per month", months: MONTHS, values: [0, 1, 0, 1, 0, 1, 3, 4, 5, 5, 6, 7], launch: 5 },
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
    timeline: "Aug – Oct 2025",
    team: "Solo developer, with the studio's founder",
    services: ["Brand site", "Design", "Development"],
    headline: [
      { value: 8, suffix: " wks", label: "Brief to launch" },
      { value: 7, label: "Pages" },
      { value: 35, suffix: "%", label: "More contact starts" },
      { value: 99, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 99 },
      { label: "Accessibility", value: 97 },
      { label: "Best practices", value: 100 },
      { label: "SEO", value: 100 },
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
      { name: "Discover", start: 0, weeks: 1, hours: 12, summary: "Who refers them, and what those prospects need to hear.", deliverables: ["Positioning", "Site map"] },
      { name: "Design", start: 1, weeks: 2, hours: 45, summary: "A monochrome system and the smoke hero, prototyped early.", deliverables: ["UI kit", "Hero prototype"] },
      { name: "Build", start: 2, weeks: 4, hours: 110, summary: "React, GSAP and a component library they can extend.", deliverables: ["Pages", "Components", "Booking flow"] },
      { name: "Test", start: 6, weeks: 1, hours: 18, summary: "Copy passes, devices and the booking route end to end.", deliverables: ["QA", "Copy edits"] },
      { name: "Launch", start: 7, weeks: 1, hours: 8, summary: "Domain, analytics and a handover walkthrough.", deliverables: ["Go-live", "Walkthrough"] },
    ],
    results: {
      statement:
        "The studio now looks the size of its work. Visitors stay more than twice as long, and more of them reach out, straight into a booked call.",
      kpis: [
        { value: 2.4, suffix: "×", label: "longer visits" },
        { value: 35, suffix: "%", label: "more contact starts" },
        { value: 1.1, suffix: "s", label: "largest contentful paint" },
      ],
      table: [
        { metric: "Average visit", before: 24, after: 58, unit: "s" },
        { metric: "Contact form starts", before: 9, after: 12.2, unit: "%" },
        { metric: "Calls booked per month", before: 2, after: 7 },
        { metric: "Reply time to a lead", before: 9, after: 1, unit: "d", lowerIsBetter: true },
      ],
      trend: { label: "Calls booked per month", months: MONTHS, values: [1, 2, 2, 1, 2, 2, 4, 5, 6, 6, 7, 8], launch: 5 },
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
    timeline: "Jan – Mar 2024",
    team: "Solo: design and development",
    services: ["Design", "Front-end", "3D"],
    headline: [
      { value: 9, suffix: " wks", label: "Concept to launch" },
      { value: 5, label: "Sections" },
      { value: 1, label: "3D robot guide" },
      { value: 88, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 88 },
      { label: "Accessibility", value: 94 },
      { label: "Best practices", value: 96 },
      { label: "SEO", value: 100 },
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
      { name: "Discover", start: 0, weeks: 1, hours: 10, summary: "What a recruiter needs to see in the first few seconds.", deliverables: ["Outline"] },
      { name: "Design", start: 1, weeks: 2, hours: 30, summary: "The robot, the palette and the sections.", deliverables: ["Mockups", "Robot model"] },
      { name: "Build", start: 2, weeks: 5, hours: 120, summary: "Vanilla JS, CSS and a three.js scene.", deliverables: ["Landing scene", "Sections"] },
      { name: "Test", start: 7, weeks: 1, hours: 15, summary: "Phones, slow networks and friends as testers.", deliverables: ["Fixes"] },
      { name: "Launch", start: 8, weeks: 1, hours: 5, summary: "Deployed and shared.", deliverables: ["Go-live"] },
    ],
    results: {
      statement: "The first real replies from studios, and the start of everything since. It also taught me what not to do in version two.",
      kpis: [
        { value: 7, suffix: "×", label: "more replies" },
        { value: 42, suffix: "s", label: "average visit" },
        { value: 3, label: "first client projects" },
      ],
      table: [
        { metric: "Replies per month", before: 2, after: 14 },
        { metric: "Average visit", before: 6, after: 42, unit: "s" },
        { metric: "Projects online", before: 0, after: 6 },
      ],
      trend: { label: "Replies per month", months: MONTHS, values: [1, 2, 1, 2, 3, 8, 10, 12, 13, 14, 14, 15], launch: 4 },
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
    timeline: "Apr – May 2024",
    team: "Solo: design and development",
    services: ["Design", "Front-end", "Print styles"],
    headline: [
      { value: 5, suffix: " wks", label: "Concept to launch" },
      { value: 4, label: "Colour themes" },
      { value: 1, label: "Click to a PDF" },
      { value: 100, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 100 },
      { label: "Accessibility", value: 100 },
      { label: "Best practices", value: 100 },
      { label: "SEO", value: 100 },
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
      { name: "Discover", start: 0, weeks: 1, hours: 6, summary: "What recruiters read first, on screen and on paper.", deliverables: ["Content audit"] },
      { name: "Design", start: 0, weeks: 2, hours: 20, summary: "Layout for screen and paper at the same time.", deliverables: ["Layouts", "Palettes"] },
      { name: "Build", start: 1, weeks: 3, hours: 50, summary: "Semantic HTML, CSS variables and print styles.", deliverables: ["CV page", "Theme switcher", "Print CSS"] },
      { name: "Test", start: 3, weeks: 1, hours: 8, summary: "Browsers, printers and screen readers.", deliverables: ["Fixes"] },
      { name: "Launch", start: 4, weeks: 1, hours: 3, summary: "Published with a short link.", deliverables: ["Go-live"] },
    ],
    results: {
      statement: "One file to edit, a PDF that always matches, and a CV that people actually play with before they read it.",
      kpis: [
        { value: 2, suffix: " min", label: "per update" },
        { value: 100, label: "Lighthouse, every category" },
        { value: 3, suffix: "×", label: "more downloads" },
      ],
      table: [
        { metric: "Time per update", before: 40, after: 2, unit: "min", lowerIsBetter: true },
        { metric: "Versions to maintain", before: 3, after: 1, lowerIsBetter: true },
        { metric: "Downloads per month", before: 6, after: 19 },
      ],
      trend: { label: "Downloads per month", months: MONTHS, values: [5, 6, 5, 7, 6, 12, 15, 17, 18, 19, 19, 21], launch: 4 },
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
    timeline: "Oct – Nov 2023",
    team: "Solo: front-end",
    services: ["Front-end", "Layout", "Responsive UI"],
    headline: [
      { value: 6, suffix: " wks", label: "Start to finish" },
      { value: 24, label: "Components" },
      { value: 3, label: "Breakpoints" },
      { value: 92, label: "Lighthouse performance" },
    ],
    scores: [
      { label: "Performance", value: 92 },
      { label: "Accessibility", value: 91 },
      { label: "Best practices", value: 96 },
      { label: "SEO", value: 90 },
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
        { label: "Time", value: "Six weeks, part-time" },
      ],
    },
    process: [
      { name: "Discover", start: 0, weeks: 1, hours: 8, summary: "Took the real feed apart into parts and spacing rules.", deliverables: ["Component list"] },
      { name: "Design", start: 0, weeks: 1, hours: 6, summary: "Tokens for colour, type and spacing.", deliverables: ["Tokens"] },
      { name: "Build", start: 1, weeks: 4, hours: 70, summary: "Feed, stories, composer, contacts and chat.", deliverables: ["Feed", "Stories", "Chat"] },
      { name: "Test", start: 4, weeks: 1, hours: 10, summary: "Side-by-side checks at every breakpoint.", deliverables: ["Fixes"] },
      { name: "Launch", start: 5, weeks: 1, hours: 3, summary: "Published as a study.", deliverables: ["Go-live"] },
    ],
    results: {
      statement: "A faithful rebuild, and a lasting habit: think in components, tokens and breakpoints before writing a line of CSS.",
      kpis: [
        { value: 24, label: "reusable components" },
        { value: 3, label: "breakpoints" },
        { value: 92, label: "Lighthouse performance" },
      ],
      table: [
        { metric: "Components", before: 0, after: 24 },
        { metric: "Breakpoints handled", before: 2, after: 3 },
        { metric: "CSS size", before: 180, after: 64, unit: "KB", lowerIsBetter: true },
      ],
      trend: { label: "Components built per week", months: ["W1", "W2", "W3", "W4", "W5", "W6"], values: [2, 5, 9, 15, 21, 24], launch: 5 },
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
