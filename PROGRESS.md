# Portfolio progress log

The living record of Ahmad Barkat's portfolio. **It is updated after every change to the site**: add a dated line to the changelog (section 10) and update any section the change affects. It replaces `plan.md` as the source of truth; `plan.md` is kept only as the original handover.

- **Project:** `D:\Ahmad Updated Portfolio\Ahmad_Portfolio`
- **Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind 3, GSAP (ScrollTrigger, useGSAP), Lenis, three.js, motion.
- **Dev server:** `npm run dev` on http://localhost:3000. Keep it running while working.
- **Last updated:** 2026-10-08

---

## 1. Current status

| Area | Status |
|---|---|
| Home page (`/home`) | Built. Needs a full bug check (section 7). |
| Hero entrance | Built. Last tweak (stat dividers fade in) not yet re-recorded. |
| Projects page (`/projects`) | Built: "Enter my world" (seamless loop video → 3D logo + project helix), then an endless scroll-driven carousel with four clickable cards in front (section 5). Nothing below it. All project content is dummy. |
| Project pages (`/projects/[slug]`) | Built for all 7 projects: image-to-background zoom from any project image, then glance, case study, problem, challenge, process, result, client review, testimonials, footer, scroll to the next project (section 5b). All figures are dummy. |
| Contact page (`/contact`) | Rebuilt 2026-09-30: hero, project brief form (Formspree), direct channels, FAQ (section 5c). Form sends through Formspree (form `mvkgldyb`). Budgets, reply time and FAQ figures are placeholders. |
| Hire page (`/hire`) | Built 2026-10-02 for recruiters and AI assistants (section 5d). Education, languages, CV file still missing. |
| Real content | Stats, reviews and projects are still placeholders (section 8). |
| Font | Geist (sans) + Geist Mono via `next/font/google` in `layout.tsx`, as `--font-sans` / `--font-mono`. Site-wide. |
| Typecheck | `npx tsc --noEmit -p .` clean as of the last handover. |
| Git | Everything committed and pushed to `origin/master` (latest: `6fe9b75`, 2026-09-29). Contact page rebuild not committed yet. |

---

## 2. Standing rules from the client

