# Portfolio progress log

The living record of Ahmad Barkat's portfolio. **It is updated after every change to the site**: add a dated line to the changelog (section 10) and update any section the change affects. It replaces `plan.md` as the source of truth; `plan.md` is kept only as the original handover.

- **Project:** `D:\Ahmad Updated Portfolio\Ahmad_Portfolio`
- **Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind 3, GSAP (ScrollTrigger, useGSAP), Lenis, three.js, framer-motion.
- **Dev server:** `npm run dev` on http://localhost:3000. Keep it running while working.
- **Last updated:** 2026-09-29

---

## 1. Current status

| Area | Status |
|---|---|
| Home page (`/home`) | Built. Needs a full bug check (section 7). |
| Hero entrance | Built. Last tweak (stat dividers fade in) not yet re-recorded. |
| Projects page (`/projects`) | Built: "Enter my world" (seamless loop video → 3D logo + project helix), then an endless scroll-driven carousel with four clickable cards in front (section 5). Nothing below it. All project content is dummy. |
| Project pages (`/projects/[slug]`) | Built for all 6 projects: image-to-background zoom from any project image, then glance, case study, problem, challenge, process, result, client review, testimonials, footer, scroll to the next project (section 5b). All figures are dummy. |
| Real content | Stats, reviews and projects are still placeholders (section 8). |
| Font | Geist (sans) + Geist Mono via `next/font/google` in `layout.tsx`, as `--font-sans` / `--font-mono`. Site-wide. |
| Typecheck | `npx tsc --noEmit -p .` clean as of the last handover. |
| Git | Working tree committed on `master` as `f9d93fe` (2026-09-29). Local `master` is ahead of `origin/master` (not pushed yet). |

---

## 2. Standing rules from the client

- **Quality bar.** Modern, professional, elegant, smooth and responsive. Nothing may look "vibe coded" or AI-built.
- **No glows.** No glowing circles, glow shadows or neon halos anywhere.
- **One button style and one link style, site-wide.**
  - Buttons: `ButtonWithIcon` (`src/components/ui/button-with-icon.tsx`).
  - Links: the `.ftr-link` style with `TextRoll` inside (see the footer and `HeroAside`).
- **Palette.** Ink `#041B3F`, navy `#072A5E`, royal `#0B3D91`, sky `#3BA7F2`, mint `#7FE7D6`, ice `#E8F6FF`. Crimson `#e3263a` only for the anime "genjutsu" accents.
- **Anime theme.** Sharingan, Naruto, genjutsu, used as a tasteful accent (hover faces, the dragon, keywords), never as the whole design.
- **Placeholder data** is marked in code and must be replaced before launch.

---

## 3. Site map

| Route | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page with its own loader (`WillemLoader`). Scroll past the menu → Home (`NextPage`). |
| `/home` | `src/app/home/page.tsx` | The main home page (was `/about`). After the footer: scroll on → Projects (`NextPage`). |
| `/projects` | `src/app/projects/page.tsx` | "Enter my world" dive into the endless project carousel. Nothing else: no case studies, testimonials or footer (client request, 2026-09-29). |
| `/projects/[slug]` | `src/app/projects/[slug]/page.tsx` | One page per project (`ProjectDetail`), statically generated for the 6 slugs; in the sitemap. |
| `/story` | `src/app/story/page.tsx` | Story page (`StorySection`). No footer and no testimonials: the story sends the visitor to `/` when it ends, so nothing after it can be reached. |
| `/contact` | `src/app/contact/page.tsx` | Contact page (`ContactGlobe`), testimonials, footer; then scroll on → Story (`NextPage`). |
| `/privacy`, `/terms`, `/thank-you` | `src/app/*/page.tsx` | Legal and form-confirmation pages, each with testimonials before the footer. |
| 404 | `src/app/not-found.tsx` | |

`/nav` was deleted. `sitemap.ts` lists `/`, `/home`, `/projects`, `/contact`, `/story`, `/privacy`, `/terms` on `https://ahmadbarkat.dev`.

**Global pieces in `layout.tsx`:**

- `TransitionProvider`: expanding-rectangle page transition; exposes `isTransitioning` and `transitionTo()`.
- `GlobalPreloader`: first-visit loader, shown once per session via `sessionStorage.app_loaded`.
- `AnimationGovernor`: pauses CSS animations inside off-screen sections via `[data-offscreen]`.
- `LenisProvider`, `Navbar`, `Analytics`.

**Scroll to the next page (`src/components/ui/next-page.tsx`, `.np-*` CSS at the end of `globals.css`):**

