# Portfolio: handover plan

Project: Next.js portfolio for Ahmad Barkat at `D:\Ahmad Updated Portfolio\Ahmad_Portfolio`.
Stack: Next.js (App Router), React, TypeScript, Tailwind, GSAP (ScrollTrigger, useGSAP), Lenis smooth scroll, three.js.
Dev server: `npm run dev` on http://localhost:3000. The home page is `/home`; `/` is a separate landing page with its own loader (WillemLoader).

---

## 1. Standing rules from the client

- **Quality bar.** Everything must feel modern, professional, elegant, smooth and responsive. Nothing may look "vibe coded" or AI-built.
- **No glows.** No glowing circles, glow shadows or neon halos anywhere. The client dislikes them.
- **One button style and one link style, site-wide.**
  - Buttons: `ButtonWithIcon` (`src/components/ui/button-with-icon.tsx`).
  - Links: the `.ftr-link` style with `TextRoll` inside (see the footer and HeroAside for examples).
- **Palette.** Theme colours: ink `#041B3F`, navy `#072A5E`, royal `#0B3D91`, sky `#3BA7F2`, mint `#7FE7D6`, ice `#E8F6FF`. Crimson (`#e3263a`) is used only for the anime "genjutsu" accents.
- **Anime theme.** Sharingan, Naruto, genjutsu. It is used as a tasteful accent (hover faces, the dragon, keywords), never as the whole design.
- **Keep the dev server running** while working.
- **Placeholder data** is marked and must be replaced before launch (see section 5).

---

## 2. Home page structure (`src/app/home/page.tsx`)

1. **Hero:** `LandoAboutHero` + `HeroAside`.
2. **About:** `AboutMeSection` (the crimson dragon with the liquid reveal).
3. **Services:** `ServicesSection`.
4. **Process:** `ProcessSection` (a pinned road map).
5. **Tech Stack:** `TechStackSection` (3D footballs).
6. **Work:** `WorkSection` (project cards).
7. **Reviews:** `ReviewsSection`.
8. **Footer:** `CinematicFooter` (`src/components/ui/motion-footer.tsx`), a curtain reveal.

**Global pieces in `layout.tsx`:**

- `TransitionProvider`: an expanding-rectangle page transition that exposes `isTransitioning`.
- `GlobalPreloader`: a first-visit loader, shown once per session via `sessionStorage.app_loaded`.
- `AnimationGovernor`: pauses CSS animations inside off-screen sections via `[data-offscreen]`.
- `LenisProvider`, `Navbar`, and `Analytics`.

---

## 3. Work completed (all live in the code)

### Footer
- `CinematicFooter` is on every page except the nav page and `/story`. It includes the services marquee, the "Have an idea? Let's build it." call to action, the logo and the status line.

### Logo (`src/components/ui/Logo.tsx`)
- `LogoMark` / `LogoLockup` (an "A" whose crossbar is a text cursor).
- Used in the navbar centre, the menu, the footer, `src/app/icon.svg` and the OpenGraph image.

### Hero (`LandoAboutHero.tsx`, `HeroAside.tsx`)
- **Portrait:** a WebGL liquid-mask reveal (`liquid-mask-reveal.tsx`) between `/hero-base-cutout.webp` and `/hero-hover-cutout.webp`.
  - It uses the dragon's exact reveal settings (`DRAGON_REVEAL` in `src/components/ui/reveal-presets.ts`).
  - The brush size is matched in px to the dragon (`useDragonMetrics`), and the noise is scaled by width.
- **Side columns (desktop):**
  - intro statement;
  - client proof (avatars, stars, "N client reviews" link);
  - stats (placeholders);
  - a rotating client quote with word-by-word `ReadingText`.
- **Phones:** a stats row, a proof pill, and the line "Full-stack developer · Dubai".
- **Genjutsu hover faces** (`src/components/ui/genjutsu-reveal.tsx`): every side block has a hidden anime "alt face".
  - The dragon-style torn SVG mask reveals the alt face; the normal face gets the exact inverse mask, so there is no backing plate or edge.
  - The filter region is limited to the ink's bounds, for performance.
- **AHMAD wordmark:** its clipped 90px text-shadow was removed; it caused hard-edged rectangles.
- **Deep gradient background:** `var(--grad-deep)`.

### Hero page entrance (built most recently)
- `src/components/ui/page-ready.ts`: `usePageReady()` becomes true once the first-visit preloader has lifted and no transition overlay is active.
  - The preloader sets `html[data-preloader="on"]` while showing and fires the `app:preloader-done` event.
- One GSAP timeline in `LandoAboutHero.tsx` (see its "Page entrance" comment):
  - 0.00s: the background settles in.
  - 0.10s: the portrait unveils from the bottom up (clip-path).
  - 0.35s: AHMAD rises letter by letter.
  - 0.80s: the left column's eyebrow line draws in and its words rise.
  - 0.95s: the stats rise and count up.
  - 1.25s: client proof (the faces pop in, then the stars).
  - 1.40s: the quote. Phones get their own rows.
- The hero starts with `data-intro-state="pending"`, which the CSS uses to hide the animated parts, then moves to `running` and finally `done`.
  - The quote's reading clock is paused while pending.
  - There is a 6-second fallback, a `<noscript>` style, and a simple fade for reduced motion.
