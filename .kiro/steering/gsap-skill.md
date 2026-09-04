---
inclusion: always
---

# GSAP Animation Skill
> Source: https://github.com/greensock/gsap-skills (Official GreenSock AI Skills)

When implementing animations, always use GSAP best practices from this skill. All GSAP plugins (SplitText, MorphSVG, ScrollSmoother, etc.) are **100% free** — install everything from the public `gsap` npm package. No auth token, no private registry, no Club membership required.

---

## Install

```bash
npm install gsap          # includes all plugins
npm install @gsap/react   # React hook (if using React)
```

---

## CORE API (gsap-core)

### Tween methods
- **gsap.to(targets, vars)** — animate to vars (most common)
- **gsap.from(targets, vars)** — animate from vars to current state
- **gsap.fromTo(targets, fromVars, toVars)** — explicit start + end
- **gsap.set(targets, vars)** — instant set (duration 0)

Always use **camelCase** property names (`backgroundColor`, `marginTop`, `rotationX`).

### Transform aliases (prefer over raw `transform` string)
| GSAP | CSS equivalent |
|------|---------------|
| `x`, `y`, `z` | translateX/Y/Z (px) |
| `xPercent`, `yPercent` | translateX/Y (%) |
| `scale`, `scaleX`, `scaleY` | scale |
| `rotation` | rotate (deg default) |
| `rotationX`, `rotationY` | 3D rotate |
| `skewX`, `skewY` | skew |
| `transformOrigin` | transform-origin |

- Use **`autoAlpha`** instead of `opacity` — sets `visibility: hidden` when 0 (no pointer blocking)
- Use **`clearProps: "all"`** to remove inline styles after animation completes

### Common vars
- `duration` (default 0.5s), `delay`, `ease`, `stagger`, `repeat`, `yoyo`
- `overwrite: true` — kill all active tweens of same targets; `"auto"` — kill overlapping properties only
- `onComplete`, `onStart`, `onUpdate`
- `immediateRender: false` — needed when stacking multiple `from()`/`fromTo()` on same property

### Easing
```javascript
ease: "power1.out"        // default
ease: "power3.inOut"
ease: "back.out(1.7)"     // overshoot
ease: "elastic.out(1, 0.3)"
ease: "none"              // linear
```

### Stagger
```javascript
gsap.to(".item", { y: -20, stagger: 0.1 });
// Advanced:
gsap.to(".item", { y: -20, stagger: { amount: 0.3, from: "center" } });
```

### Function-based values
```javascript
gsap.to(".item", { x: (i) => i * 50, stagger: 0.1 });
```

### Responsive + Accessibility (gsap.matchMedia)
```javascript
const mm = gsap.matchMedia();
mm.add(
  {
    isDesktop: "(min-width: 800px)",
    reduceMotion: "(prefers-reduced-motion: reduce)"
  },
  (context) => {
    const { isDesktop, reduceMotion } = context.conditions;
    gsap.to(".box", {
      rotation: isDesktop ? 360 : 180,
      duration: reduceMotion ? 0 : 2
    });
  }
);
```

### ✅ Best Practices (Core)
- Prefer transform aliases over raw CSS transforms
- Use `autoAlpha` for fade in/out
- Use `gsap.matchMedia()` for responsive + prefers-reduced-motion
- Store return value when controlling playback (`tween.pause()`, `.kill()`, etc.)
- Prefer timelines over chaining with `delay`

### ❌ Do Not (Core)
- Animate layout-heavy properties (`width`, `height`, `top`, `left`) when transforms work
- Use both `svgOrigin` and `transformOrigin` on the same SVG element
- Forget `immediateRender: false` when stacking multiple `from()` on same property

---

## TIMELINES (gsap-timeline)

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });
tl.to(".a", { x: 100 })
  .to(".b", { y: 50 }, "+=0.2")   // 0.2s after last end
  .to(".c", { opacity: 0 }, "<"); // same start as previous
