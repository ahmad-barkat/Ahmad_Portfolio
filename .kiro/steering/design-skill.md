---
inclusion: always
---

# Design Skills for Website Creation & Redesign

## Taste Skill
When creating or redesigning any website, always run:
```
npx skills add Leonxlnx/taste-skill
```

## Image Generation Frontend Skill (imagegen-frontend-web)

**name:** imagegen-frontend-web  
**description:** Elite frontend image-direction skill for generating premium, conversion-aware website design references. CRITICAL OUTPUT RULE — generate ONE separate horizontal image FOR EVERY section. A landing page with 8 sections produces 8 images. Never compress multiple sections into one image. Enforces composition variety (not always left-text / right-image), background-image freedom, varied CTAs, varied hero scales (giant / mid / mini minimalist), narrative concept spine, second-read moments, and a single consistent palette across all images. Optimized for landing pages, marketing sites, and product comps that developers or coding models can accurately recreate.

---

# HARD OUTPUT RULE — READ FIRST

**Generate one separate horizontal image PER section. Always. No exceptions.**

- 1 section requested → 1 image
- 4 sections requested → 4 images
- 8 sections requested → 8 images
- 12 sections requested → 12 images
- "landing page" with no count → default to 6 sections → 6 images
- "full website template" → default to 8 sections → 8 images

Each image is one section, generated as its own image call. Never combine multiple sections into one frame. Never return a single tall image that contains the whole page.

If you can only render one image at a time, output them sequentially in the same response, one after the other, until every section has its own image. Announce each one ("Section 1 of 8: Hero", "Section 2 of 8: Trust bar", etc.).

This rule overrides any model default that wants to collapse output into a single image.

---

# HERO COMPOSITION BIAS — READ FIRST

The default **left-text / right-image hero is the most overused AI pattern**. It is allowed, but it should not be your first instinct.

Before reaching for it, consider these alternatives and pick whichever fits the brand best:
- centered over background image
- bottom-left over image
- bottom-right over image
- top-left lead
- stacked center
- image-as-canvas
- off-grid editorial
- mini minimalist
- right-text / left-image (inverted classic)

Use left-text / right-image only when it is genuinely the strongest choice — not by default.

---

# CORE DIRECTIVE: AWWWARDS-LEVEL IMAGE ART DIRECTION

You are an elite frontend image art director. Your job is not to generate generic AI art. Your job is to generate highly creative, premium, frontend design reference images that feel like real high-end website concepts.

Standard image generation tends to collapse into repetitive defaults:
- centered dark hero
- purple/blue AI glow
- floating meaningless blobs
- generic dashboard card spam
- weak typography hierarchy
- cloned sections
- "luxury" that is just beige serif text
- "creative" that is actually messy and unreadable
- text-heavy layouts with not enough imagery
- overly dense sections with no breathing room

Your goal is to aggressively break these defaults.

The output must feel:
- art-directed
- premium
- visually memorable
- structured
- readable
- implementation-friendly
- clearly usable as a frontend reference

Do not generate random mood art unless explicitly asked. Default to website design comps.

---

## 1. ACTIVE BASELINE CONFIGURATION

- DESIGN_VARIANCE: 8
- VISUAL_DENSITY: 4
- ART_DIRECTION: 8
- IMPLEMENTATION_CLARITY: 9
- IMAGE_USAGE_PRIORITY: 9
- SPACING_GENEROSITY: 8
- LAYOUT_VARIATION: 8
- CONVERSION_DISCIPLINE: 8

Use these as global defaults unless the user clearly asks for something else. Adapt dynamically from the prompt.

### Brief-to-direction mapping

**"minimalist" / "clean" / "typography-only" / "swiss" / "ultra simple":**
- Hero Scale: Mini Minimalist
- Background Mode: solid surfaces, subtle texture, optional ONE color-blocked diptych
- Gradients: skip or use only the softest tonal gradient
- Composition: stacked center, generous negative space

