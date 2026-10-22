# SWIFT v3 — "Instrument" direction (design brief for builders)

A brand-new site for Swift Junk Removal (Las Vegas + Henderson). It is NOT an edit of the older sites:
`C:\Users\Cleo\Desktop\swift-junk-removal\` (cartoon drive-by ride) is **reference only for wording**.
**Never edit anything outside `C:\Users\Cleo\Desktop\swift-junk-removal-v3\`.**

The wording stays exactly as in the original (copy it from the reference `index.html`; line numbers are given per section).
Only the presentation changes: from friendly cartoon to **powerful, minimal, futuristic, professional** — a
$1M-site feel where every detail looks considered and effortless, but is technically deep.

## The idea
The business **removes things**, so the whole site is about *subtraction*: noise becomes order.
The hero turns a photo of a real junk pile into a point cloud, flags the junk in copper, sweeps it off to the right
behind a chevron-shaped front, and leaves an ordered dot grid. Everything below speaks the same language:
huge confident type, hairlines, mono "instrument" readouts, one signal colour, diagonal cuts at the chevron angle.
Think precision instrument / mission control / Swiss poster, not "tech startup gradient".

## Tokens (css/base.css — use the variables, never hard-code)
- Colour: `--ink #060708` (void), `--ink-2/-3`, `--bone #ecebe4` (paper), `--copper #e8803f` (the ONLY accent), `--copper-deep #b4501a` (copper text on bone),
  `--mute-d` / `--mute-l` (secondary text on ink / bone), `--line-d` / `--line-l` (hairlines).
  Copper must stay under ~5% of any screen. No other hues. No gradients except as light (dots, glows) — never decorative colour blends.
- Type: `--f-display` Archivo (variable: weight 100–900 **and width 62–125 via `font-stretch`**), `--f-body` Geist, `--f-mono` Geist Mono.
  Display = uppercase, weight 900, `font-stretch` 62–75%, tight negative tracking, line-height ~.85 (see `.h2`, `.disp`). Mono labels = 10.5–12px, uppercase, `letter-spacing:.12–.14em`.
  Body 15–17px Geist. Do NOT use text-stroke on the variable display font (overlap artefacts).
- Shape: sharp rectangles. The chevron is the only curve-free "ornament": buttons already have a pointed right edge (`.btn`). Section joins are diagonals (`.joint`). Radii: none (0). Circles only for dots/the cursor.
- Grid: 12 columns, `--gut` side padding, `.wrap` (max 1680). Hairline column rules are allowed as texture.
- Motion: easing `--ease` (expo-out-ish) and `--ease-io`. Slow, heavy, precise. No bounces, no springy overshoot, no emoji, no cartoon.

## Page order and tone (already wired in `src/index.html`)
hero (ink, MINE) → ticker (ink, MINE) → `quote` (bone) → `services` (ink) → `how` (bone) → `proof` (ink) → `promises` (bone) → `faq` (ink) → `finale` (copper, MINE) → footer (ink, MINE).
Diagonal `.joint` elements between sections are already placed. **Each section must end with `padding-bottom` of at least `calc(var(--joint) + clamp(40px,6vw,100px))`** so the diagonal never covers content.
Alternate tone = alternate dark/light. On `bone` sections add class `on-bone` (flips eyebrow/lede colours). Never use `z-index` > 2 inside a section (nav is 50, joints are 3).

## Files and ownership (no two builders touch the same file)
Every section = one HTML fragment + one CSS file + one JS file, all already created as stubs:
`src/sections/<name>.html`, `css/<name>.css`, `js/<name>.js`.
**Do not edit `src/index.html`, `css/base.css`, `css/hero.css`, `js/main.js`, `js/hero-gl.js`.** (If you need a change there, say so in your report.)
After editing a fragment run `node _dev/build.cjs` (assembles `index.html`; idempotent). Open `index.html` — never edit the built file.
Scope all your selectors under your section's root class/id (`#quote`, `#services` …) so nothing leaks. Use unique ids.
Each JS file is an IIFE, no globals besides `window.SWIFT` which `main.js` provides.

