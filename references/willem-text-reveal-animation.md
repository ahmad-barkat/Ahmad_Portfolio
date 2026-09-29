# Willem Text Reveal Animation Reference

This document preserves the exact GSAP text reveal animations extracted from the Willem sequence for future application to any headers, titles, or navigation elements.

---

## 1. Letter-by-Letter Character Reveal ("Willem ©" style)

### CSS Structure
```html
<div class="reveal-container" style="overflow: hidden; display: flex; align-items: flex-end;">
  <span class="reveal-letter" style="display: block; position: relative;">W</span>
  <span class="reveal-letter" style="display: block; position: relative;">i</span>
  <span class="reveal-letter" style="display: block; position: relative;">l</span>
  <span class="reveal-letter" style="display: block; position: relative;">l</span>
  <span class="reveal-letter" style="display: block; position: relative;">e</span>
  <span class="reveal-letter" style="display: block; position: relative;">m</span>
  <span class="reveal-letter" style="display: block; position: relative; margin-left: 0.25em;">©</span>
</div>
```

### GSAP Animation
```javascript
gsap.from(".reveal-letter", {
  yPercent: 100,
  duration: 1.25,
  ease: "expo.out",
  stagger: 0.025,
});
```

Within a Timeline:
```javascript
tl.from(letters, {
  yPercent: 100,
  duration: 1.25,
  ease: "expo.out",
  stagger: 0.025,
}, "< 1.2"); // or position of choice
```

---

## 2. Nav Link / Word Reveal ("Top Nav" style)

### CSS Structure
```html
<nav class="nav-container" style="overflow: hidden; display: flex; gap: 1em;">
  <a href="#" class="reveal-link" style="display: block; position: relative;">Link 1</a>
  <a href="#" class="reveal-link" style="display: block; position: relative;">Link 2</a>
  <a href="#" class="reveal-link" style="display: block; position: relative;">Link 3</a>
</nav>
```

### GSAP Animation
```javascript
gsap.from(".reveal-link", {
  yPercent: 100,
  duration: 1.25,
  ease: "expo.out",
  stagger: 0.1,
});
```

---

## TypeScript Helper File
Available in: `src/components/animations/text-reveal-animation.ts`
Exports:
- `animateLettersReveal(elements, options)`
- `animateNavLinksReveal(elements, options)`
- `addLetterRevealToTimeline(tl, elements, position, options)`
- `addNavLinksRevealToTimeline(tl, elements, position, options)`