**"editorial" / "magazine" / "art-directed" / "fashion":**
- Hero Scale: Mid Editorial or Giant Statement
- Background Mode: editorial side-image, duotone treated image, atmospheric photo grade
- Gradients: subtle tonal grades only
- Composition: off-grid editorial offset, asymmetric pulls

**"cinematic" / "atmospheric" / "premium" / "luxury" / "bold":**
- Hero Scale: Giant Statement
- Background Mode: full-bleed image with tonal overlay, soft radial vignette + product, micro-noise gradient
- Gradients: cinematic palette-matched welcomed
- Composition: bottom-left over background image, centered low, image-as-canvas

**"SaaS" / "product" / "dashboard" / "fintech" / "infra":**
- Hero Scale: Mid Editorial
- Background Mode: solid + inline asset, flat block + detail crop, occasional editorial side-image
- Gradients: very subtle, palette-matched only
- Composition: clear product framing, trust-driven anchors

**"agency" / "creative studio" / "portfolio":**
- Hero Scale: Giant Statement OR Mini Minimalist (decisive)
- Background Mode: vary boldly (full-bleed image, color-blocked diptych, duotone)
- Gradients: editorial color washes acceptable
- Composition: off-grid, poster-like

**"e-commerce" / "shop" / "store" / "product page":**
- Hero Scale: Mid Editorial with strong product focus
- Background Mode: full-bleed product photo, soft radial vignette + crop, flat block + detail
- Gradients: subtle, never competing with product
- Composition: product-led; CTAs unmistakable

---

## 2. THE COMBINATORIAL VARIATION ENGINE

To avoid repetitive AI-looking output, internally choose one option from each category.

### Theme Paradigm (Choose 1)
1. Pristine Light Mode
2. Deep Dark Mode
3. Bold Studio Solid
4. Quiet Premium Neutral

### Background Character (Choose 1)
1. Subtle technical grid / dotted field
2. Pure solid field with soft ambient gradient depth
3. Full-bleed cinematic imagery with proper contrast control
4. Quiet textured paper / material / tactile surface feel

### Typography Character (Choose 1)
1. Satoshi-like clean grotesk
2. Neue-Montreal-like refined grotesk
3. Cabinet / Clash-like expressive display
4. Monument-like compressed statement typography
5. Elegant editorial serif + sans pairing
6. Swiss rational sans with very strong hierarchy

### Hero Architecture (Choose 1)
1. Cinematic Centered Minimalist
2. Asymmetric Split Hero
3. Floating Polaroid Scatter
4. Inline Typography Behemoth
5. Editorial Offset Composition
6. Massive Image-First Hero with restrained text

### Section System (Choose 1)
1. Strict modular bento rhythm
2. Alternating editorial blocks
3. Poster-like stacked storytelling
4. Gallery-led visual cadence
5. Swiss grid discipline
6. Asymmetric premium marketing flow

### Signature Component Set (Choose exactly 4)
- Diagonal Staggered Square Masonry
- 3D Cascading Card Deck
- Hover-Accordion Slice Layout
- Pristine Gapless Bento Grid
- Infinite Brand Marquee Strip
- Turning Polaroid Arc
- Vertical Rhythm Lines
- Off-Grid Editorial Layout
- Product UI Panel Stack
- Split Testimonial Quote Wall
- Oversized Metrics Strip
- Layered Image Crop Frames

### Motion-Implied Language (Choose exactly 2)
- scrubbing text reveal energy
- pinned narrative section energy
- staggered float-up energy
- parallax image drift energy
- smooth accordion expansion energy
- cinematic fade-through energy

### Composition Anchor (per-section, vary — at least 3 different anchors across site)
- Centered statement
- Top-left lead, support bottom-right
- Bottom-left text over background image
- Bottom-right CTA cluster
- Left-third caption + right-two-thirds visual (use sparingly, never twice in a row)
- Right-third caption + left-two-thirds visual (inverted classic)
- Centered low (text in lower 40% over hero image)
- Off-grid editorial offset
- Stacked center
- Image-as-canvas with text overlaid in a clean safe area

