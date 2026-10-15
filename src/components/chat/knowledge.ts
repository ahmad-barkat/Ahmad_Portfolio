/**
 * The site assistant's knowledge and its matcher. Everything it says is
 * built from the site's own data files, so it can never disagree with the
 * pages, and it runs entirely in the visitor's browser: no AI service, no
 * keys, no cost, and nothing typed leaves the page.
 *
 * How a question is matched: the words are normalised (lower case, plural
 * and -ing endings trimmed, synonyms folded into one word: "cost", "rate"
 * and "budget" all become "price"), then every topic scores by the key
 * phrases it finds. Projects and technologies are recognised by name first.
 * Below a minimum score the assistant says it does not know and hands the
 * visitor to Ahmad directly, rather than guessing.
 */
import {
  CALENDLY_URL,
  CALL_POINTS,
  CONTACT_EMAIL,
  EMAIL_HREF,
  FAQ,
  GITHUB_URL,
  LINKEDIN_URL,
  NEXT_STEPS,
  PHONE_DISPLAY,
  TIMELINES,
  BUDGETS,
  WHATSAPP_HREF,
} from "@/data/contact";
import { PROFILE } from "@/data/profile";
import { PROJECTS, projectPath } from "@/data/projects";
import { PUBLISHED_REVIEWS } from "@/data/reviews";
import { SERVICE_INFO } from "@/data/services";
import { PHASES } from "@/data/process";

export interface ChatAction {
  label: string;
  href: string;
  /** Opens in a new tab (other sites, WhatsApp, Calendly) */
  external?: boolean;
}

export interface ChatAnswer {
  text: string;
  actions?: ChatAction[];
  /** Follow-up questions offered as chips */
  suggest?: string[];
}

/* ── Actions the answers reuse ────────────────────────────────────────────── */
const A = {
  whatsapp: { label: "WhatsApp", href: WHATSAPP_HREF, external: true },
  email: { label: "Email", href: EMAIL_HREF },
  call: { label: "Book a call", href: CALENDLY_URL, external: true },
  brief: { label: "Send a brief", href: "/contact" },
  hire: { label: "Hire me page", href: "/hire" },
  projects: { label: "See the projects", href: "/projects" },
  home: { label: "About Ahmad", href: "/home" },
  linkedin: { label: "LinkedIn", href: LINKEDIN_URL, external: true },
  github: { label: "GitHub", href: GITHUB_URL, external: true },
} satisfies Record<string, ChatAction>;