- **Quality bar.** Modern, professional, elegant, smooth and responsive. Nothing may look "vibe coded" or AI-built.
- **No glows.** No glowing circles, glow shadows or neon halos anywhere.
- **One button style and one link style, site-wide.**
  - Buttons: `ButtonWithIcon` (`src/components/ui/button-with-icon.tsx`).
  - One exception, at the client's request (2026-09-30): the contact form's send button (`SendButton` in `src/components/ui/send-flight.tsx`, `.snd*` CSS), a light pill with a mint hover sweep and a royal puck holding a paper plane.
  - Links: the `.ftr-link` style with `TextRoll` inside (see the footer and `HeroAside`).
  - The letter roll is set off by the whole box, not just the letters (client, 2026-09-30): hovering or focusing any `.ftr-link` (icon included), any ancestor marked `data-roll` (the nav page's rectangles, the menu rows), or a contact channel card (its main link only) rolls the label. `TextRoll` is pure CSS now (`.troll*` in globals.css, just before the link style); mark a new clickable box with `data-roll` to make it roll its label.
  - **Accessibility (2026-10-01):** `TextRoll` now hides both letter rows (`aria-hidden`) and gives the label once in a `.sr-only` span, so screen readers and search engines read the whole word, not letter by letter.
- **Palette.** Ink `#041B3F`, navy `#072A5E`, royal `#0B3D91`, sky `#3BA7F2`, mint `#7FE7D6`, ice `#E8F6FF`. Crimson `#e3263a` only for the anime "genjutsu" accents.
- **Anime theme.** Sharingan, Naruto, genjutsu, used as a tasteful accent (hover faces, the dragon, keywords), never as the whole design.
- **Placeholder data** is marked in code and must be replaced before launch.
- **One hover reveal.** Every genjutsu hover uses the dragon's torn brush (`genjutsu-reveal.tsx`), so the hover effects feel connected. Do not replace it with a different mask.

---

## 3. Site map

| Route | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page with its own loader (`WillemLoader`). Scroll past the menu → Home (`NextPage`). |
| `/home` | `src/app/home/page.tsx` | The main home page (was `/about`). After the footer: scroll on → Projects (`NextPage`). |
| `/projects` | `src/app/projects/page.tsx` | "Enter my world" dive into the endless project carousel. Nothing else: no case studies, testimonials or footer (client request, 2026-09-29). |
| `/projects/[slug]` | `src/app/projects/[slug]/page.tsx` | One page per project (`ProjectDetail`), statically generated for the 6 slugs; in the sitemap. |
| `/contact` | `src/app/contact/page.tsx` | Contact page (`ContactView`, section 5c), testimonials, footer; then scroll on → Home (`NextPage`). |
| `/hire` | `src/app/hire/page.tsx` | "Hire me" page (`HireView`, section 5d). In the sitemap and the footer's Explore list. |
| `/llms.txt` | `src/app/llms.txt/route.ts` | Plain-text brief for AI assistants, generated from `src/data/profile.ts`. |
| `/privacy`, `/terms` | `src/app/*/page.tsx` | Legal pages, each with testimonials before the footer. |
| 404 | `src/app/not-found.tsx` | |

`sitemap.ts` lists `/`, `/home`, `/projects`, `/contact`, `/privacy`, `/terms` on `https://ahmadbarkat.dev`.

**Global pieces in `layout.tsx`:**

- `TransitionProvider`: expanding-rectangle page transition; exposes `isTransitioning` and `transitionTo()`.
- `GlobalPreloader`: first-visit loader, shown once per session via `sessionStorage.app_loaded`.
- `AnimationGovernor`: pauses CSS animations inside off-screen sections via `[data-offscreen]`.
- `LenisProvider`, `Navbar`, `Analytics`.
- `MailFab` (`src/components/ui/mail-fab.tsx`, `.mail-fab*` CSS): a round ice mail button fixed bottom right on every page (client, 2026-10-03: not every visitor has WhatsApp or Messenger). Opens `mailto:` to `QUICK_EMAIL` (`code.by.ahmad.dev@gmail.com`, in `src/data/contact.ts`) with the subject "Hello Ahmad". Fades in once `usePageReady()` is true; label slides out on hover (mouse only); sits above the page frame, below the menu and toast.
- **Menu** (`Navbar.tsx`, `.kn-*` CSS): the hamburger opens a panel from the right (three coloured layers slide in, then the links). It has its own round close button (same bars as the hamburger's cross) and an "Esc to close" hint on desktop only. While open, Lenis is stopped so the page behind stays still; focus moves to the close button and returns to the hamburger on close. Note: the CSS parks the layers at `translateX(101%)`, which GSAP reads as a pixel `x`, so the open tween sets `x: 0` as well as `xPercent`.

**Scroll to the next page (`src/components/ui/next-page.tsx`, `.np-*` CSS at the end of `globals.css`):**

- From the reference video `scroll-to-next-page.mp4`. At the end of a page (after the footer), a full-screen panel of the next page rises over it: its picture, "Next page"/"Next project", the name in a thin ring, "Keep scrolling". The panel pins for one viewport of scroll while the ring draws closed (ice arc, mint leading dot); when it closes, the next page takes over from the panel's picture.
- Projects: the image-to-background zoom (`useOpenProject` with a full-screen source and `shade: 1`), so the next project's hero is the identical frame. Pages: a copy of the panel's picture covers the screen (`.np-handoff`, `html[data-handoff="on"]`) while the router swaps pages, then fades as the new page runs its entrance (`usePageReady` waits for `HANDOFF_DONE_EVENT`).
- Clicking the panel goes straight there. Reduced motion: a plain link, never moves on by itself.
- Chain: `/` → `/home` → `/projects`; `/contact` → `/home` (the home page panel rises after the footer). Not on the legal pages.

---

## 4. Home page (`src/app/home/page.tsx`)

1. **Hero:** `LandoAboutHero` + `HeroAside`.
2. **About:** `AboutMeSection` (the crimson dragon with the liquid reveal).
3. **Why I build:** `WhyIBuildSection` (`src/components/sections/WhyIBuildSection.tsx`, `.wb-*` CSS, `id="why"`).
4. **Services:** `ServicesSection`.
5. **Process:** `ProcessSection` (pinned road map).
6. **Tech Stack:** `TechStackSection` (3D footballs).
7. **Work:** `WorkSection` (stacked project cards).
8. **Testimonials:** `TestimonialsSection` (shared, see below).
9. **Footer:** `CinematicFooter` (`src/components/ui/motion-footer.tsx`), a curtain reveal.

### Footer
- `CinematicFooter` is on every page except `/projects` (whose carousel never ends). Services marquee, "Have an idea? Let's build it." call to action, logo and status line. Its email link reads "Write me an email"; "Elsewhere" lists WhatsApp, LinkedIn and GitHub (all from `src/data/contact.ts`).

### Logo (`src/components/ui/Logo.tsx`)
- `LogoMark` / `LogoLockup`: an "A" whose crossbar is a text cursor.
- Used in the navbar centre, the menu, the footer, `src/app/icon.svg` and the OpenGraph image.

### Hero (`LandoAboutHero.tsx`, `HeroAside.tsx`)
- **Portrait:** WebGL liquid-mask reveal (`liquid-mask-reveal.tsx`) between `/hero-base-cutout.webp` and `/hero-hover-cutout.webp`.
  - Uses the dragon's reveal settings (`DRAGON_REVEAL` in `src/components/ui/reveal-presets.ts`).
  - Brush size matched in px to the dragon (`useDragonMetrics`); noise scaled by width.
- **Side columns (desktop):** intro statement; client proof (avatars, stars, "N client reviews" link); stats (Year / Projects / Reply); rotating client quote with word-by-word `ReadingText`.
- **Phones:** a stats row (Year / Projects / Reply), a proof pill, and the offer line "I design and build fast, memorable websites and web apps for growing businesses."
- **Genjutsu hover faces** (`src/components/ui/genjutsu-reveal.tsx`): each side block has a hidden anime "alt face".
  - Hover paints with the dragon's brush (the same reveal as the About dragon and the portrait): soft ink discs trail the pointer, torn by drifting fractal noise with the dragon shader's constants (`DRAGON_REVEAL`, brush size from `useDragonBrushPx`), and shred away behind it. The normal face takes the exact complement of the mask, so one face tears into the other with nothing between them. SVG masks (`feTurbulence` + arithmetic composite).
  - Restored on 2026-09-30 at the client's request: a 2026-09-29 rebuild had replaced it with a plain circle + crimson rings, which broke the link with the dragon. The old version was never committed; it was recovered from that session's transcript. Keep this brush.
  - Touch: a tap spreads ink out from the finger across the block, which then shreds away. Reduced motion: instant swap.
  - Stats' shinobi face: 中忍 "Chūnin · 1 year of training" (Year), "Missions cleared in 2026" (Projects), "Chakra on standby" with a chakra meter at 86 (Reply time 24h). Kanji 位 任 気 fill on each reveal. Phones: Year / Projects / Reply.
- **AHMAD wordmark:** its clipped 90px text-shadow was removed (it caused hard-edged rectangles).
- **Background:** `var(--grad-deep)`.
- **Offer line (desktop):** "I design and build fast, memorable websites and web apps for growing businesses." (was "Websites that feel as considered as the brands behind them.")

### About (`AboutMeSection.tsx`)
- Rewritten in a professional voice (2026-10-01): "HI, I'M AHMAD." heading (was "I AM STILL ALIVE."), "FULL-STACK DEVELOPER · WORKING WORLDWIDE" badge, bio about designing and building websites and web apps for startups and growing businesses (six projects shipped over the past year), "You work with one person the whole way through…" paragraph, plain-words stack description, and badges for Speciality / Core stack / Hours (UTC+5, overlaps UK, EU & Gulf) / Replies. Buttons: "START A PROJECT" and "SEE MY WORK" (were "SUMMON ME TO WORK" and "EXPLORE MY JUTSU").
- Dragon, layout and animations unchanged.

### Genjutsu hover faces continued
- The noise is a 256px tile; the filter region always reaches back to the tile under the trail's top-left corner (tile grid drifts with the noise). Before 2026-09-30 the tile sat fixed at the block's top-left, so on anything taller or wider than 256px (the contact kanji) the ink showed as hard-edged rectangles.

### Hero page entrance
- `src/components/ui/page-ready.ts`: `usePageReady()` is true once the first-visit preloader has lifted and no transition overlay is active.
  - The preloader sets `html[data-preloader="on"]` while showing and fires `app:preloader-done`.
- One GSAP timeline in `LandoAboutHero.tsx` ("Page entrance" comment):
  - 0.00s background settles · 0.10s portrait unveils bottom-up (clip-path) · 0.35s AHMAD rises letter by letter · 0.80s left column eyebrow line and words · 0.95s stats rise and count up · 1.25s client proof (faces, then stars) · 1.40s quote. Phones get their own rows.
- `data-intro-state`: `pending` → `running` → `done`. The quote's reading clock is paused while pending. 6-second fallback, `<noscript>` style, simple fade for reduced motion.
- `src/components/ui/RevealText.tsx` splits text into masked words (`.rw` / `.rw-i`).
- `HeadingReveal` has a `manual` prop so a parent timeline can drive its letters (`.hr-reveal-char`). **Accessibility (2026-10-01):** it now hides the split letters and gives the plain text once in a `.sr-only` span, so screen readers and search engines read the whole heading, not letter by letter.
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
- From the 21st.dev "testimonials-columns-1" component (uses the `motion` package, pinned to `~13.2.0`). On every page except `/` (the nav page) and `/projects`: `/home`, `/contact`, `/privacy`, `/terms`, always right before the footer.
- Eyebrow, "WHAT CLIENTS SAY" (`HeadingReveal`), one-line intro; then columns of cards drifting upwards forever, faded at the top and bottom. One column on phones, two from 768px, three from 1024px; every layout shows every review (dealt round robin).
- A column holds while hovered, pauses off screen, and stays still with reduced motion. Cards: stars, quote, avatar, name, role (hairline border, no shadow or glow).
- `background` prop matches the page it sits on (navy on `/home`, royal elsewhere); it is opaque because the footer curtain sits beneath. `id="reviews"` is the hero's "client reviews" link target.
- Data: `src/data/reviews.ts` (shared with the hero); illustrated SVG avatars in `public/reviews/*.svg`. Samples are filtered out in production, and the section hides when none are left.
- CSS: `.tm-*` in `globals.css`, just before the footer styles.

### Performance
- No per-frame layout reads; loops sleep when idle; `AnimationGovernor` pauses off-screen CSS animations; the liquid reveal's idle sleep is counted in frames so it can't freeze half-open at low frame rates.

### Why I build (`WhyIBuildSection.tsx`)
- Added 2026-09-30 in place of the `/story` page, to make the emotional connection on the home page. The client wants it professional, modern and not cringy.
- Eyebrow 道 (michi, "the way", as a `JpTerm`) · "The honest version"; title "Why I build".
- Statement: "I learn by building. Every project this year taught me something the last one couldn't, and each one made me care more about the people on the other side of the screen." Each word goes from faint (0.16) to full as it scrolls through (GSAP scrub).
- The year, 2026, told through the six projects. Their dates match `project-details.ts`:
  - Jan: Facebook Clone
  - Feb: Interactive CV
  - Feb – Mar: MAB Portfolio
  - Apr – May: HRA Studio
  - May – Aug: Ard Al Khair
  - Jun – Aug: this site
  - Now: "Your project", in mint, with `ButtonWithIcon` "Start your project" (goes to `/contact`).
- Each beat has a date, a length, a title, one or two lines and a link to its project (link style, page transition).
- A line down the beats fills as the reader scrolls. The dots fill as the line reaches them. On desktop a sticky column shows the current month turning over like a counter (JAN … NOW), with "01 / 07" and a note, "Six builds in eight months, each one a little harder than the last." The line, the dots and the counter all follow one ScrollTrigger range, and beat offsets are measured on refresh only.
- Closes with "What you can count on", three promises: Straight answers · Progress you can see · Work that lasts.
- Reduced motion: no scrub or entrance, everything visible.
- **Copy is a draft written from the project data.** The client should check that the lines and promises are true to them.

### Removed at the client's request
- "Tsukuyomi / under my genjutsu" screen takeover (and its reveal "burst" event).
- Flame section separators (metaball and Worley versions; `SectionFlame.tsx` deleted).
- Tech Stack v1 (2D DOM balls).
- Reviews infinite marquee tape.
- Reviews featured-quote section (`ReviewsSection.tsx`, `.rv-*` CSS), replaced by the testimonials columns.

---

## 4a. Landing page (`/`, `src/app/page.tsx`)

- Navigation rectangles for `/home` (Home), `/projects` (Projects), `/contact` (Contact).
- **Contact rectangle line:** "Start a project, book a call or just say hello." (was "Open to engineering roles, tech collaborations & conversations.", which read like job hunting; updated 2026-10-01).
- After scrolling past the menu, transitions to the Home page (`NextPage`).

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
- **Dummy data rules (client, 2026-09-30):** no "too perfect" figures (no rows of 100 Lighthouse scores, no flat 3× or 60fps, no −100% change pills); keep numbers uneven and believable. Every project was built between Jan and Aug 2026, spread by complexity: Facebook Clone Jan (4 wks, 81 h), Interactive CV Feb (3 wks, 66 h), MAB Portfolio Feb – Mar (5 wks, 133 h), HRA Studio Apr – May (7 wks, 170 h), Ard Al Khair May – Aug (12 wks, 352 h), Story Portfolio Jun – Aug on evenings and weekends (12 wks, 301 h). All `year` fields are 2026. Projects launched in August show weekly trend charts (every other week labelled, empty strings between), so no chart runs into months that have not happened.

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

## 5c. Contact page (`/contact`)

Rebuilt from scratch on 2026-09-30 (the old page had inline styles, its own button style, a 2D canvas globe and a form that only pretended to send). No reference: designed to match the site.

### Files
- `src/app/contact/page.tsx`: server page with metadata and the FAQ as FAQPage structured data (JSON-LD); renders `ContactView`.
- `src/components/sections/ContactView.tsx`: the whole page (hero, brief, channels, FAQ), then testimonials, footer and scroll-to-next (Story).
- `src/data/contact.ts`: email, hero words, form options, next steps, channels, FAQ. **PLACEHOLDER:** budget ranges, reply time ("within one working day"), FAQ timelines and the 30-day support period. It is also the one place for the client's contact details, which the footer imports too: `CONTACT_EMAIL` (code.by.ahmad.dev@gmail.com since 2026-10-03; was ahmadbarkat382@gmail.com), `EMAIL_HREF` (mailto with the subject "Project enquiry"), `PHONE_DISPLAY`/`PHONE_HREF` (+92 305 4090550), `WHATSAPP_HREF` (wa.me/923054090550 with the message "Hi Ahmad, are you available at this time?"), `LINKEDIN_URL`, `GITHUB_URL`.
- CSS: `.ct-*` in `globals.css`, just before the testimonials block.
- `src/components/ui/ContactGlobe.tsx` deleted.
- `src/components/ui/jp-term.tsx`: `JpTerm`, a Japanese word with a dotted mint underline; hover, focus or tap opens a small card with the word, its reading and its meaning (screen readers get the meaning as its description). CSS `.jp-term*` just before the contact block. Used for 依頼 in the brief's eyebrow; meant for every Japanese term on the site.
- `src/components/ui/send-flight.tsx`: the send moment. `SendButton` (idle → sending: folds into its puck with a turning mint ring → sent: mint puck with a check → idle again after 2.2s; a short shake if sending fails), `flyPaperPlane` (a paper plane leaves the puck, dips, then swoops up and out of the window on a GSAP MotionPath, drawing a dotted mint contrail; skipped with reduced motion) and `SentToast` ("Brief sent · Thanks, {first name}. I'll reply to {email} within one working day", bottom right, full width on phones, closes after 7s with a draining bar, holds on hover/focus, dismiss button). CSS `.snd*` just before the contact block.

### Sections
1. **Hero** (`--grad-deep`, feathers into navy): eyebrow "Contact · Working worldwide"; "LET'S BUILD / YOUR [word]_" where the mint word is typed and deleted in turn (website, web app, store, startup, idea) followed by the logo's cursor (a mint bar that blinks while it holds, solid while typing); lede; `ButtonWithIcon` "Start the brief" (scrolls to the form), then "Write me an email" (opens a new email), "Book a call" (smooth-scrolls to the calendar), and "WhatsApp" together on the row below (link style); three facts along the bottom (Based in: Pakistan · PKT (UTC+5); Working with: International clients, remotely; Replies: Within one working day); "GET IN TOUCH" in faint mint, in two rotated lines down the right edge, with a small permanent caption beside it ("連絡 renraku · get in touch"). Pointing at it casts the site's genjutsu reveal (`GenjutsuReveal`, the dragon's torn brush, as the home hero's faces), at 1.8× the dragon's brush size for a glyph this big, and tears the words into 連絡 (the same words in Japanese) in crimson. A tap spreads the ink across it. The hero's content only takes the pointer on its own words and controls (`.ct-hero__inner` has `pointer-events: none`), so the kanji can be reached behind it. The typing only runs after the entrance and while the hero is on screen.
2. **The brief** (`#contact-form`, which the footer's button also scrolls to): sticky left column (依頼 · The brief, "Start a project", three "what happens next" steps); the form: 01 name, 02 email, 03 project type (chips, multiple), 04 budget (chips), 05 timeline (chips), 06 message (with a counter, max 2000). Only name, email and message (10+ characters) are required; errors show under each field and focus the first one. Honeypot `botcheck`. Sends through Formspree with the sending ring shown for at least 0.9s; on success the paper plane flies off, the "Brief sent" toast appears as it leaves, and the form clears (it no longer goes to `/thank-you`). On failure the button shakes and the page says so and offers the email address.
3. **Book a call** (`#book`, `CallSection`): eyebrow "Book a call", title "Talk it through", a short intro and three points (Free, 30 minutes · Shown in your own time zone · Calendar invite sent right away). Below that is Calendly's inline calendar for the 30-minute meeting (`https://calendly.com/ahmadbarkat382/30min`, Ahmad's only event type, so visitors land straight on the dates), through `CalendlyEmbed` (`src/components/ui/calendly-embed.tsx`, `.cal-embed*` CSS). Details:
   - Calendly's script loads only when the section is within 1.5 screens.
   - The frame takes the calendar's own height from Calendly's `page_height` message, so it never scrolls inside. It listens only to its own iframe and ignores the first tiny reports.
   - Mint loading dots show while it loads, with a fallback link if it can't load.
   - Colours are set in the URL (`CALENDLY_EMBED_URL` in `src/data/contact.ts`): background `072a5e` (the page navy), text `e8f6ff`, primary `7fe7d6`, GDPR banner hidden.
   - Calendly draws its own card, so the frame adds no border (one card, not two).
   - Underneath: "No time that suits you? Send the brief above…" and an "Open in Calendly" link.
   - When a call is booked (`calendly.event_scheduled`), the same toast as the form shows "Call booked".
4. **Or reach me directly**: four cards in a 2 × 2 grid (one column on phones): Email ("Write me an email"), WhatsApp (+92 305 4090550, "Message on WhatsApp" + "Call"), LinkedIn, GitHub. The whole card opens the channel; the visible actions use the one link style. No copy-to-clipboard any more (client request).
5. **Before you ask** (FAQ, on `.sec-gradient`): sticky heading; six questions in an accordion (one open at a time, height eased with grid rows).

### Entrance
- One GSAP timeline gated on `usePageReady()` with `data-intro-state` pending → running → done (6s fallback, `<noscript>` style, fade only for reduced motion): eyebrow, headline words rise, cursor, kanji, lede, actions, facts with their rules drawing across. Later sections reveal on scroll (`motion` + `HeadingReveal`).

### Form setup
- Formspree: briefs are POSTed as JSON to `https://formspree.io/f/mvkgldyb` (`FORMSPREE_ENDPOINT` in `src/data/contact.ts`), no package needed. `_subject` is "New project brief from {name}", `email` becomes the reply-to, and the honeypot field is Formspree's `_gotcha`. The form ID is public by design; no env variable. Set up by the client on 2026-09-30 with their own inbox. Not yet tested with a real submission (tests stub the request).
- Error text uses a pale rose `#ffb4be` (not in the palette: crimson is kept for genjutsu accents, and errors need a colour of their own).

## 5d. Job search positioning and discoverability (added 2026-10-02)

Goal (client): land full-time jobs abroad (US, UK, Germany, Canada, Japan and others), remote or with visa sponsorship, and be found by recruiters and AI search. Positioning is **both paths equal**: hire me for a role, or start a project.

- `src/data/profile.ts`: the one source of facts (name, role, location, skills, what he is seeking, sameAs links). Feeds the root layout's Person + ProfilePage + WebSite JSON-LD, `/llms.txt` and `/hire`. Fields marked `TODO(client)`: education, languages, city.
- `layout.tsx`: title "Ahmad Barkat | Full-Stack Developer, open to remote & relocation", role-based description and keywords, OpenGraph type `profile`.
- `robots.ts`: explicitly allows the main search and AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others) and blocks `/api/` and `/dev/`.
- `/hire` (`HireView.tsx`, `.hm-*` CSS): two paths (email about a role / send a brief), at-a-glance facts, skills, the six projects, LinkedIn, GitHub and call booking.
- **Still to do:** a CV page or PDF (`/cv`), real education, honest project write-ups (the current summaries and figures are dummy), a Hire me link on the home hero and in the menu (menu has 4 fixed shapes), real reviews, a `Person` image, owning the `ahmadbarkat.dev` domain, and keeping LinkedIn/GitHub wording identical to the site.

## 6. Next steps (in order)

1. **Contact page:** send one real test brief through the form to confirm it reaches the inbox; confirm the budget ranges, reply time and FAQ answers in `src/data/contact.ts`; then commit and push.
2. **Meanings for Japanese terms site-wide** (client request, 2026-09-30): proposed and waiting for the client's go-ahead. Use `JpTerm` for small kanji and anime words (写輪眼, 上忍, 位 任 気, 忍, Jōnin, S-rank, Chakra, Shinobi) and a permanent caption for big decorative kanji (龍 on About), as on the contact page.
3. **Projects page content:** swap the dummy project details, case studies (`caseStudy` in `src/data/projects.ts`) and project-page data (`src/data/project-details.ts`) for real ones when the client sends them.
4. **Verify the latest hero entrance tweak:** record the entrance on desktop and phone; confirm the stat dividers fade in with their numbers. Test in a production build (`npm run build && npm start`); in dev, hydration delays the start by about 3–4s.
5. **Full home-page bug check** (requested by the client, not started). Known lead:
   - `Navbar.tsx` calls `gsap.defaults({ ease: "kn-main", duration: 0.7 })`, which changes GSAP defaults for every tween on the site. Scope it to the navbar's own timelines.
   - Also check: every section at 1440×900 and 390×844; console errors and horizontal overflow; Lenis anchor links; the footer curtain; reduced-motion paths; `/` → `/home` through the transition overlay (the entrance must wait for it).
6. Keep committing and pushing after each batch of client-approved changes.

---

## 7. Known issues

- `Navbar.tsx` sets global GSAP defaults (see step 4 above).
- Project page heroes use desktop screenshots; on phones the cover crop shows a zoomed part of the screenshot (softened by the hero blur). Portrait crops per project would look better.
- In dev, the first visit to a project page compiles the route; the overlay holds on the full image until the page arrives (up to 9s). Production is near-instant.
- Screens wider than 2.35:1 would see a small size mismatch at the video hand-off (the video then covers by width).
- A "GSAP target [object NodeList] not found" warning appears in the console on every page (seen on `/`, `/privacy`, `/contact`), so it comes from shared code (navbar or layout), not a single page.
- Calendly's calendar takes about 5–10 s to draw on the dev server (it is Calendly's page). The "Powered by Calendly" ribbon can only be removed on a paid Calendly plan.