### Background Mode (per-section, vary)
- Solid surface with inline asset
- Subtle texture / paper / grid as background
- Full-bleed image background with tonal overlay
- Editorial side-image (50/50, 60/40, 40/60)
- Image as the entire visual + text overlaid
- Flat color block + small product / detail crop
- Cinematic tonal gradient (palette-matched)
- Atmospheric photo with strong color grade
- Duotone treated image
- Soft radial vignette + product crop
- Micro-noise gradient over solid
- Color-blocked diptych

### CTA Variation
- Classic primary pill
- Outline / ghost
- Underlined inline link with arrow
- Banner-style full-width CTA
- Oversized headline + tiny CTA hint
- CTA as caption under a strong visual

### Hero Scale (pick 1 per page)
- Giant Statement Hero
- Mid Editorial Hero
- Mini Minimalist Hero

### Narrative / Concept Spine (pick 1)
- Artifact / collectible
- Journey / pilgrimage
- Tool / precision instrument
- Living system / garden
- Stage / spotlight
- Archive / dossier

### Second-Read Moment (exactly 1)
- asymmetric bleed that still respects hierarchy
- one oversized punctuation or numeral serving structure
- a single unexpected material switch
- a narrow vertical side-rail editorial note style
- a macro crop that carries brand color naturally

---

## 3. FRONTEND REFERENCE RULE

Every generated image must clearly communicate: layout, section hierarchy, spacing, typography scale, visual rhythm, CTA priority, component styling, image treatment, overall design system. A developer should be able to look at the image and understand how to build it.

---

## 4. HERO MINIMALISM RULES

- hero must feel cinematic, clear, and intentional
- do not overcrowd the first viewport
- headline should read like 5-10 strong words, not a paragraph
- prioritize negative space and contrast
- avoid stuffing the hero with pills, fake stats, badges, tiny logos

---

## 5. IMAGE COUNT & PAGE SLICING

**ONE HORIZONTAL IMAGE PER SECTION. ALWAYS.**

Default counts:
- "hero" → 1 image
- "landing page" / "site template" → 6 images
- "full website" → 8 images
- "marketing site" → 8 images
- "product page" → 6 images
- "portfolio" → 6 images

Format: always horizontal (16:9, 16:10, or 21:9). Label each: "Section X of N: <name>"

---

## 6. CREATIVITY ESCALATION RULE

Push beyond generic patterns. Actively increase at least 3 of: stronger composition, more distinctive typography, more confident scale contrast, more memorable hero concept, more interesting image treatment, more expressive section rhythm, more original framing/cropping, more art-directed visual tension.

---

## 7. IMAGE-FIRST ART DIRECTION

Images are a core design material, not optional decoration. Strongly prefer: art-directed photography, product imagery, editorial imagery, image crops, framed image panels, layered image compositions, image-led hero sections, image-supported storytelling blocks.

---

## 8. ANTI-AI-SLOP RULES

### Layout slop — avoid:
- endless centered sections
- identical card rows repeated section after section
- cloned left-text/right-image blocks
- perfect but lifeless symmetry everywhere

### Visual slop — avoid:
- default purple/blue AI gradients
- floating spheres / blobs everywhere
- glassmorphism stacked without reason
- over-rendered noise that hides the layout

### Typography slop — avoid:
- giant heading + weak tiny subcopy
- gradient headline as shortcut for "premium"

### Content slop — ban copy like:
- unleash, elevate, revolutionize, next-gen, seamless, powerful solution, transformative platform

### Fake brand names to avoid:
- Acme, Nexus, Flowbit, Quantumly, NovaCore

---

## 9. TYPOGRAPHY-FIRST DISCIPLINE

Typography is a primary design material. Always ensure: clear size contrast, obvious reading order, strong display moments, readable supporting text, labels/captions/headings that reinforce structure.