- `src/components/ui/RevealText.tsx`: splits text into masked words (`.rw` / `.rw-i`) for the word reveals.
- `HeadingReveal` gained a `manual` prop, so a parent timeline can drive its letters (`.hr-reveal-char`).
- The old CSS entrance timers were removed: `hero-wordmark-enter`, `hero-portrait-enter`, `.hs-in`, and the mobile-line animations.
- The HeroAside count-up moved into the hero timeline.
- **Fixed:** `.hs-eyebrow span` also styled the word spans (they became 1px tall). It is now `.hs-eyebrow > span:not(.rw)`.
- **Last tweak, not yet re-recorded:** the `.hs-stat` and `.hs-m__stats` containers now fade in (opacity 0 → 1) instead of snapping, so their divider lines don't show before the numbers. It passes the typecheck.

### Gradients (tokens in `globals.css` `:root`, built in OKLCH from the theme)
- `--grad-signature` (full sweep to pale aqua) + `--grad-signature-light`: used on the Tech Stack stage.
- `--grad-deep` (stops at azure; white text contrast at least 5.6:1) + `--grad-deep-light`: used on the hero background and the footer (`.ftr`).
- `--grad-soft` (bright end held back at muted sky `#57a8d7`) + `--grad-soft-light`.
  - Applied through the `.sec-gradient` class on About and Reviews.
  - Its `::before` fades into navy at the top and bottom, so there are no seams.

### Tech Stack (`TechStackSection.tsx`, `tech-stack-icons.ts`)
- Recreates the "Footballs in Motion / Attractor" reference.
- Three.js scene with custom 3D physics:
  - an attractor inside a glass bubble that trails the cursor;
  - the bubble is solid, so fast moves knock the balls loose;
  - friction and spin, a fixed 120Hz step, and the loop sleeps at rest or when off-screen.
- **Balls:** a truncated-icosahedron football shader with royal pentagons and ice hexagons.
  - The tool logos are Simple Icons paths (CC0), drawn large in the pentagons with a slight lift.
- **Tools:** 23 (including JavaScript, HTML and CSS). Phones show a core subset of 14. A hover chip shows the tool's name and kind.
- **Copy:** the text reads differently for touch and for mouse.

### Other sections
- **Reviews:** redesigned with a featured quote, a reviewer index, a progress line and auto-advance.
  - Illustrated SVG avatars live in `public/reviews/*.svg`. The data is in `src/data/reviews.ts` (sample reviews are filtered out in production).
- **Work:** modern project cards.
- **Performance pass (earlier):**
  - no per-frame layout reads;
  - loops sleep when idle;
  - `AnimationGovernor` pauses off-screen CSS animations;
  - the liquid reveal's idle sleep is now counted in frames, so it can't freeze half-open at low frame rates.

### Removed at the client's request
- **"Tsukuyomi / under my genjutsu":** the screen takeover when hovering the face. Removed completely, including the reveal "burst" event.
- **Flame section separators:** both the metaball and Worley-cell versions. Removed completely (`SectionFlame.tsx` and its CSS are deleted).
- **Tech Stack v1:** the 2D DOM balls, replaced by the 3D version.
- **Reviews:** the infinite marquee tape.

---

## 4. Next steps (in order)

1. **Verify the latest hero entrance tweak.**
   - Record the entrance again on desktop and phone, and confirm the stat dividers fade in with their numbers.
   - Test it in a production build (`npm run build && npm start`); in dev, hydration delays the start by about 3–4s.
2. **Full home-page bug check** (requested by the client, not started yet). Known lead:
   - `Navbar.tsx` calls `gsap.defaults({ ease: "kn-main", duration: 0.7 })`, which changes GSAP defaults globally for every tween on the site. Scope it to the navbar's own timelines instead.

   Also check:
   - every section on desktop (1440×900) and phone (390×844);
   - console errors and horizontal overflow;
   - the Lenis anchor links;
   - the footer curtain;
   - the reduced-motion paths;
   - navigating `/` → `/home` through the transition overlay (the entrance must wait for it).
3. **Projects page:** the client wants to move there next, with the same quality bar and the same one-button, one-link rules.

---

## 5. Needs the client's input

- **Stats:** the hero figures are placeholders (5+ years, 40+ projects, 98 Lighthouse). They are in `STATS` in `HeroAside.tsx`.
- **Reviews:** they are samples. Real client reviews, with permission and photos, go in `src/data/reviews.ts`.
- **Projects:** the Work section and the projects page need real projects.
- **Tech Stack list:** confirm it, especially JavaScript, HTML and CSS, which were added to fill out the cluster. Lenis has no icon and shows its name instead.
- **Font:** `--font-sans` is undefined, so headings render in the browser's default serif. Offer to set up a proper font.

---

## 6. Testing notes

- The headless test harness lives in the old session's scratchpad (`cdp.mjs` + `plan_*.mjs`).
  - It runs `node --experimental-websocket cdp.mjs <w> <h> <plan.mjs> [mobile]`.
  - It supports `page.on("Page.screencastFrame")` for frame-by-frame recordings.
  - It now deletes its temporary Chrome profile after each run. Earlier runs had left 240 profiles behind and filled the C: drive to 99%; they were deleted, which freed about 5 GB.
- **Start of a test:** set `sessionStorage.app_loaded = "true"` to skip the first-visit preloader.
- **Waiting for the entrance:** wait for `[data-intro-state]` to become `done`.
- **Headless limits:**
  - There's no GPU, so WebGL runs at about 30fps (the portrait fluid simulation and the Tech Stack); that is fine on real hardware.
  - Keep at most about 8 WebGL canvases on one test page; Chrome drops the older contexts beyond about 16.
- **Shell editing:** bash heredocs that contain quotes or backticks fail. Write Python edit scripts to a file first, then run them.
- **Typecheck:** `npx tsc --noEmit -p .` was clean as of this handover.