- From the reference video `scroll-to-next-page.mp4`. At the end of a page (after the footer), a full-screen panel of the next page rises over it: its picture, "Next page"/"Next project", the name in a thin ring, "Keep scrolling". The panel pins for one viewport of scroll while the ring draws closed (ice arc, mint leading dot); when it closes, the next page takes over from the panel's picture.
- Projects: the image-to-background zoom (`useOpenProject` with a full-screen source and `shade: 1`), so the next project's hero is the identical frame. Pages: a copy of the panel's picture covers the screen (`.np-handoff`, `html[data-handoff="on"]`) while the router swaps pages, then fades as the new page runs its entrance (`usePageReady` waits for `HANDOFF_DONE_EVENT`).
- Clicking the panel goes straight there. Reduced motion: a plain link, never moves on by itself.
- Chain: `/` → `/home` → `/projects` (the endless carousel has no end, so no panel); every project → the next (the last → the first); `/contact` → `/story` (which already returns to `/` when it ends). Not on the legal pages or `/thank-you`.

---

## 4. Home page (`src/app/home/page.tsx`)

1. **Hero:** `LandoAboutHero` + `HeroAside`.
2. **About:** `AboutMeSection` (the crimson dragon with the liquid reveal).
3. **Services:** `ServicesSection`.
4. **Process:** `ProcessSection` (pinned road map).
5. **Tech Stack:** `TechStackSection` (3D footballs).
6. **Work:** `WorkSection` (stacked project cards).
7. **Testimonials:** `TestimonialsSection` (shared, see below).
8. **Footer:** `CinematicFooter` (`src/components/ui/motion-footer.tsx`), a curtain reveal.

### Footer
- `CinematicFooter` is on every page except `/story` and `/projects` (whose carousel never ends). Services marquee, "Have an idea? Let's build it." call to action, logo and status line.

### Logo (`src/components/ui/Logo.tsx`)
- `LogoMark` / `LogoLockup`: an "A" whose crossbar is a text cursor.
- Used in the navbar centre, the menu, the footer, `src/app/icon.svg` and the OpenGraph image.

### Hero (`LandoAboutHero.tsx`, `HeroAside.tsx`)
- **Portrait:** WebGL liquid-mask reveal (`liquid-mask-reveal.tsx`) between `/hero-base-cutout.webp` and `/hero-hover-cutout.webp`.
  - Uses the dragon's reveal settings (`DRAGON_REVEAL` in `src/components/ui/reveal-presets.ts`).
  - Brush size matched in px to the dragon (`useDragonMetrics`); noise scaled by width.
- **Side columns (desktop):** intro statement; client proof (avatars, stars, "N client reviews" link); stats (placeholders); rotating client quote with word-by-word `ReadingText`.
- **Phones:** a stats row, a proof pill and the line "Full-stack developer · Dubai".
- **Genjutsu hover faces** (`src/components/ui/genjutsu-reveal.tsx`): each side block has a hidden anime "alt face".
  - Hover casts a ripple: a circle opens from where the pointer enters until it covers the block (0.75s, power3.out), with two hairline crimson rings on its edge, and closes into the point where the pointer leaves (0.6s). Reversing mid-way continues from the current circle.
  - Pure CSS radial-gradient masks driven by `--gj-x/--gj-y/--gj-r` (GSAP tween); the normal face takes the exact inverse mask, so the faces never mix. Replaced the torn SVG-noise brush on 2026-09-29, which stuttered and showed both faces interleaved.
  - Touch: a tap opens it from the finger and it closes after 3s (or on a second tap). Reduced motion: instant swap.
  - Stats' shinobi face: 上忍 "Jōnin · 5 years of training", 40+ "S-rank missions cleared", 98% "Chakra control" with a chakra meter that fills on each reveal (kanji 位 任 気). Phones: Jōnin / S-rank / Chakra.
- **AHMAD wordmark:** its clipped 90px text-shadow was removed (it caused hard-edged rectangles).
- **Background:** `var(--grad-deep)`.

### Hero page entrance
- `src/components/ui/page-ready.ts`: `usePageReady()` is true once the first-visit preloader has lifted and no transition overlay is active.
  - The preloader sets `html[data-preloader="on"]` while showing and fires `app:preloader-done`.
- One GSAP timeline in `LandoAboutHero.tsx` ("Page entrance" comment):
  - 0.00s background settles · 0.10s portrait unveils bottom-up (clip-path) · 0.35s AHMAD rises letter by letter · 0.80s left column eyebrow line and words · 0.95s stats rise and count up · 1.25s client proof (faces, then stars) · 1.40s quote. Phones get their own rows.