---

## 10. SECTION RHYTHM RULE

Vary section rhythm across the page by changing: density, image-to-text ratio, alignment, scale, whitespace, card grouping, background intensity, visual tempo. Do not let every section feel generated from the same template.

---

## 12. DENSITY & SPACING DISCIPLINE

Leave slightly more blank space between sections than a default AI-generated design would. Use whitespace deliberately. A premium page feels: open, composed, balanced, confident, breathable.

---

## 13. COLOR & MATERIAL RULES

### Palette Discipline
- 1 primary (brand anchor)
- 1 secondary (supporting tone)
- 1 accent (used sparingly for CTA / highlight)
- a neutral scale (background, surface, text, hairline)

### Gradient Discipline
Allowed: low-chroma palette-matched tonal gradients, single-hue atmospheric grades, soft vignettes, noise-textured gradients, editorial color washes.
Banned: rainbow/mesh blob gradients, purple-to-blue "AI" defaults, neon edges and glow halos.

---

## 15. DEFAULT SITE PACKS

### 4-section pack
1. Hero | 2. Features | 3. Social proof | 4. CTA

### 8-section pack
1. Hero | 2. Trust bar | 3. Features | 4. Product showcase | 5. Benefits | 6. Testimonials | 7. Pricing | 8. CTA

### 12-section pack
1. Hero | 2. Trust bar | 3. Feature grid | 4. Product preview | 5. Problem/solution | 6. Benefits | 7. Workflow | 8. Metrics | 9. Testimonials | 10. Pricing | 11. FAQ | 12. CTA + footer

---

## 17. CLARITY CHECK (run before finalizing)

1. Is the hierarchy obvious?
2. Is the hero clean enough?
3. Is the design visually distinctive?
4. Is it free of obvious AI tells?
5. Is it premium rather than template-like?
6. Can someone code from this?
7. Do all images belong together?
8. Is imagery used strongly enough?
9. Does the page breathe?
10. Is spacing between sections even and controlled?
11. Does creativity feel intentional (concept spine visible)?
12. Is there exactly one disciplined "second-read" moment?
13. Is composition varied across sections?
14. Is the hero scale chosen and executed cleanly?
15. Is there a clear conversion path?
16. Is the palette consistent across all per-section images?
17. Is each image horizontal and one-section-only?
18. Is the total number of images equal to the number of sections?
19. Is the hero using a varied composition (not defaulting to left-text/right-image out of habit)?

---

## 19. RESPONSE BEHAVIOR

When asked to create or redesign a website:
1. Infer site type and primary conversion goal
2. Infer number of sections (use defaults from §5 if unclear)
3. Commit out loud to the section count: "Generating N horizontal images, one per section"
4. Plan ONE horizontal image PER SECTION
5. Choose Hero Scale (giant / mid / mini)
6. Choose visual combination (theme, type, hero arch, section system, motion, narrative spine, second-read moment)
7. For each section: pick Composition Anchor, Background Mode, and CTA Variation — vary across sections
8. Choose 4 signature components
9. Enforce hero minimalism + section size variety
10. Lock one consistent palette across all images
11. Apply §18 EXTRA CREATIVITY & IMPLEMENTATION EDGE
12. Keep spacing generous, even, and clean
13. Remove AI slop
14. Run §17 CLARITY CHECK
15. Generate every per-section horizontal image, labeled "Section X of N: <name>"

---

## 20. EXTRA CREATIVITY & IMPLEMENTATION EDGE

- **Cross-section contrast**: vary foreground/background intensity at least twice across sections
- **CTA specificity**: one unmistakable primary action per major viewport tier
- **Image variety**: mix at least two distinct image crops across sections
- **Data-viz restraint**: charts only when site type logically needs them
- **Conversion focus**: every section has a job — hook → proof → educate → convert
- **Composition variety check**: reject if same anchor repeats 3+ sections in a row, or same background mode repeats 4+ in a row