## Shared kit (from main.js)
- `<h2 class="h2 split">Words here.</h2>` → words rise out of masks when scrolled into view (`.split`, auto-scanned). Use it for every big heading (keep `<em>` / `<br>` children if needed).
- `data-r` on any element → fades/rises in (optionally `style="--d:.1s"` delay).
- `SWIFT.raf(fn(t, dt))` — shared per-frame loop. `SWIFT.track(el)` → 0..1 progress through a tall pinned track (el height = N×100svh; inner `position:sticky; top:0; height:100svh`). `SWIFT.cross(el)` → 0..1 as an element crosses the viewport.
  `SWIFT.reduce` (prefers-reduced-motion), `SWIFT.coarse` (touch device), `SWIFT.lenis` (smooth-scroll instance or null).
- `data-cur="Drag"` on an element shows that label in the custom cursor ring. `.mag` = magnetic hover.
- Buttons: `.btn` (outline, hover fill), `.btn--cu` (copper), `.btn--ink` (on bone), `.btn--sm`. Text link: `.link`. Eyebrow: `.eyebrow` (`<b>` inside is the copper bit).
- Icons: `<svg><use href="#i-arrow"/></svg>`, `#i-phone`, brand mark `#mk`.
- Anchors: any `<a href="#id">` scrolls smoothly (main.js). Links that start a quote carry `data-service="garage|furniture|construction|commercial|yard|general"` and point to `#quote`; the quote builder listens for them (see its section).

## Quality bar (the owner's words: "$1M website… insane complex but effortless… masterpiece level award")
1. Every section needs **one signature idea** that is genuinely unusual and still obviously a professional business site.
2. Restraint: big type, lots of air, few elements, perfect alignment to the grid. Boldness comes from scale and contrast, not decoration.
3. All interactive things have hover/focus/active states, keyboard access, ARIA. Contrast ≥ 4.5:1 for body text (check mute colours on their backgrounds).
4. Mobile (390px) is a first-class design, not a squashed desktop. No horizontal overflow. Touch targets ≥ 44px. Pinned/scrubbed sections degrade to simple stacked layouts on narrow/touch screens.
5. `prefers-reduced-motion`: everything still readable and complete without animation.
6. Performance: no layout thrash in scroll handlers (read then write, transforms/opacity only), pause work when off-screen (IntersectionObserver).
7. Be your own harshest critic: screenshot it (`node _dev/shoot.cjs`), look at every frame at 1512, 1280, 820, 390 widths, list what is weak/generic/cluttered/misaligned, fix, repeat until you would put your name on it.
8. No invented facts: no fake stats, reviews, "years in business", prices, licences. Placeholder media must be honest and labelled.

## Screenshots
`node _dev/shoot.cjs <desktop|laptop|wide|tablet|phone> <name> --sel "#quote|#services"` (scrolls each selector to the top of the viewport and shoots; images land in `_dev/shots/`).
`--y 0,1200` shoots absolute scroll offsets; `--hero 0,.5,1` is for the hero only; `--full` takes a full-page capture; `--q "k=v"` adds query params.
Read the PNGs to judge. For scroll-scrubbed sections, shoot several offsets. Puppeteer is headless Chrome with software WebGL.

## Copy source (reference, read-only)
`C:\Users\Cleo\Desktop\swift-junk-removal\index.html` — quote 422–546, services 548–628, how 630–702, proof 704–725, promises 727–749, faq 752–816, finale 818–835, footer 838–883.
Quote form logic to reuse (adapt, don't import): `C:\Users\Cleo\Desktop\swift-junk-removal\js\quote.js`; ZIP check `SW.zone` in `js\ui.js` lines 1–20.
Photos (copied): `img/garage.jpg`, `furniture.jpg`, `construction.jpg`, `commercial.jpg`, `yard.jpg` (1168px wide, realistic Las Vegas scenes).
Phone `(702) 929-6544` (`tel:+17029296544`), email `swift-junkremoval@outlook.com`. Form endpoint: `https://formsubmit.co/ajax/swift-junkremoval@outlook.com`.