- `data-intro-state`: `pending` → `running` → `done`. The quote's reading clock is paused while pending. 6-second fallback, `<noscript>` style, simple fade for reduced motion.
- `src/components/ui/RevealText.tsx` splits text into masked words (`.rw` / `.rw-i`).
- `HeadingReveal` has a `manual` prop so a parent timeline can drive its letters (`.hr-reveal-char`).
- Old CSS entrance timers removed (`hero-wordmark-enter`, `hero-portrait-enter`, `.hs-in`, mobile-line animations). The `HeroAside` count-up moved into the hero timeline.
- Fixed: `.hs-eyebrow span` also styled the word spans; now `.hs-eyebrow > span:not(.rw)`.
- `.hs-stat` and `.hs-m__stats` containers fade in (opacity 0 → 1) so their dividers don't show before the numbers.

### Gradients (`globals.css` `:root`, OKLCH from the theme)
- `--grad-signature` + `--grad-signature-light`: Tech Stack stage.
- `--grad-deep` + `--grad-deep-light`: hero background and footer (`.ftr`); white text contrast at least 5.6:1.
- `--grad-soft` + `--grad-soft-light`: via `.sec-gradient` on About; its `::before` fades into navy at top and bottom so there are no seams.

### Tech Stack (`TechStackSection.tsx`, `tech-stack-icons.ts`)
- Recreates the "Footballs in Motion / Attractor" reference in three.js with custom physics: attractor inside a solid glass bubble that trails the cursor, friction and spin, fixed 120Hz step, loop sleeps at rest or off-screen.
- Truncated-icosahedron football shader (royal pentagons, ice hexagons) with Simple Icons logos (CC0) in the pentagons.
- 23 tools (phones show 14). Hover chip shows the tool's name and kind. Copy differs for touch and mouse.

