/**
 * The services, as text: shown by the Services section (which pairs each one
 * with the particle symbol it draws) and read by the site's chat assistant.
 */
export interface ServiceInfo {
  index: string;
  tag: string;
  title: string;
  body: string;
  points: string[];
  /** Name of the symbol the particle field forms for this service. */
  form: string;
  /** The word the particles spell under the symbol. */
  word: string;
  accent: string;
}

export const SERVICE_INFO: ServiceInfo[] = [
  {
    index: "01",
    tag: "Core Build",
    title: "Full-Stack Development",
    body: "Production web apps from database to pixel — typed end to end, fast by default, and architected to hold up well past launch day.",
    points: ["Next.js & React", "APIs & databases", "Auth & payments", "Headless CMS"],
    form: "Code",
    word: "CODE",
    accent: "#3BA7F2",
  },
  {
    index: "02",
    tag: "Design Systems",
    title: "UI/UX & Interface Design",
    body: "Interfaces with a point of view. From wireframes to a living design system, shaped around how people actually move through a product.",
    points: ["Wireframes & prototypes", "Design systems", "Accessibility (WCAG)", "Figma to code"],
    form: "Nib",
    word: "DESIGN",
    accent: "#7FE7D6",
  },
  {
    index: "03",
    tag: "GSAP // Motion",
    title: "Motion & Scroll Animation",
    body: "Motion that explains instead of decorates — scroll-driven stories, page transitions and micro-interactions tuned to hold 60–120 FPS.",
    points: ["ScrollTrigger stories", "Page transitions", "Micro-interactions", "SVG & Lottie"],
    form: "Curve",
    word: "MOTION",
    accent: "#5FC7E4",
  },
  {
    index: "04",
    tag: "Three.js // Shaders",
    title: "3D & WebGL Experiences",
    body: "Real-time 3D in the browser without melting the laptop: interactive scenes, product viewers and custom shaders that load fast and stay smooth.",
    points: ["Three.js scenes", "Custom GLSL shaders", "3D product viewers", "Asset optimisation"],
    form: "Cube",
    word: "WEBGL",
    accent: "#3BA7F2",
  },
  {
    index: "05",
    tag: "Core Web Vitals",
    title: "Performance & SEO",
    body: "Speed is a feature. Audits and fixes that move Lighthouse and Core Web Vitals into the green — and the monitoring that keeps them there.",
    points: ["Core Web Vitals", "Technical SEO", "Bundle & image budgets", "Performance monitoring"],
    form: "Bolt",
    word: "SPEED",
    accent: "#7FE7D6",
  },
  {
    index: "06",
    tag: "Every Screen",
    title: "Mobile & Responsive Apps",
    body: "One product, every screen. Responsive builds and installable PWAs that feel native on a phone and generous on a 4K display.",
    points: ["Responsive layouts", "Progressive Web Apps", "Touch & gesture UX", "Cross-device QA"],
    form: "Device",
    word: "MOBILE",
    accent: "#A5EEE2",
  },
];