/** Site copy written in Ahmad's own voice ("I reply…"), told about him ("he replies…") */
function third(text: string) {
  return text
    .replace(/\bI am\b/g, "Ahmad is")
    .replace(/\bI'm\b/g, "he's")
    .replace(/\bI\b/g, "he")
    .replace(/\bmy\b/g, "his")
    .replace(/\bMy\b/g, "His")
    .replace(/\bme\b/g, "him")
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
}

const faq = (start: string) => third(FAQ.find((f) => f.q.toLowerCase().startsWith(start.toLowerCase()))?.a ?? "");
const list = (items: readonly string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export const STARTERS = [
  "What do you build?",
  "How much does a project cost?",
  "How long does it take?",
  "Is Ahmad available for hire?",
  "Show me your projects",
  "How do I get in touch?",
];

/* ── Words: normalising and synonyms ───────────────────────────────────────── */
/** Words folded into one, so different ways of asking meet the same key */
const SYNONYMS: Record<string, string> = {
  cost: "price", costs: "price", pricing: "price", priced: "price", charge: "price", charges: "price",
  rate: "price", rates: "price", quote: "price", budget: "price", fee: "price", fees: "price",
  expensive: "price", cheap: "price", affordable: "price", much: "price", paid: "price", money: "price",
  long: "time", timeline: "time", duration: "time", deadline: "time", weeks: "time", week: "time",
  days: "time", fast: "time", quickly: "time", soon: "time", deliver: "time", delivery: "time",
  hire: "hire", hiring: "hire", employ: "hire", employment: "hire", job: "hire", jobs: "hire",
  role: "hire", roles: "hire", position: "hire", vacancy: "hire", recruit: "hire", recruiter: "hire",
  fulltime: "hire", "full-time": "hire", contract: "hire", permanent: "hire",
  available: "available", availability: "available", free: "available", open: "available", busy: "available",
  contact: "contact", reach: "contact", email: "contact", mail: "contact", message: "contact",
  whatsapp: "contact", phone: "contact", number: "contact", talk: "contact", touch: "contact", dm: "contact",
  call: "call", meeting: "call", meet: "call", calendly: "call", book: "call", schedule: "call", zoom: "call",
  service: "service", services: "service", offer: "service", offering: "service", provide: "service",
  build: "service", make: "service", create: "service", develop: "service", specialise: "service", specialize: "service",
  project: "work", projects: "work", portfolio: "work", work: "work", example: "work", examples: "work",
  case: "work", sample: "work", samples: "work", previous: "work", past: "work", built: "work", made: "work",
  process: "process", steps: "process", step: "process", approach: "process", workflow: "process", method: "process",
  stack: "skill", skills: "skill", skill: "skill", tech: "skill", technology: "skill", technologies: "skill",
  tools: "skill", tool: "skill", language: "skill", languages: "skill", framework: "skill", frameworks: "skill",
  where: "location", location: "location", based: "location", country: "location", city: "location",
  timezone: "location", zone: "location", live: "location",
  relocate: "relocate", relocation: "relocate", visa: "relocate", sponsorship: "relocate", abroad: "relocate", move: "relocate",
  remote: "remote", remotely: "remote", online: "remote",
  review: "review", reviews: "review", testimonial: "review", testimonials: "review", feedback: "review", clients: "client", client: "client",
  support: "support", maintenance: "support", maintain: "support", launch: "support", after: "support", fix: "support", fixes: "support", bug: "support", bugs: "support",
  start: "start", started: "start", begin: "start", need: "start", require: "start", requirement: "start", requirements: "start", onboarding: "start",
  design: "design", designs: "design", figma: "design", ui: "design", ux: "design", wireframe: "design", prototype: "design",
  team: "team", developers: "team", agency: "team", codebase: "team", existing: "team",
  animation: "motion", animations: "motion", motion: "motion", gsap: "motion", scroll: "motion", interaction: "motion", interactions: "motion",
  "3d": "webgl", webgl: "webgl", three: "webgl", "three.js": "webgl", threejs: "webgl", shader: "webgl", shaders: "webgl",
  seo: "speed", performance: "speed", speed: "speed", vitals: "speed", google: "speed", ranking: "speed", lighthouse: "speed",
  mobile: "mobile", responsive: "mobile", phone_layout: "mobile", tablet: "mobile", app: "mobile", apps: "mobile",
  website: "site", websites: "site", site: "site", sites: "site", landing: "site", page: "site", webapp: "site", store: "site", shop: "site", ecommerce: "site",
  who: "about", about: "about", yourself: "about", background: "about", introduce: "about", ahmad: "about", barkat: "about",
  experience: "experience", experienced: "experience", years: "experience", junior: "experience", senior: "experience",
  education: "education", degree: "education", university: "education", study: "education", studied: "education", certificate: "education",
  speak: "speaks", english: "speaks", urdu: "speaks",
  linkedin: "social", github: "social", social: "social", instagram: "social", twitter: "social",
  bot: "bot", ai: "bot", robot: "bot", assistant: "bot", human: "bot", real: "bot", chatgpt: "bot",
};

/** Words that carry no meaning for matching */
const STOP = new Set(
  "a an the is are am was were be been do does did you your yours i me my we our us to of in on for with and or it this that can could would will should please tell know whats hi hey there any some".split(" "),
);

function stem(w: string) {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && w.endsWith("es") && !w.endsWith("ses")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

/** The question as canonical words */
export function words(text: string): string[] {
  const raw = text
    .toLowerCase()
    .replace(/next\s*\.?\s*js/g, "nextjs")
    .replace(/node\s*\.?\s*js/g, "nodejs")
    .replace(/three\s*\.?\s*js/g, "threejs")
    .replace(/full[\s-]*time/g, "fulltime")
    .replace(/full[\s-]*stack/g, "fullstack")
    .replace(/web\s*apps?/g, "webapp")
    .replace(/e-?commerce/g, "ecommerce")
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const r of raw) {
    const w = r.replace(/^[.-]+|[.-]+$/g, "");
    if (!w) continue;
    const syn = SYNONYMS[w] ?? SYNONYMS[stem(w)];
    if (syn) out.push(syn);
    else if (!STOP.has(w)) out.push(stem(w));
  }
  return out;
}

/* ── Projects and technologies, recognised by name ─────────────────────────── */
const GENERIC = new Set(["portfolio", "properties", "developers", "studio", "interactive", "the", "cv", "story"]);
/** Distinctive words per project (with the whole slug as a fallback) */
const PROJECT_KEYS = PROJECTS.map((p) => ({
  project: p,
  keys: [
    ...p.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !GENERIC.has(w)),
    p.slug.replace(/-/g, " "),
    p.title.toLowerCase(),
  ],
}));

function findProject(text: string) {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, " ")} `;
  return PROJECT_KEYS.find(({ keys }) => keys.some((k) => t.includes(` ${k} `)))?.project;
}

/** Technologies people ask about, by the names they use */
const TECH: { name: string; match: RegExp }[] = [
  { name: "Next.js", match: /\bnext\s*\.?\s*js\b|\bnextjs\b/ },
  { name: "React", match: /\breact\b/ },
  { name: "TypeScript", match: /\btypescript\b|\bts\b/ },
  // "js" alone, not the end of "next.js", "node js" or "three.js"
  { name: "JavaScript", match: /\bjavascript\b|(?<!\b(?:next|node|three)[\s.]?)\bjs\b/ },
  { name: "Node.js", match: /\bnode\s*\.?\s*js\b|\bnodejs\b|\bnode\b|\bexpress\b|\bbackend\b|\bback-end\b/ },
  { name: "Tailwind CSS", match: /\btailwind\b/ },
  { name: "GSAP", match: /\bgsap\b|\bgreensock\b/ },
  { name: "Three.js", match: /\bthree\s*\.?\s*js\b|\bthreejs\b|\bwebgl\b/ },
  { name: "REST APIs", match: /\brest(ful)? apis?\b|\bapis?\b/ },
  { name: "HTML", match: /\bhtml\b/ },
  { name: "CSS", match: /\bcss\b/ },
];
/** Popular tools he does not list: answered honestly, not claimed */
const OTHER_TECH = /\b(wordpress|shopify|wix|webflow|squarespace|php|laravel|python|django|flask|java|kotlin|swift|flutter|react native|angular|vue|svelte|ruby|rails|\.net|c#|golang|rust|firebase|supabase|mongodb|mysql|postgres|postgresql|sql|graphql|aws|docker|kubernetes)\b/;

const skills = PROFILE.skills as readonly string[];
/** Next.js is React, so a Next.js project counts for both */
const ALSO: Record<string, string[]> = { React: ["next"] };
const projectsUsing = (name: string) => {
  const roots = [name.toLowerCase().split(/[ .]/)[0], ...(ALSO[name] ?? [])];
  return PROJECTS.filter((p) => p.stack.some((s) => roots.some((r) => s.toLowerCase().startsWith(r)))).map((p) => p.title);
};

function techAnswer(text: string): ChatAnswer | null {
  const t = text.toLowerCase();
  const known = TECH.filter((x) => x.match.test(t)).map((x) => x.name);
  if (known.length) {
    const lines = known.map((name) => {
      const used = projectsUsing(name);
      return used.length ? `${name}: yes, used in ${list(used)}.` : `${name}: yes, it is part of his everyday stack.`;
    });
    return {
      text: `Ahmad works with ${list(known)}.\n${lines.join("\n")}`,
      actions: [A.projects, A.brief],
      suggest: ["What is your full tech stack?", "What do you build?"],
    };
  }
  const other = t.match(OTHER_TECH)?.[0];
  if (other) {
    return {
      text: `${other[0].toUpperCase()}${other.slice(1)} isn't in Ahmad's listed stack, which is ${list(skills)}. If your project needs it, ask him directly: he will tell you honestly whether he is the right fit.`,
      actions: [A.whatsapp, A.email],
      suggest: ["What is your full tech stack?"],
    };
  }
  return null;
}

function projectAnswer(p: (typeof PROJECTS)[number]): ChatAnswer {
  return {
    text: `${p.title} (${p.kind}, ${p.year}). ${p.summary}\nRole: ${p.role}. Built with ${list(p.stack)}.`,
    actions: [
      { label: `Open ${p.title}`, href: projectPath(p.slug) },
      ...(p.href ? [{ label: "Visit the live site", href: p.href, external: true }] : []),
    ],
    suggest: ["Show me your projects", "How much does a project cost?"],
  };
}

/* ── Topics ────────────────────────────────────────────────────────────────── */
interface Topic {
  /** Key phrases, in canonical words; a longer phrase that matches scores more */
  keys: string[];
  answer: () => ChatAnswer;
}

const SERVICE_KEYS: Record<string, string[]> = {
  CODE: ["fullstack", "backend", "api", "database", "auth", "payment", "cms", "webapp", "site"],
  DESIGN: ["design"],
  MOTION: ["motion"],
  WEBGL: ["webgl"],
  SPEED: ["speed"],
  MOBILE: ["mobile"],
};

const TOPICS: Topic[] = [
  {
    keys: ["about", "who"],
    answer: () => ({
      text: PROFILE.summary,
      actions: [A.home, A.hire],
      suggest: ["What do you build?", "Where are you based?", "Show me your projects"],
    }),
  },
  {
    keys: ["price", "price site", "price webapp", "price work", "how price"],
    answer: () => ({
      text: `${faq("How much")}\nWhen you send a brief you can pick a budget range: ${list(BUDGETS)}.`,
      actions: [A.brief, A.call],
      suggest: ["How long does it take?", "What happens after launch?"],
    }),
  },
  {
    keys: ["time", "time site", "time webapp", "time work", "how time"],
    answer: () => ({
      text: `${faq("How long")}\nIn the brief you can choose: ${list(TIMELINES)}.`,
      actions: [A.brief],
      suggest: ["How much does a project cost?", "How do you work?"],
    }),
  },
  {
    keys: ["hire", "available", "hire available", "hire remote", "relocate", "hire relocate", "remote"],
    answer: () => ({
      text: `Yes. Ahmad is open to ${list(PROFILE.seeking.employmentTypes.map((s) => s.toLowerCase()))} roles: ${list(
        PROFILE.seeking.arrangements.map((s) => s.toLowerCase()),
      )}, in regions such as ${list(PROFILE.seeking.regions)}. He also takes on freelance projects.`,
      actions: [A.hire, A.email, A.linkedin],
      suggest: ["What is your tech stack?", "Where are you based?"],
    }),
  },
  {
    keys: ["location", "location timezone", "client", "client international", "international"],
    answer: () => ({
      // The FAQ answer's last sentences (the overlap with each region) follow
      text: `Ahmad is based in ${PROFILE.location.country} (${PROFILE.location.timeZone}) and works remotely with clients abroad. ${faq("Do you work with international").replace(/^[\s\S]*?(?=His day)/, "")}`,
      actions: [A.call],
      suggest: ["Is Ahmad available for hire?", "How do I get in touch?"],
    }),
  },
  {
    keys: ["service", "what service", "site", "webapp"],
    answer: () => ({
      text: `Ahmad designs and builds websites and web apps, end to end:\n${SERVICE_INFO.map((s) => `• ${s.title}: ${s.points.join(", ")}`).join("\n")}`,
      actions: [A.home, A.brief],
      suggest: ["Show me your projects", "How much does a project cost?", "How do you work?"],
    }),
  },
  ...SERVICE_INFO.map((s) => ({
    keys: SERVICE_KEYS[s.word] ?? [],
    answer: () => ({
      text: `${s.title}. ${s.body}\nIncludes: ${list(s.points)}.`,
      actions: [A.projects, A.brief],
      suggest: ["What else do you build?", "How much does a project cost?"],
    }),
  })),
  {
    keys: ["process", "how work", "process step"],
    answer: () => ({
      text: `Every project runs in ${PHASES.length} steps:\n${PHASES.map((p) => `${p.index}. ${p.phase}: ${p.title}`).join("\n")}\nYou get preview links all the way through, so you can steer while it grows.`,
      actions: [A.home, A.brief],
      suggest: ["How long does it take?", "What do you need from me to start?"],
    }),
  },
  {
    keys: ["skill", "skill stack", "what skill"],
    answer: () => ({
      text: `Ahmad's stack: ${list(skills)}.`,
      actions: [A.projects, A.github],
      suggest: ["Do you use Three.js?", "Show me your projects"],
    }),
  },
  {
    keys: ["work", "show work", "best work", "latest work"],
    answer: () => ({
      text: `${PROJECTS.length} projects so far:\n${PROJECTS.map((p) => `• ${p.title}: ${p.kind}`).join("\n")}\nAsk about any of them by name.`,
      actions: [A.projects],
      suggest: [`Tell me about ${PROJECTS[0].title}`, "What is your tech stack?"],
    }),
  },
  {
    keys: ["support", "support launch", "after launch"],
    answer: () => ({
      text: faq("What happens after"),
      actions: [A.brief],
      suggest: ["How much does a project cost?"],
    }),
  },
  {
    keys: ["start", "how start", "start work"],
    answer: () => ({
      text: `${faq("What do you need")}\nThen: ${NEXT_STEPS.map((s, i) => `${i + 1}. ${third(s.title)}`).join(", ")}.`,
      actions: [A.brief, A.call],
      suggest: ["How long does it take?", "How much does a project cost?"],
    }),
  },
  {
    keys: ["design", "team", "design team", "existing team", "existing design", "work design", "work team"],
    answer: () => ({
      text: faq("Can you work with"),
      actions: [A.brief],
      suggest: ["How do you work?"],
    }),
  },
  {
    keys: ["contact", "how contact", "contact number"],
    answer: () => ({
      text: `The quickest ways to reach Ahmad:\n• WhatsApp or call: ${PHONE_DISPLAY}\n• Email: ${CONTACT_EMAIL}\n• A free 30-minute call, booked online\nHe replies within one working day.`,
      actions: [A.whatsapp, A.email, A.call],
      suggest: ["What do you need from me to start?"],
    }),
  },
  {
    keys: ["call", "book call", "call available"],
    answer: () => ({
      text: `You can book a call straight into Ahmad's calendar: ${list(CALL_POINTS.map((c) => c.toLowerCase()))}.`,
      actions: [A.call],
      suggest: ["What do you need from me to start?"],
    }),
  },
  {
    keys: ["review", "client review", "client say"],
    answer: () =>
      PUBLISHED_REVIEWS.length
        ? {
            text: `${PUBLISHED_REVIEWS.length} client reviews are on the home page. A short one: “${PUBLISHED_REVIEWS[0].quote}” (${PUBLISHED_REVIEWS[0].name}, ${PUBLISHED_REVIEWS[0].role}).`,
            actions: [A.home],
          }
        : {
            text: "Client reviews are being collected and will be on the site soon. Meanwhile, the projects show the work itself, and Ahmad is happy to put you in touch with past clients.",
            actions: [A.projects, A.whatsapp],
          },
  },
  {
    keys: ["experience", "how experience"],
    answer: () => ({
      text: `Ahmad has shipped ${PROJECTS.length} projects in ${list([...new Set(PROJECTS.map((p) => p.year))])}, from a real-estate platform with a custom dashboard to interactive 3D portfolios. Each one is on the projects page with its role and stack.`,
      actions: [A.projects, A.linkedin],
      suggest: ["Show me your projects", "What is your tech stack?"],
    }),
  },
  {
    keys: ["education"],
    answer: () =>
      PROFILE.education.length
        ? {
            text: PROFILE.education.map((e) => `${e.degree}, ${e.school} (${e.years})`).join("\n"),
            actions: [A.linkedin],
          }
        : {
            text: "That one is best answered by Ahmad himself, and his LinkedIn has the details.",
            actions: [A.linkedin, A.email],
          },
  },
  {
    keys: ["speaks"],
    answer: () => ({
      text: `Ahmad works in ${list(PROFILE.languages.map((l) => l.name))}.`,
      actions: [A.call],
    }),
  },
  {
    keys: ["social"],
    answer: () => ({
      text: "You can find Ahmad on LinkedIn and GitHub.",
      actions: [A.linkedin, A.github],
    }),
  },
  {
    keys: ["bot"],
    answer: () => ({
      text: "I'm the assistant built into Ahmad's site. I answer from what's on these pages, right here in your browser, so nothing you type is sent anywhere. For anything I can't answer, Ahmad replies personally.",
      actions: [A.whatsapp, A.email],
      suggest: STARTERS.slice(0, 3),
    }),
  },
];