```

### Position parameter
- `0` — at 0s absolute
- `"+=0.5"` — 0.5s after last end
- `"-=0.2"` — 0.2s before last end
- `"<"` — same start as previous
- `"<0.2"` — 0.2s after previous start
- `"labelName"` — at label
- `"labelName+=0.3"` — 0.3s after label

### Timeline options
```javascript
gsap.timeline({
  defaults: { duration: 0.5, ease: "power2.out" },
  paused: true,
  repeat: -1,
  yoyo: true,
  onComplete: () => {}
})
```

### Labels
```javascript
tl.addLabel("intro", 0);
tl.to(".a", { x: 100 }, "intro");
tl.play("intro");
tl.tweenFromTo("intro", "outro");
```

### Playback control
`tl.play()` / `tl.pause()` / `tl.reverse()` / `tl.restart()` / `tl.kill()`  
`tl.time(2)` / `tl.progress(0.5)`

### ✅ Best Practices (Timeline)
- Use position parameter (not `delay`) for multi-step sequencing
- Use `defaults` for shared duration/ease
- Add labels for readable sequencing
- Put ScrollTrigger on the **timeline**, never on a child tween

### ❌ Do Not (Timeline)
- Chain with `delay` when a timeline can sequence them
- Nest ScrollTriggered animations inside a parent timeline

---

## SCROLLTRIGGER (gsap-scrolltrigger)

```javascript
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger); // register ONCE before use
```

### Basic trigger
```javascript
gsap.to(".box", {
  x: 500,
  scrollTrigger: {
    trigger: ".box",
    start: "top center",    // "triggerPosition viewportPosition"
    end: "bottom center",
    toggleActions: "play reverse play reverse"
  }
});
```

### Key config options
| Property | Description |
|----------|-------------|
| `trigger` | Element whose position defines when ST starts |
| `start` / `end` | `"top bottom"` format; also numeric px or function |
| `scrub` | `true` = direct scroll link; number = seconds to catch up |
| `toggleActions` | `"onEnter onLeave onEnterBack onLeaveBack"` — `play`, `pause`, `resume`, `reset`, `restart`, `complete`, `reverse`, `none` |
| `pin` | Pin element while active (`true` = pin trigger) |
| `pinSpacing` | default `true`; adds spacer so layout doesn't collapse |
| `markers` | `true` for dev markers — **remove in production** |
| `once` | Kills ST after end is reached once |
| `snap` | Snap to progress values or labels |
| `containerAnimation` | For fake horizontal scroll |
| `scroller` | Custom scroll container (default: viewport) |

### Scrub (scroll-linked)
```javascript
scrollTrigger: {
  trigger: ".box",
  start: "top center",
  end: "bottom center",
  scrub: 1   // 1 = 1s lag behind scroll position
}
```

### Pinning
```javascript
scrollTrigger: {
  trigger: ".section",
  start: "top top",
  end: "+=1000",
  pin: true,
  scrub: 1
}
```

### Timeline + ScrollTrigger
```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".container",
    start: "top top",
    end: "+=2000",
    scrub: 1,
    pin: true
  }
});
tl.to(".a", { x: 100 }).to(".b", { y: 50 }).to(".c", { opacity: 0 });
```

### Fake horizontal scroll (containerAnimation)
```javascript
const scrollTween = gsap.to(".horizontal-el", {
  xPercent: -100,
  ease: "none", // REQUIRED — must be "none"
  scrollTrigger: {
    trigger: ".horizontal-el",
    pin: true,
    scrub: true,
    start: "top top",
    end: "+=3000"
  }
});

// Nested triggers reference containerAnimation:
gsap.to(".card", {
  y: 100,
  scrollTrigger: {
    containerAnimation: scrollTween,
    trigger: ".card",
    start: "left center",
    toggleActions: "play none none reset"
  }
});
```

### ScrollTrigger.batch() — stagger-on-scroll
```javascript
ScrollTrigger.batch(".box", {
  onEnter: (elements) => gsap.to(elements, { opacity: 1, y: 0, stagger: 0.15 }),
  onLeave: (elements) => gsap.to(elements, { opacity: 0, y: 100 }),
  start: "top 80%"
});
```

### Refresh & Cleanup
```javascript
ScrollTrigger.refresh();                  // after DOM/layout changes
ScrollTrigger.getAll().forEach(t => t.kill()); // cleanup all
ScrollTrigger.getById("my-id")?.kill();   // cleanup by id
```

### ✅ Best Practices (ScrollTrigger)
- `gsap.registerPlugin(ScrollTrigger)` once before any use
- Call `ScrollTrigger.refresh()` after DOM/layout changes
- Use `scrub` OR `toggleActions` — not both on the same trigger
- Use `ease: "none"` on horizontal animation when using `containerAnimation`
- Create ScrollTriggers in page order (top → bottom); set `refreshPriority` if dynamic/async
- In React, use `useGSAP()` for automatic cleanup

### ❌ Do Not (ScrollTrigger)
- Put ScrollTrigger on a child tween inside a timeline — put it on the **timeline**
- Use `scrub` and `toggleActions` together on the same ScrollTrigger
- Use ease other than `"none"` on a `containerAnimation` horizontal tween
- Leave `markers: true` in production
- Forget `refresh()` after layout changes

---

## REACT (gsap-react)

```bash
npm install @gsap/react
```

### useGSAP hook (preferred)
```javascript
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP); // register once