---

## 8. Needs the client's input

- Check the 'Why I build' copy on `/home` (statement, the six beats, the three promises). It was drafted from the project data, and only true lines should stay. A candid photo would make it stronger.
- **Real testimonials:** all 8 reviews are samples; on the live site the testimonials section and the hero's review pill are hidden until real reviews with permission and photos go in `src/data/reviews.ts`.
- **Real case-study numbers:** the case studies are marked DUMMY; invented figures are a trust risk and need real numbers, results and client reviews from Ahmad's actual projects.
- **Payment terms, revisions and post-launch support:** for a planned "Working with me" section (`src/data/contact.ts`).
- **Starting prices:** clarify the project quote structure in `src/data/contact.ts`.
- **Live project URLs:** set `href` in `src/data/projects.ts` to show a "Visit live site" link on each project page (none currently set).
- **Other links:** a CV/résumé PDF, freelance profiles (Upwork, Fiverr), other socials (X, Instagram, Dribbble/Behance), and confirm the domain ahmadbarkat.dev (used in the sitemap and metadata) is owned.
- **Tech Stack list:** confirm it, especially JavaScript, HTML and CSS (added to fill out the cluster). Lenis has no icon and shows its name.
- **Contact placeholders:** confirm the FAQ answers and the budget bands (`FAQ`, `BUDGETS` in `src/data/contact.ts`).
- **Who to target** (from the 2026-10-01 client panel: a Dubai real-estate manager, a US SaaS founder and a UK agency owner, all of whom bookmarked but didn't contact): pick 1–2 audiences to name in the hero instead of "growing businesses". Decide whether to offer white-label work for agencies (NDA, Figma-to-code, handover).
- **Case-study numbers contradict each other** (all three panel personas noticed): "62% faster first load" next to "LCP −78%", and "sold from spreadsheets and PDFs" next to an "old brochure site". Replace them with real figures or remove them. Name the "Sales director" quote, or offer a reference.
- **Book one test call through the calendar on `/contact`** to check the calendar invite and the 'Call booked' toast. Only page loading and layout were tested.

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

### 2026-10-08
- Committed and pushed everything from 2026-10-03 (security pass, Amethyst project, hire page, mail button, contact rebuild) to `origin/master` and deployed to Vercel (project `code-by-ahmad`). `ABOUT_AHMAD.md` left out of git (personal notes). Dev server running on http://localhost:3000.

### 2026-10-03
- Projects (client request): added **Amethyst Developers** (amethyst-developers.com) as a 7th project and replaced the Ard Al Khair screenshots with the 5 new ones each. New WebP files in `public/projects/` (`amethyst-*.webp`, `ard-al-khair-*.webp`; the old `ard-al-khair.webp` is now the Explore-projects screenshot). New entries in `src/data/projects.ts` (second in the list, so it shows on the home Work cards) and `src/data/project-details.ts`, all DUMMY (role, stack, dates Mar – Apr 2026, figures and review were written from the screenshots; confirm or replace). Case-study close-ups can now cut from another screenshot (`details[].image`, used in `ProjectDetail.tsx`). The `/projects` helix assumed 6 projects: `CARD_COUNT` 30 → 35 (must be a multiple of the project count) and the logo now turns 3 whole turns per loop (`turnPerStep`), so the endless loop's jump back stays invisible. "Six projects" copy changed to seven in `AboutMeSection.tsx` and `profile.ts`; the home 'Why I build' timeline still lists the original six and says 'Six builds in eight months'. Unused screenshots: Amethyst `amethyst-pipeline`, `amethyst-project`; Ard Al Khair `ard-al-khair-contact`, `ard-al-khair-blogs` (files kept in `public/projects/`). Typecheck and production build clean; new pages and images serve (200). NOT seen rendered: the browser pane could not draw, so the 7-card carousel (WebGL), the Amethyst page and the cropped close-ups need a visual check at 1440×900 and 390×844, including one full wrap of the carousel.
- Review photos (client request): replaced the 8 illustrated SVG avatars in `public/reviews/` with square face crops (192px WebP) of the client's stock photos, and gave each sample review a first name that matches its photo (women: Sarah M., Lina H., Noor A., Mei T.; men: Daniel R., Omar K., Marcus L., Carlos D.) with "Role, company type" as the role line. Old `.svg` files deleted; `src/data/reviews.ts` updated. Two supplied photos are unused (a group shot and a spare man). These are still stock portraits on SAMPLE reviews, which stay hidden in production until real reviews replace them. Typecheck clean; files serve as `image/webp`; not seen rendered (the browser pane would not load the lazy images).
- Security pass using the Cloudflare `security-audit` skill's method (focused review, not the full six-phase run). Findings and fixes: (1) `next@15.3.3` had a critical advisory (unauthenticated RCE in image optimization, plus others): upgraded to `next@15.5.27` and `eslint-config-next@15.5.27`; (2) forced `postcss` to 8.5.28 everywhere (direct dep + `overrides: { postcss: "$postcss" }`) and ran `npm audit fix` (picomatch, braces, nanoid, js-yaml and others); audit went from 16 (1 critical) to 7 high, all dev-tooling only (tailwind 3 / eslint-config-next via fast-glob/micromatch ReDoS on local files; they never ship to visitors; fixing needs Tailwind 4 or Next 16); (3) added security headers in `next.config.ts` on every route: Content-Security-Policy (self + Calendly + Formspree only, no framing, no objects), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP, HSTS; `poweredByHeader` off; (4) JSON-LD in `layout.tsx` and `contact/page.tsx` now escapes `<` so data can never close the script tag. Checked and fine: no API routes, no secrets tracked (`.env.local` only holds a telemetry flag and is git-ignored), the one `innerHTML` (`send-flight.tsx`) only contains numbers, external links use `noopener`, the Calendly message handler checks the origin, `/dev` is 404 in production. Verified: production build passes, headers present, `/home`, `/projects`, `/contact` load with no CSP violations. Not verified: Calendly's embed and the Formspree send under the new CSP (test one real booking and one brief). `script-src` keeps `'unsafe-inline'` because Next's bootstrap scripts are inline (a nonce would make every page dynamic).

### 2026-10-03
- Switched the site's email to `code.by.ahmad.dev@gmail.com` everywhere (client request): `CONTACT_EMAIL` in `src/data/contact.ts` now holds it, so the footer, contact page, `/hire`, `/llms.txt`, JSON-LD and the mail button all follow; `QUICK_EMAIL` is now an alias. The Calendly link keeps its own `ahmadbarkat382` handle (that is the booking page's URL, not an email). Formspree briefs still go to the inbox set up on the Formspree form, so check which address receives them. Typecheck clean.
- Floating mail button (client request): new `MailFab` in the root layout, bottom right on every page, opens an email to the new address `code.by.ahmad.dev@gmail.com` (`QUICK_EMAIL` in `src/data/contact.ts`). Typecheck clean. NOT yet checked visually (the browser pane could not reach the dev server): check it at 1440×900 and 390×844, over the footer and on `/projects`.

