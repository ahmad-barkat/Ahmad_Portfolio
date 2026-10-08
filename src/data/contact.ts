/**
 * Content for the contact page (/contact): the brief form's options, the
 * direct channels and the FAQ. The FAQ is also published as FAQPage
 * structured data by the route's page.tsx.
 *
 * PLACEHOLDER: the budget ranges, the reply time, the timeline figures in the
 * FAQ and the support period after launch are first guesses. Confirm them with
 * the client before launch.
 */

/* -- Contact details: the one place they live. The footer reads them too. -- */
export const CONTACT_EMAIL = "code.by.ahmad.dev@gmail.com";
/** Opens a new email to Ahmad with the subject filled in */
export const EMAIL_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Project enquiry")}`;

/** The address behind the floating mail button (MailFab) on every page */
export const QUICK_EMAIL = CONTACT_EMAIL;
export const QUICK_EMAIL_HREF = `mailto:${QUICK_EMAIL}?subject=${encodeURIComponent("Hello Ahmad")}`;

export const PHONE_DISPLAY ="+92 305 4090550";
export const PHONE_HREF = "tel:+923054090550";

/** Opens a WhatsApp chat with Ahmad, the first message already written */
export const WHATSAPP_MESSAGE = "Hi Ahmad, are you available at this time?";
export const WHATSAPP_HREF = `https://wa.me/923054090550?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export const LINKEDIN_URL = "https://www.linkedin.com/in/muhammad-ahmad-barkat-b673b9305";
export const GITHUB_URL = "https://github.com/ahmad-barkat";

/** Ahmad's Calendly booking page (the 30-minute call, his only event type),
 *  so visitors land straight on the calendar */
export const CALENDLY_URL = "https://calendly.com/ahmadbarkat382/30min";
/** The same page for the embedded calendar, in the site's colours (Calendly
 *  applies colours on paid plans only; the frame is styled for both cases) */
export const CALENDLY_EMBED_URL = `${CALENDLY_URL}?${new URLSearchParams({
  hide_gdpr_banner: "1",
  background_color: "072a5e",
  text_color: "e8f6ff",
  primary_color: "7fe7d6",
})}`;

export const CALL_POINTS = ["Free, 30 minutes", "Shown in your own time zone", "Calendar invite sent right away"];

/** Formspree form "mvkgldyb": briefs from the form are emailed to the
 *  address set up in Formspree. The form ID is public by design. */
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvkgldyb";

/** Words the hero types after "Let's build your ", one after another */
export const HERO_WORDS = ["website", "web app", "store", "startup", "idea"];

export const PROJECT_TYPES = [
  "Website",
  "Web app",
  "E-commerce",
  "Landing page",
  "Redesign",
  "Something else",
];

/** PLACEHOLDER: ranges to confirm with the client (USD) */
export const BUDGETS = ["Under $2k", "$2k – $5k", "$5k – $10k", "$10k+", "Not sure yet"];

export const TIMELINES = ["As soon as possible", "Within a month", "1 – 3 months", "Flexible"];

/** What happens after a brief is sent. PLACEHOLDER: the reply time. */
export const NEXT_STEPS = [
  { title: "I read your brief", body: "Every message comes to me, and I reply within one working day." },
  { title: "A short call", body: "Thirty minutes on your goals, scope and timing. Free, with no obligation." },
  { title: "A clear proposal", body: "Scope, timeline and a fixed price in writing, before any work starts." },
];

export interface Channel {
  label: string;
  value: string;
  note: string;
  action: string;
  href: string;
  external?: boolean;
  /** A second way to use the same channel (e.g. call the WhatsApp number) */
  secondary?: { action: string; href: string };
}

export const CHANNELS: Channel[] = [
  {
    label: "Email",
    value: CONTACT_EMAIL,
    note: "Best for detailed briefs, files and references.",
    action: "Write me an email",
    href: EMAIL_HREF,
  },
  {
    label: "WhatsApp",
    value: PHONE_DISPLAY,
    note: "Quickest for a short question or a first hello.",
    action: "Message on WhatsApp",
    href: WHATSAPP_HREF,
    external: true,
    secondary: { action: "Call", href: PHONE_HREF },
  },
  {
    label: "LinkedIn",
    value: "Muhammad Ahmad Barkat",
    note: "Connect, or see who I have worked with.",
    action: "Open LinkedIn",
    href: LINKEDIN_URL,
    external: true,
  },
  {
    label: "GitHub",
    value: "ahmad-barkat",
    note: "Code, experiments and open-source work.",
    action: "View GitHub",
    href: GITHUB_URL,
    external: true,
  },
];

/** PLACEHOLDER answers: the timelines and the support period need the client's figures */
export const FAQ = [
  {
    q: "How much does a project cost?",
    a: "Every project is priced on its scope, so there is no fixed price list. After a short call you get a fixed price in writing, before any work starts, so there are no surprises later.",
  },
  {
    q: "How long does a project take?",
    a: "A landing page usually takes one to two weeks, a full website four to six, and a web app eight weeks or more. The proposal comes with a week-by-week timeline.",
  },
  {
    q: "What do you need from me to get started?",
    a: "A short brief (the form above is enough), any brand assets you have, and a few sites you like. No copy or design yet? We can work those out together.",
  },
  {
    q: "Do you work with international clients?",
    a: "Yes, that is most of my work. I am based in Pakistan (UTC+5) and work remotely with clients abroad. My day overlaps fully with the Gulf and most of the European working day, and I keep early-morning or evening slots for calls with the US.",
  },
  {
    q: "Can you work with my existing design or team?",
    a: "Yes. I can build from your Figma files, join your developers on an existing codebase, or take a project from idea to launch on my own.",
  },
  {
    q: "What happens after launch?",
    a: "Every project includes 30 days of fixes after launch. After that you can keep me on a monthly plan for updates and improvements, or get a clean hand-over to your team.",
  },
];