function MyComponent() {
  const container = useRef(null);

  useGSAP(() => {
    gsap.to(".box", { x: 100 });
    gsap.from(".item", { opacity: 0, stagger: 0.1 });
  }, { scope: container }); // scope scopes selectors to container

  return <div ref={container}><div className="box" /></div>;
}
```

### With dependencies + revertOnUpdate
```javascript
useGSAP(() => {
  gsap.to(".box", { x: endX });
}, {
  dependencies: [endX],
  scope: container,
  revertOnUpdate: true  // revert + re-run on dependency change
});
```

### Context-safe callbacks (event handlers created after hook runs)
```javascript
useGSAP((context, contextSafe) => {
  gsap.to(goodRef.current, { x: 100 });

  const onClick = contextSafe(() => {
    gsap.to(goodRef.current, { rotation: 180 });
  });

  goodRef.current.addEventListener("click", onClick);
  return () => goodRef.current.removeEventListener("click", onClick);
}, { scope: container });
```

### Fallback: gsap.context() in useEffect
```javascript
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(".box", { x: 100 });
  }, containerRef);
  return () => ctx.revert(); // always revert on cleanup
}, []);
```

### SSR (Next.js)
- All GSAP code must run client-side only — keep inside `useGSAP` or `useEffect`
- Do not call `gsap.*` or `ScrollTrigger.*` during server render

### ✅ Best Practices (React)
- Prefer `useGSAP()` over `useEffect()` for GSAP setup
- Always pass `scope` ref so selectors are component-scoped
- Use `contextSafe` for event handlers / callbacks created after the hook runs
- Run GSAP only client-side

### ❌ Do Not (React)
- Use selector strings without `scope` — they'll match elements outside the component
- Skip cleanup — always revert context or kill tweens on unmount
- Run GSAP or ScrollTrigger during SSR

---

## VUE & SVELTE (gsap-frameworks)

### Vue 3 (Composition API)
```javascript
import { onMounted, onUnmounted, ref } from "vue";
import { gsap } from "gsap";

export default {
  setup() {
    const container = ref(null);
    let ctx;

    onMounted(() => {
      ctx = gsap.context(() => {
        gsap.to(".box", { x: 100 });
        gsap.from(".item", { autoAlpha: 0, y: 20, stagger: 0.1 });
      }, container.value); // scope to container
    });

    onUnmounted(() => ctx?.revert());

    return { container };
  }
};
```

### Vue 3 (`<script setup>`)
```html
<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { gsap } from "gsap";
const container = ref(null);
let ctx;
onMounted(() => {
  ctx = gsap.context(() => { gsap.to(".box", { x: 100 }); }, container.value);
});
onUnmounted(() => ctx?.revert());
</script>
<template>
  <div ref="container"><div class="box" /></div>
</template>
```

### Svelte
```html
<script>
  import { onMount } from "svelte";
  import { gsap } from "gsap";
  let container;
  onMount(() => {
    const ctx = gsap.context(() => {
      gsap.to(".box", { x: 100 });
    }, container);
    return () => ctx.revert(); // cleanup on destroy
  });