### 2026-10-03
- Added `ABOUT_AHMAD.md`: one file with all known details about Ahmad (contact, skills, projects, goals, gaps marked FILL IN / CHECK) and a drafted answer to the "what are you working on right now" question. No site code changed.

### 2026-10-02
- Job-search pass: new `src/data/profile.ts`, Person/ProfilePage/WebSite JSON-LD in the root layout, role-based title/description/keywords, `/llms.txt`, `robots.ts` allowing AI crawlers, a new `/hire` page (`HireView.tsx`, `.hm-*` CSS) in the sitemap and the footer. Verified `/hire`, `/llms.txt` and the JSON-LD on the dev server; typecheck clean. Not yet checked on phone width.

### 2026-10-01
- Trust pass after a client-perspective review: honest hero figures (中忍 "Chūnin · 1 year of training", "Missions cleared in 2026" = 6 projects, "Chakra on standby" = 24h reply, `STATS` `rank: true` flag in `HeroAside.tsx`), a clear offer line in the hero desktop and phones ("I design and build fast, memorable websites and web apps for growing businesses"), the About section rewritten in a professional voice with "HI, I'M AHMAD." heading, "FULL-STACK DEVELOPER · WORKING WORLDWIDE" badge, professional bio, and buttons "START A PROJECT" and "SEE MY WORK" (dragon and layout unchanged), the nav page's Contact rectangle line changed to "Start a project, book a call or just say hello." (no longer reads as job hunting), and rolled links and revealed headings now hide letter rows from screen readers (`.aria-hidden` and `.sr-only` labels so search engines and a11y tools read whole words). Files: `HeroAside.tsx`, `AboutMeSection.tsx`, `src/app/page.tsx`, `TextRoll.tsx`, `HeadingReveal.tsx`, `.hs-m__offer` CSS. Verified in headless Chrome at 1440×900, 390×844 and 360×740 (no overflow), the 7 box-roll checks pass, typecheck clean.