### Work (`WorkSection.tsx`)
- Stacked cards (`SINK = 0.035` per covered sheet). Each card has a tab, name, kind, year, role, stack, summary and either a screenshot cover or a drawn poster cover (`mark` word + `accent`).
- Shows the first four projects from `src/data/projects.ts` (the pill colour is each project's `accent`).
- Clicking a card's preview or "View project" zooms the preview into that project's page (section 5b).

### Testimonials (`TestimonialsSection.tsx` + `ui/testimonials-columns-1.tsx`)
- From the 21st.dev "testimonials-columns-1" component (uses the `motion` package, pinned to `~13.2.0` to match `framer-motion`). On every page except `/` (the nav page), `/story` and `/projects`: `/home`, `/contact`, `/privacy`, `/terms`, `/thank-you`, always right before the footer.
- Eyebrow, "WHAT CLIENTS SAY" (`HeadingReveal`), one-line intro; then columns of cards drifting upwards forever, faded at the top and bottom. One column on phones, two from 768px, three from 1024px; every layout shows every review (dealt round robin).
- A column holds while hovered, pauses off screen, and stays still with reduced motion. Cards: stars, quote, avatar, name, role (hairline border, no shadow or glow).
- `background` prop matches the page it sits on (navy on `/home`, royal elsewhere); it is opaque because the footer curtain sits beneath. `id="reviews"` is the hero's "client reviews" link target.
- Data: `src/data/reviews.ts` (shared with the hero); illustrated SVG avatars in `public/reviews/*.svg`. Samples are filtered out in production, and the section hides when none are left.
- CSS: `.tm-*` in `globals.css`, just before the footer styles.

### Performance
- No per-frame layout reads; loops sleep when idle; `AnimationGovernor` pauses off-screen CSS animations; the liquid reveal's idle sleep is counted in frames so it can't freeze half-open at low frame rates.

### Removed at the client's request
- "Tsukuyomi / under my genjutsu" screen takeover (and its reveal "burst" event).
- Flame section separators (metaball and Worley versions; `SectionFlame.tsx` deleted).
- Tech Stack v1 (2D DOM balls).
- Reviews infinite marquee tape.
- Reviews featured-quote section (`ReviewsSection.tsx`, `.rv-*` CSS), replaced by the testimonials columns.

---

## 5. Projects page (`/projects`)

The page is only `ProjectsWorld`: the dive, then an endless carousel. The client asked (2026-09-29) for nothing under it, so the case studies, testimonials and footer were taken off this page. All project content is **dummy** until the client sends the real details.

### Files
- `src/app/projects/page.tsx`: the page (just `ProjectsWorld`).
- `src/components/sections/ProjectsWorld.tsx`: one pinned stage; the intro is one scrubbed GSAP timeline (1 beat = 85vh), then the carousel follows the scroll directly.
- `src/components/ui/scroll-expansion-hero.tsx`: `ScrollExpandMedia`, adapted from the 21st.dev component. The original hijacked the wheel and forced `scrollTo(0,0)` (fights Lenis, breaks keyboard/scrollbar), so this version has no scroll code: the parent timeline drives it through a ref handle (`expand`, `dive`, `intro`, `hide`, `video`). With no `bgImageSrc` the backdrop is `--grad-deep`.
- `src/components/sections/projects-helix.ts`: the three.js scene (`ProjectHelix`), reads a shared `HelixState` (`dolly`, `spin`, `cards`, `offset`) every frame.
- `src/app/dev/world-loop/page.tsx`: **dev only** (404 in production). Draws the world's idle loop for recording the opening video.
- `src/data/projects.ts`: the shared project list (6 projects, used by the home Work section too) plus a `caseStudy` for every project (shown on its project page, section 5b), `accent`, and `projectPath(slug)`.
- CSS: `.sx-*`, `.pw-*` near the end of `globals.css`.
- Media: `public/projects/world-loop.dat` (an MP4: 10s seamless loop, 1920×816, 1.26 MB) + `world-loop-poster.webp`; project screenshots as full-size WebP.
- **No "download this video" pop-ups:** download managers (IDM's browser extension) watch for video requests and offer to download them. `ScrollExpandMedia` therefore fetches the video as plain data and plays it from a blob URL (`mediaMime` gives its real type), and the file is named `.dat` (served as `application/octet-stream`, not on IDM's list), so the page never requests a video. If the fetch fails it falls back to loading the file directly.

### The opening video lines up with the 3D world
- The video is a recording of the world's own idle loop: dust and light streaks rushing towards a speck of the logo, which turns once per loop (`LOOP_SECONDS` = 10).
- Everything in that loop is deterministic (seeded dust, flow and turn on one clock), and `ProjectHelix.syncLoop(t)` sets the scene to any time in it. While the video shows, the page syncs the live scene to `video.currentTime` every frame, then dissolves the video: the frames match, so the hand-off is invisible.
- The backdrop and vignette are sized in `cqh` (the stage is a size container) and the video covers the screen by height, so the video and the live scene match at any aspect up to 2.35:1. Before the dive the world is centred with the desktop logo size on every screen (narrow screens lift and resize the logo as the camera lands), so phones match too.
- **To re-record after changing the idle scene:** with the dev server running, `OUT=loop node --experimental-websocket cdp.mjs 1920 816 plan_loop.mjs` (captures 300 PNGs via `window.__worldLoop(t)`), then `ffmpeg -framerate 30 -i loop/f_%04d.png -c:v libx264 -preset slow -crf 23 -tune film -pix_fmt yuv420p -movflags +faststart -an public/projects/world-loop.mp4`, then rename it to `world-loop.dat` (see above), and a poster from frame 0.

### The intro (timeline beats)
1. **0 – 1.0 Expand:** a portrait window (the loop video, a portal into the world) over the deep gradient; "ENTER / MY WORLD" splits apart as the window opens to full screen (clip-path, no layout).
2. **~1.0 Lede:** "Every build here started as someone's idea. Here is what they became."
3. **1.15 – 1.55 Hand-off:** the lede leaves; the video dissolves into the live world (synced).
4. **1.55 – 2.6 Logo:** the camera falls from z=240 to rest; the logo grows from a speck to ~25% of the viewport, spinning in; the streaks fade as it lands.
5. **2.35 – 3.3 Cards:** 30 cards (the 6 projects repeated) rush in from behind the camera onto the helix, nearest first.
6. **3.05 HUD:** the top row and captions fade up.
7. **3.4 → Carousel** (below). The old exit (flying through the logo into the case studies) was removed.

### The endless carousel
- **Scroll moves the cards in whole steps.** One step (`STEP_VH` = 30% of the viewport height of scroll) moves every card one place along the helix. Wheel and trackpad input is caught before Lenis (`lenisStopPropagation`) and added up: the first ~30% of a step already commits, so one notch moves one card, five quick notches about three, a trackpad fling many. A 500ms pause ends a gesture. Each step is eased by Lenis (`scrollTo`, expo-out, 1.1s). Arrow keys move one card; Page Up/Down and Space two. Touch, the scrollbar and native scrolling settle on the nearest stop (leaning the way they were going) once they stop.
- **It never ends.** After the intro the page has `LOOPS` = 4 loops of scroll room (a loop = one step per project). Whenever the scroll is two loops in, it jumps back one loop; the carousel repeats every loop, so the jump is invisible. Mid-flight it shifts Lenis's running animation (`animatedScroll`, `targetScroll` and the internal `animate` from/to/value), so momentum carries on; at rest it jumps with `scrollTo(..., { immediate })`. Scrolling up turns the carousel back and then replays the intro.
- **Four in front.** At every stop (`offset` = whole number + `REST_PHASE` 0.5) four cards stand in front of the helix in full colour, facing the viewer:
  - Wide screens (aspect ≥ 1.15): a gently slanted row, two either side of the logo (card width sized to the screen, up to 3.2 units).
  - Narrow screens: a column under the logo, swinging left and right like the helix seen head-on, captions beside the cards.
  - Cards blend between their helix pose and their front place over one step (`frontWeight`), so each step the front hands one card back to the helix and takes the next one out of it. A card passing over the logo turns to glass.
- **Clickable.** Hovering a front card lifts it (forward, 4.5% larger) and underlines its caption in mint; clicking the card or its caption opens the project with the image-to-background zoom (`cardRect` → `useOpenProject`). Cards on the helix behind are not clickable.
- **HUD:** "Selected work" + one tick per project (the four in front lit) + "06 projects"; captions (index, kind, title) follow their cards every frame (`frontCards`); "Scroll" hint on desktop. A screen-reader list links every project page.
- The logo turns half a turn per step and follows the pointer a little; the scene renders only while on screen.

### The 3D scene
- **Logo:** `LOGO_LEGS` from `Logo.tsx`, extruded with a bevel, in metallic ice (clearcoat, RoomEnvironment reflections). No cursor crossbar in 3D: the blinking mint bar was removed at the client's request (2026-09-29); the opening video `world-loop.dat` was recorded with it, but the logo is only a speck there, so the hand-off still matches (re-record to be exact). Rests at a slight three-quarter turn. The idle turn unwinds during the dive so it always settles in the same pose.
- **Helix:** cards on a vertical cylinder facing outwards (wide: 12 per turn; narrow: 9 per turn, rising at the column's pitch), dimmed into the ink by depth.
- **Dust + streaks:** 1,100 motes and 260 light streaks in a tunnel along the line of the dive, wrapping on one shared phase (in the shader). Streaks show only while diving.
- Rounded corners, cover crop anchored to the top of each screenshot, un-mirrored back faces and a hairline edge are all in the card shader.

### Reduced motion
- The media intro is skipped; the page opens on the carousel, and scroll still steps through it (instantly).

### Open questions for the client
- Real details for each project (year, role, stack, summary), live URLs.

## 5b. Project pages (`/projects/[slug]`)

### Files
- `src/app/projects/[slug]/page.tsx`: server page (static params, per-project metadata); renders `ProjectDetail` + `CinematicFooter`.
- `src/components/sections/ProjectDetail.tsx`: the whole page, charts included (plain SVG/CSS, animated with GSAP).
- `src/components/ui/project-transition.ts`: the image-to-background zoom (`useOpenProject`, `peekArrival`, `finishArrival`). In development it also exposes `window.__gsap` so the test harness can slow animations down.
- `src/data/projects.ts` → `caseStudy`: **DUMMY** case study for every project (client, brief, what was built, three outcome figures, two close-ups cut from the cover by `position` + `zoom`). Required by the type, so a new project needs one.
- `src/data/project-details.ts`: **DUMMY** long-read data for every project (headline figures, Lighthouse scores, problem + drop-off funnel, challenge + difficulty + constraints, process phases with weeks and hours, before/after table, monthly trend, client review).
- CSS: `.ptx*` and `.pd-*` in `globals.css`, just before the footer styles; the case study's pieces are `.cs-*` ("Case study pieces", after the `.pw-*` block).

### The zoom (from the reference video "image-to-background-zoom")
- Opened from: home Work cards, the four front cards (or their captions) of the `/projects` carousel, and the scroll-to-next panel after every project page's footer.
- An overlay copy of the clicked image starts exactly over it (its visible box, corner radius, object-position; for the 3D card, its projected box and the shader's 6% radius) and grows to the full viewport in 1.1s while the corners square off; the page behind sinks into ink and the hero's shade settles over the image. At 0.6s, with the old page hidden, the router swaps pages. The project page paints its hero identical to the overlay's last frame, waits for its image, then the overlay fades (0.3s) while the hero text reveals. A 9s safety (on GSAP's clock) clears the overlay if the page never takes over.
- Direct visits (link, reload): the image appears as a small rounded tile in the middle of an ink screen and zooms out to fill it (clip-path + scale), as in the reference; then the text reveals.
- Hero entrance: the background softens (blur 6px, scale 1.05) as the title rises letter by letter, the summary rises line by line, and the four headline figures count up. The blur stops screenshot text competing with the title.
- Reduced motion: no zoom or intro; the page opens at rest.

### Sections
1. **Hero** over the image: "All projects" link, case number, kind · year, title, summary, "Visit live site" (when `href`), four headline figures.
2. **00 At a glance** (still over the image, which darkens and slowly scales as you scroll): essentials (client, timeline, role, team, services, stack), time it took (weeks, hours, hours-by-phase bar + legend), Lighthouse score rings, the problem it solved + three result figures.
3. **01 The case study** slides up over the image (rounded top, navy): "The short version" in three columns (A The brief, B What I built with mint dashes, C The outcome with figures that count up), then two close-ups cut from the screenshot that drift at different speeds. Moved here from `/projects` on 2026-09-29.
4. **02 The problem** (ink): statement, "where visitors dropped off" funnel bars, three pain figures.
5. **03 The challenge**: statement, hard parts with 5-step difficulty meters, constraints table.
6. **04 The process**: week-by-week Gantt chart drawn as you scroll (bars labelled with hours), phase cards with deliverables.
7. **05 The result**: the screenshot unfolding in a browser frame, statement, three big figures, before/after table (with change pills and mini bars; cards on phones), monthly trend chart with launch marked.
8. **06 In their words**: the project's client review (dummy).
9. **Testimonials** (the shared section), footer, then **scroll to the next project** (`NextPage` in the route's `page.tsx`): the next cover rises over the footer, the ring draws, and it opens with the same zoom. Replaced the old "Next project" card (`.pd-next*` removed).

## 6. Next steps (in order)

1. **Projects page content:** swap the dummy project details, case studies (`caseStudy` in `src/data/projects.ts`) and project-page data (`src/data/project-details.ts`) for real ones when the client sends them.
2. **Verify the latest hero entrance tweak:** record the entrance on desktop and phone; confirm the stat dividers fade in with their numbers. Test in a production build (`npm run build && npm start`); in dev, hydration delays the start by about 3–4s.
3. **Full home-page bug check** (requested by the client, not started). Known lead:
   - `Navbar.tsx` calls `gsap.defaults({ ease: "kn-main", duration: 0.7 })`, which changes GSAP defaults for every tween on the site. Scope it to the navbar's own timelines.
   - Also check: every section at 1440×900 and 390×844; console errors and horizontal overflow; Lenis anchor links; the footer curtain; reduced-motion paths; `/` → `/home` through the transition overlay (the entrance must wait for it).
4. **Push `master`** to GitHub (`git push origin master`); it is ahead of `origin`.

---

## 7. Known issues

- `Navbar.tsx` sets global GSAP defaults (see step 3 above).
- Project page heroes use desktop screenshots; on phones the cover crop shows a zoomed part of the screenshot (softened by the hero blur). Portrait crops per project would look better.
- In dev, the first visit to a project page compiles the route; the overlay holds on the full image until the page arrives (up to 9s). Production is near-instant.
- Screens wider than 2.35:1 would see a small size mismatch at the video hand-off (the video then covers by width).

---

## 8. Needs the client's input

- **Stats:** hero figures are placeholders (5+ years, 40+ projects, 98 Lighthouse); `STATS` in `HeroAside.tsx`.
- **Reviews:** samples; real reviews with permission and photos go in `src/data/reviews.ts`.
- **Projects:** real projects for the Work section and `/projects` (section 5), and real figures, stories, a case study (brief, what was built, outcomes, close-ups) and a client review for each project page (section 5b).
- **Tech Stack list:** confirm it, especially JavaScript, HTML and CSS (added to fill out the cluster). Lenis has no icon and shows its name.

---

## 9. Testing notes

- The in-app browser pane freezes requestAnimationFrame while hidden, so GSAP/WebGL can't be checked there. A headless Chrome harness (`cdp.mjs` + `plan_walk.mjs`, session scratchpad) was rebuilt on 2026-09-28: `OUT=dir BEATS="0,1.3,3.4" node --experimental-websocket cdp.mjs 1440 900 plan_walk.mjs [mobile]` captures frames at scroll beats. Screenshot clips must use the current `scrollY`. Other plans: `plan_home.mjs` (home page at scroll stops), `plan_case.mjs` (`SLUG=... ` films a project page's case study), `plan_car.mjs` (drives the `/projects` carousel with real wheel events), `plan_loop.mjs` (records the loop video frames). The harness runs `node --experimental-websocket cdp.mjs <w> <h> <plan.mjs> [mobile]` and deletes its temporary Chrome profile after each run (earlier runs had left 240 profiles and filled C: to 99%).
- Start of a test: set `sessionStorage.app_loaded = "true"` to skip the first-visit preloader.
- Waiting for the entrance: wait for `[data-intro-state]` to become `done`.
- Headless has no GPU, so WebGL runs at about 30fps; keep at most about 8 WebGL canvases on a test page (Chrome drops older contexts beyond about 16).
- Shell editing: bash heredocs with quotes or backticks fail; write Python edit scripts to a file first, then run them.
- Git Bash rewrites env values that start with `/` into Windows paths; prefix runs with `MSYS_NO_PATHCONV=1`.
- Project pages: `OUT=dir SLUG=ard-al-khair node --experimental-websocket cdp.mjs 1440 900 plan_pd.mjs [mobile]` films the direct-visit intro and walks the page. `OUT=dir FROM=home|cs|helix SLOW=10 node ... plan_click.mjs` clicks a project image and films the zoom with GSAP slowed 10× (via `window.__gsap`).

---

## 10. Changelog

Newest first. One line per change: date, what changed, files touched.

### 2026-09-29
- Stopped download managers (IDM's "download this video" panel) from offering the `/projects` opening video: `ScrollExpandMedia` now fetches it as data and plays it from a blob URL, and the file is renamed `world-loop.mp4` → `world-loop.dat`. Checked in headless Chrome: the video plays (10s, from `blob:`), the only request is the `.dat` as `application/octet-stream`, and the intro and carousel look as before. Not testable here with IDM itself.
- Removed the blinking mint cursor bar from the 3D logo on `/projects` (`projects-helix.ts`). The flat logo (navbar, footer, icon) keeps its cursor.
- Footer heading "Have an idea? Let's build it." vanished on some pages in real Chrome (GPU): gradient text (`background-clip: text`) on a transformed line inside the fixed, clipped footer layer. Now solid ice with a mint full stop (`.ftr-title__line > span`). Checked all pages with a footer in headless Chrome: heading, fades and giant word reveal on each (`plan_ftr.mjs`).
- Scroll to the next page (from the reference video): new `NextPage` (`src/components/ui/next-page.tsx`, `.np-*` CSS). After the footer, the next page's panel rises, pins while a ring draws round its name, then opens it (projects with the image zoom, pages with a picture hand-off). Added to `/` → `/home`, `/home` → `/projects`, every project → the next (looping), `/contact` → `/story`. Replaced the project pages' "Next project" card. `ZoomSource` gained `shade`; `usePageReady` waits for the hand-off. Verified MAB Portfolio → Interactive CV and HRA Studio → MAB Portfolio in headless Chrome (`plan_next.mjs`); typecheck clean. The page-to-page hand-offs (`/` → Home → Projects, Contact → Story) are not filmed yet.
- Scroll-to-next fixes: the panel's picture was blank after a fast scroll to the end (it lazy-loaded too late), now loads eagerly. The ring's white arc glitched and ran ahead of its dot (`pathLength` + `vector-effect: non-scaling-stroke` break the dash in Chrome); now the dash is the ring's real circumference, tweened as an attribute, with strokes in the ring's own units. Checked: arc and dot agree at every step (13% … 80%).
- Committed the whole working tree on `master` (`f9d93fe`, 148 files). Not pushed.
- Case studies moved onto the project pages: each `/projects/[slug]` page now has "01 The case study" after At a glance (brief, what I built, outcome figures that count up, two drifting close-ups), sliding up over the image; the later sections are renumbered 02–06 and their backgrounds still alternate (problem now ink). Wrote DUMMY case studies for MAB Portfolio, Interactive CV and Facebook Clone, so all 6 have one (`caseStudy` is now required). Deleted `CaseStudies.tsx` and its unused `.cs-*` styles (kept the pieces the pages use). Files: `ProjectDetail.tsx`, `projects.ts`, `projects/[slug]/page.tsx`, `globals.css`. Verified at 1440×900 and 390×844 (no overflow, numbers count, close-ups load); typecheck clean.
- `/projects` carousel made endless and scroll-stepped (client request): wheel/trackpad/keys move the cards in whole steps (a bigger scroll moves more), and every scroll settles with four cards in front in full colour, clickable, with captions (a row either side of the logo on wide screens, a winding column on narrow ones). The page wraps back one loop invisibly, so the scroll never ends; Lenis eases every step. Removed the single reading slot, the info panel, the number rail, the exit through the logo, and the case studies, testimonials and footer from `/projects`. Files: `ProjectsWorld.tsx`, `projects-helix.ts`, `projects/page.tsx`, `dev/world-loop/page.tsx`, `.pw-*` CSS. Verified in headless Chrome at 1440×900 (1 notch = 1 card, 5 notches = 3, a long fling wraps mid-flight and lands on a stop, hover + click targets, scrolling up returns to the intro), 390×844 and 768×1024; typecheck clean.
- Hero genjutsu hover rebuilt (`genjutsu-reveal.tsx`, `.gj*` CSS): the torn SVG-noise brush (stuttered, mixed both faces) replaced by a smooth circular ripple with crimson hairline rings, on CSS masks. Stats got a real Naruto face (上忍 rank, S-rank missions, chakra meter) in `HeroAside.tsx`. Verified on `/home` at 1440×900 (faces never overlap); typecheck clean.
- Built project pages at `/projects/[slug]` (`ProjectDetail.tsx`, `project-details.ts` dummy data, `.pd-*` CSS) with the image-to-background zoom (`project-transition.ts`, `.ptx*`) from the reference video: home Work cards, the `/projects` helix (slot card, "View project", other cards turn to theirs), case studies ("Read the full case study") and "Next project" all open with it. Direct visits zoom out from a centred tile. Sections: hero figures, at a glance (facts, time + hours bar, Lighthouse rings, results), problem (funnel), challenge (difficulty meters, constraints), process (Gantt), result (before/after table, trend chart), client review, testimonials, next project, footer. `WorkSection` now uses `src/data/projects.ts` (first four) and its unused poster styles were removed; added `accent` + `projectPath` to the data; project pages added to the sitemap. Verified at 1440×900 and 390×844 (no overflow, zoom filmed from all three entry points); typecheck clean.
- Removed the old reviews section (`ReviewsSection.tsx`, `.rv-*` CSS) from `/home`. Added `TestimonialsSection` (21st.dev testimonials-columns-1 on `motion`, restyled to the theme) to `/home`, `/projects`, `/contact`, `/privacy`, `/terms` and `/thank-you`, before the footer. Skipped `/` (nav page) and `/story` (ends by redirecting). Installed `motion@~13.2.0`. Verified at 1440×900 and 390×844: no overflow, columns drift; typecheck clean.

### 2026-09-28
- Set up Geist + Geist Mono site-wide (`layout.tsx`, next/font); fixes headings falling back to a serif. Home page checked at 1440×900: no overflow.
- `/projects` opening: replaced the screenshot reel with `world-loop.mp4`, a recording of the 3D world's own idle loop; the live scene syncs to the video's time for an invisible hand-off. Added seeded dust + light streaks, the dev-only `/dev/world-loop` recorder, a `cqh`-sized backdrop/vignette, the gradient backdrop behind the window, and a plain ice title. Removed the old reel/poster/backdrop files.
- `/projects` exit: the cards fly out and the camera flies through the logo's counter into ink (`through` state, `.pw-fade`).
- Built the case studies (`CaseStudies.tsx`, `.cs-*` CSS, dummy `caseStudy` data for 3 projects). Screenshots re-encoded at full size. Verified at 1440×900 and 390×844; typecheck clean.
- Built `/projects` part 1: `ScrollExpandMedia` (`src/components/ui/scroll-expansion-hero.tsx`, GSAP-driven rewrite of the 21st.dev component), `ProjectsWorld` + `projects-helix.ts` (3D logo, project helix, dust, HUD, rail), shared `src/data/projects.ts`, `.sx-*`/`.pw-*` CSS, WebP screenshots + reel/poster/backdrop in `public/projects/`. Old placeholder page replaced. Verified at 1440×900 and 390×844 in headless Chrome; typecheck clean.
- Created `PROGRESS.md` as the living progress log, merging everything from `plan.md` and adding the site map, the projects-page audit and plan, and this changelog.

### Before 2026-09-28 (from `plan.md`)
- Hero page entrance rebuilt as one GSAP timeline gated on `usePageReady()`; stat containers now fade in.
- Tech Stack rebuilt in three.js with 3D footballs and attractor physics (v1 removed).
- Reviews redesigned (featured quote, index, progress line); marquee removed.
- Gradient tokens added (`--grad-signature`, `--grad-deep`, `--grad-soft`) and applied.
- Genjutsu hover faces added to the hero side blocks.
- Logo, `CinematicFooter`, and Work cards built.
- Tsukuyomi takeover and flame separators removed at the client's request.
- Performance pass: idle-sleeping loops, `AnimationGovernor`, frame-counted reveal sleep.
- `/about` moved to `/home`; `/nav` and many old components deleted.