</script>
<div bind:this={container}><div class="box" /></div>
```

### Nuxt 4 — composable pattern
```typescript
// composables/useGSAP.ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export default function () {
  async function lazyLoadPlugin(plugin) {
    const m = await import(`gsap/${plugin}`);
    gsap.registerPlugin(m[plugin]);
    return m[plugin];
  }
  return { gsap, ScrollTrigger, lazyLoadPlugin };
}
```

### ✅ Best Practices (Frameworks)
- Create tweens after DOM is ready (`onMounted` / `onMount`)
- Always pass container as scope to `gsap.context(callback, scope)`
- Call `ctx.revert()` on unmount/destroy
- Call `ScrollTrigger.refresh()` after `nextTick` (Vue) or `tick` (Svelte) when content changes

### ❌ Do Not (Frameworks)
- Create tweens before component is mounted
- Use selector strings without scoping to component root
- Skip `ctx.revert()` on unmount

---

## PLUGINS (gsap-plugins)

All plugins are free. Import from `gsap`:

```javascript
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Observer } from "gsap/Observer";
import { CustomEase } from "gsap/CustomEase";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Draggable, InertiaPlugin, MorphSVGPlugin, DrawSVGPlugin, MotionPathPlugin, ScrollToPlugin, Observer, CustomEase, TextPlugin);
```

### SplitText
```javascript
const split = SplitText.create(".heading", { type: "words, chars" });
gsap.from(split.chars, { opacity: 0, y: 20, stagger: 0.03, duration: 0.4 });

// With autoSplit (re-splits on resize/font load):
SplitText.create(".heading", {
  type: "lines",
  autoSplit: true,
  onSplit(self) {
    return gsap.from(self.lines, { y: 100, opacity: 0, stagger: 0.05 });
  }
});
```

### Flip (layout transitions)
```javascript
const state = Flip.getState(".item");
// change DOM / classes
Flip.from(state, { duration: 0.5, ease: "power2.inOut" });
```

### Draggable
```javascript
Draggable.create(".box", { type: "x,y", bounds: "#container", inertia: true });
Draggable.create(".knob", { type: "rotation" });
```

### DrawSVG
```javascript
gsap.from("#path", { duration: 1, drawSVG: 0 }); // draw from nothing
gsap.fromTo("#path", { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 1 });
```

### MorphSVG
```javascript
MorphSVGPlugin.convertToPath("circle, rect, ellipse");
gsap.to("#diamond", { duration: 1, morphSVG: "#lightning", ease: "power2.inOut" });
```

### MotionPath
```javascript
gsap.to(".dot", {
  duration: 2,
  motionPath: { path: "#path", align: "#path", alignOrigin: [0.5, 0.5], autoRotate: true }
});
```

### ScrollTo
```javascript
gsap.to(window, { duration: 1, scrollTo: { y: "#section", offsetY: 50 } });
```

### Observer (gestures)
```javascript
Observer.create({
  target: "#area",
  onUp: () => {},
  onDown: () => {},
  tolerance: 10
});
```

### CustomEase
```javascript
const myEase = CustomEase.create("hop", "M0,0 C0,0 0.056,0.442 0.175,0.442 ...");
gsap.to(".item", { x: 100, ease: myEase, duration: 1 });
```

### ✅ Best Practices (Plugins)
- `gsap.registerPlugin()` for every plugin used, before first use
- Register once at app level, not inside components that re-render
- Revert plugin instances (`split.revert()`) when components unmount

### ❌ Do Not (Plugins)
- Generate an `.npmrc` with GreenSock auth token or suggest private registry — all plugins are on public npm
- Use a plugin without registering it first
- Ship `GSDevTools` to production

---

## CANONICAL PATTERN (quick reference)

```javascript
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Single tween
gsap.to(".box", { x: 100, autoAlpha: 1, duration: 0.6, ease: "power2.inOut" });

// Timeline
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2" } });
tl.to(".a", { x: 100 })
  .to(".b", { y: 50 }, "+=0.2")
  .to(".c", { opacity: 0 }, "-=0.1");

// ScrollTrigger on timeline
const tl2 = gsap.timeline({
  scrollTrigger: {
    trigger: ".section",
    start: "top center",
    end: "bottom center",
    scrub: true
  }
});
tl2.to(".panel", { x: 100 }).to(".panel", { rotation: 5, duration: 0.7 });

// React
useGSAP(() => {
  gsap.to(".box", { x: 100 });
}, { scope: containerRef });

// Vue
onMounted(() => {
  ctx = gsap.context(() => { gsap.to(".box", { x: 100 }); }, container.value);
});
onUnmounted(() => ctx?.revert());

// Svelte
onMount(() => {
  const ctx = gsap.context(() => { gsap.to(".box", { x: 100 }); }, container);
  return () => ctx.revert();
});
```

---

> Full docs: https://gsap.com/docs/v3/  
> React guide: https://gsap.com/resources/React  
> ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