### 2026-09-30
- Links roll when their box is hovered, not only the text (client request): `TextRoll` rebuilt in CSS (same stagger and easing, no framer-motion), set off by the whole `.ftr-link`, by `[data-roll]` hosts (nav page rectangles in `src/app/page.tsx`, menu rows in `Navbar.tsx`) and by the contact channel cards (main link rolls, colours and underlines; "Call" keeps its own hover). The second row of letters is now hidden from screen readers. Files: `TextRoll.tsx`, `page.tsx`, `Navbar.tsx`, `.troll*` and `.ct-channel` CSS. Verified in headless Chrome (7 checks: card corner, WhatsApp main vs Call, roll back on leave, arrow icon, nav rectangle end, menu row end); typecheck clean.
- Location (client: lives in Pakistan, works with foreign clients): contact eyebrow "Contact · Working worldwide", facts "Based in Pakistan · PKT (UTC+5)" and "International clients, remotely", FAQ now "Do you work with international clients?" (time-zone overlap with the Gulf, Europe and the US), home hero phone line "Full-stack developer · Worldwide". Files: `ContactView.tsx`, `src/data/contact.ts`, `HeroAside.tsx`.
- Fixed the contact kanji hover showing the red as hard-edged rectangles (client report): the genjutsu brush's 256px noise tile was fixed at the block's corner and got clipped out of the filter wherever the trail was beyond it, so the ink there lost its torn edge. The filter now always includes the tile under the trail (`genjutsu-reveal.tsx`). Verified by scrubbing the whole kanji and re-checking the home hero blocks in headless Chrome; typecheck clean.
- Updated the client's contact details site-wide (client request): email ahmadbarkat382@gmail.com, phone and WhatsApp +92 305 4090550 (a WhatsApp link that opens the chat with "Hi Ahmad, are you available at this time?"), new LinkedIn and GitHub URLs, all kept in `src/data/contact.ts`. "Copy my email"/"Copy" replaced by "Write me an email" links (mailto with subject "Project enquiry") in the contact hero, email card and footer. New WhatsApp card (with Call) on /contact, the channel cards now a 2 × 2 grid, WhatsApp added to the hero and the footer. Files: `src/data/contact.ts`, `ContactView.tsx`, `motion-footer.tsx`, `.ct-*` CSS. Verified every link's target in headless Chrome at 1440×900, 1024×768 and 390×844 (no overflow); typecheck clean.
- Contact form now sends through Formspree (`https://formspree.io/f/mvkgldyb`, set up by the client) instead of Web3Forms: plain JSON fetch, `_subject` + reply-to, `_gotcha` honeypot; the dev-only preview mode was removed. Files: `ContactView.tsx`, `src/data/contact.ts`. Verified with the request stubbed in headless Chrome (payload correct, success shows the plane + toast and clears the form, failure shakes and keeps the form); no real submission sent; typecheck clean.
- Contact form send moment (client request): a new send button (the one exception to the single button style), a paper-plane flight with a dotted mint contrail when the brief is sent, and a "Brief sent" toast instead of the redirect to `/thank-you`; the form clears after sending. New `src/components/ui/send-flight.tsx`, `.snd*` CSS; `ContactView.tsx` updated. Verified in headless Chrome at 1440×900 (hover sweep, sending ring, flight filmed at quarter speed, toast, auto-close after 7s, form reset) and 390×844; typecheck clean.
- Fixed the menu (client report): it opened with no panel, just a blurred page, because the backdrop layers ended at 0% + 646px (GSAP had read the CSS `translateX(101%)` as a pixel offset); the open tween now also zeroes `x`. Made it professional: a real close button in the menu's top bar (the panel covered the dock's cross, and phones had no way to close it), a readable "Esc to close" hint on desktop only, readable numbers/dots/arrows/footer, the page locked while open (Lenis stop/start), and focus moved in and back out. Files: `Navbar.tsx`, `.kn-*` CSS. Verified at 1440×900 and 390×844: panel shows, close works, no scroll while open, scroll returns after; typecheck clean.
- Contact: added a "Book a call" section with Calendly's inline calendar (30-minute meeting). It is themed in the site's navy, ice and mint, lazy-loaded, sized to its content, shows a "Call booked" toast on booking, and has a "Book a call" link in the hero. The channels heading is now "Or reach me directly". Files: `calendly-embed.tsx` (new), `ContactView.tsx`, `contact.ts`, `.ct-call*`/`.cal-embed*` CSS. Verified in headless Chrome at 1440×900 and 390×844: loads only near the section, sizes to 832 px on phones, no overflow. Typecheck clean.
- Project data made believable (client request): uneven Lighthouse scores and figures instead of 100s and round multiples, every project re-dated into Jan – Aug 2026 by complexity (timelines, weeks, hours and phase plans in `project-details.ts`, `year` and case-study figures in `projects.ts`), weekly trend charts for the two August launches, and Ard Al Khair's "time to publish −100%" row replaced by "enquiry reply time 26h → 4h". Trend chart's screen-reader label no longer says "month by month" (`ProjectDetail.tsx`). Verified the Ard Al Khair and Story Portfolio pages at 1440×900 and 390×844 (no overflow, labels readable); typecheck clean.
- Restored the original genjutsu hover (the dragon's torn brush) in `genjutsu-reveal.tsx` and its CSS, undoing the 2026-09-29 circle-and-rings rebuild at the client's request (recovered from that session's transcript; it was never committed). Kept the newer stats shinobi face (上忍, S-rank, chakra meter); the meter now fills on `.gj-alt[data-on="true"]`. The contact hero kanji uses the same brush at 1.8× size. Verified in headless Chrome at 1440×900 on the home hero blocks and the contact kanji; typecheck clean.
- Contact hero: the right-edge text now reads "GET IN TOUCH" and turns into 連絡 in crimson on hover through the shared genjutsu reveal (circle + crimson rings, exact inverse mask), replacing the page's own crimson circle (`useKanjiReveal` removed). Files: `ContactView.tsx`, `.ct-hero__kanji`/`.ct-kanji*` CSS. Verified in headless Chrome at 1440×900 (opens on hover, closes on leave, "Copy my email" still clickable) and 390×844 (tap opens, closes after 3s, no overflow); typecheck clean.
- Contact hero kanji 連絡 now reveals in crimson on hover (circle from the pointer; tap on phones) and has a permanent caption with its reading and meaning. New `JpTerm` (`src/components/ui/jp-term.tsx`, `.jp-term*` CSS) shows a Japanese word's reading and meaning on hover, focus or tap; used for 依頼. Verified in headless Chrome at 1440×900 (opens, closes to 0, tooltip opens) and 390×844; typecheck clean.
- Rebuilt the contact page (`/contact`): typed-word hero with the logo's cursor and a 連絡 kanji, a project brief form (name, email, project type, budget, timeline, message) that sends through Web3Forms, direct channel cards, and an FAQ accordion with FAQPage structured data; testimonials, footer and scroll-to-Story kept. New `ContactView.tsx`, `src/data/contact.ts`, `.ct-*` CSS; `contact/page.tsx` is now a server page with metadata; `ContactGlobe.tsx` deleted. Verified in headless Chrome at 1440×900 and 390×844: entrance plays, no horizontal overflow, errors show and focus the first field, chips select, FAQ opens, submitting without a key shows the fallback message; typecheck clean. Not yet tested with a real Web3Forms key.
- Home: new 'Why I build' section after About (`WhyIBuildSection.tsx`, `.wb-*` CSS). It has a scroll-lit statement, the 2026 timeline of the six projects ending on 'Your project', a sticky month counter on desktop, and three promises. Verified in headless Chrome at 1440×900 and 390×844 (words light up, the counter, line and dots stay in step, no overflow). Typecheck clean.
- Story taken out of the site's links: removed from the nav page rectangles (`src/app/page.tsx`), the menu (`Navbar.tsx`), the footer's Explore list, `sitemap.ts` and `GlobalPreloader`'s self-loading routes. The contact page's scroll-on panel now opens Home (`/hero-base-cutout.webp`). The `/story` files themselves are not deleted yet (awaiting the client's go-ahead).
- Clean-up (client-approved): deleted the Story page with its 333 laptop frames (277 MB), the Cartefield font (personal-use licence), 10 unused images (7.8 MB), `text-reveal-animation.ts`, `/thank-you`, about 1,580 lines of unused CSS and 20 keyframes, the packages `framer-motion`, `next-themes`, `split-type` and `tailwindcss-animate`, and the leftover `client/`, `server/`, `shared/`, `AGENTS.md`, `.agents/`, `.kiro/` and most of `references/` (the dragon originals were kept). `WillemLoader` is untouched. Verified: all pages 200, `/story` and `/thank-you` 404, a smoke test at 1440×900 and 390×844 is clean, and the typecheck is clean.

### 2026-09-29
- Committed and pushed all of today's work (`6fe9b75`).
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