/* ── Matching ──────────────────────────────────────────────────────────────── */
const GREETING = /^(hi+|hey+|hello+|hiya|yo|salam|assalam[ou]* ?alaikum|aoa|good (morning|afternoon|evening))\b[\s!.,]*$/i;
const THANKS = /\b(thanks?|thank you|thx|ty|cheers|great|perfect|awesome|ok(ay)?|cool|nice)\b[\s!.]*$/i;
const BYE = /^(bye|goodbye|see you|later|cya)\b/i;

/** The best answer to `text` */
export function answer(text: string): ChatAnswer {
  const q = text.trim();
  if (!q) return greet();
  if (GREETING.test(q)) return greet();
  if (BYE.test(q)) return { text: "Thanks for stopping by. If you need Ahmad, he's one message away.", actions: [A.whatsapp, A.email] };
  if (THANKS.test(q) && q.split(/\s+/).length <= 4) {
    return { text: "You're welcome. Anything else you'd like to know?", suggest: STARTERS.slice(0, 4) };
  }

  const project = findProject(q);
  if (project) return projectAnswer(project);

  const w = words(q);
  const set = new Set(w);

  // A technology by name, unless the question is clearly about something else
  const tech = techAnswer(q);
  const competing = ["price", "time", "hire", "contact", "call"].some((k) => set.has(k));
  if (tech && !competing) return tech;

  let best: Topic | null = null;
  let bestScore = 0;
  for (const topic of TOPICS) {
    let score = 0;
    for (const key of topic.keys) {
      const parts = key.split(" ");
      if (parts.every((p) => set.has(p))) score += parts.length ** 1.5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }
  if (best && bestScore >= 1) return best.answer();
  if (tech) return tech;
  return unknown();
}

function greet(): ChatAnswer {
  return {
    text: `Hi! I'm the assistant on ${PROFILE.name}'s site. Ask me about his work, services, prices, timelines or how to hire him.`,
    suggest: STARTERS,
  };
}

function unknown(): ChatAnswer {
  return {
    text: "I don't have that one in my notes. Ahmad can answer it himself, usually within a working day:",
    actions: [A.whatsapp, A.email, A.call],
    suggest: STARTERS.slice(0, 4),
  };
}

/** The opening message */
export const WELCOME = greet();
