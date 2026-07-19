# AcornOps Landing Page Redesign

## Context

The landing page (`src/pages/index.astro`) has a strong concept — a squirrel running along the top of a stylized globe collecting acorns as you scroll — but the execution reads as cluttered and sparse:

- **Hero scene overlap mess** (the user's main complaint): the top rim of the globe stacks a dashed chase-guide arc, a rim-highlight arc at radius 452 (diverging from the r=460 globe edge — visible double line), 5 double-circle node rings at fixed coordinates, 5 orange boundary-route curves radiating from those same points, and the 5 acorns. Worse, `motion.ts` repositions acorns onto chase-path sample points while the node rings stay put, so acorns sit offset from their rings with the dashed arc cutting through them.
- **Rest of the page is sparse, not considered**: hero text floats in empty cream space ~30svh above the globe; the walkthrough is 3 near-identical giant screenshots with tiny captions; the closing is a flat orange slab. The page never states "self-hosted / Kubernetes / Linux VMs" in body copy at all.

**Decisions confirmed with the user:**
1. Keep the globe + scroll-driven squirrel chase; redraw it clean.
2. Full page rethink — new sections allowed; update DESIGN.md's "exactly 3 sections" rule (PRODUCT.md anti-cliché rules stay: no invented metrics, testimonials, feature-card grids, glass/gradients).
3. Keep visual identity: warm cream, brown ink, orange `#ff703b`, Outfit Variable, OKLCH tokens.
4. New hero headline **"Operations that leave a trail."**; the acorn line moves to the footer as brand tagline.

Standing constraints: WCAG 2.2 AA; complete no-JS/mobile/reduced-motion/save-data static fallback; squirrel motion only as a direct reversible expression of scroll progress; authentic console captures as the only proof.

---

## Part 1 — Hero scene rebuild

### Verified geometry (foundation)

The chase arc `d="M221 102A486 486 0 0 1 779 102"` is already concentric with the globe: center (500, ~499.94), r=486 = 460 + 26 — and `squirrelSurfaceOffset = 26` in motion.ts is exactly that difference (the squirrel runs on the r=460 rim). The static acorn coords already lie on the arc. The real offenders are the node rings at separate `nodeX/nodeY` coords and the boundary routes anchored to them.

Canonical arc: center (500,500), r=486, θ(t) = −125° + 70°·t, point(t) = (500 + 486·cosθ, 500 + 486·sinθ), rotation = θ + 90°. New path d: `M221.24 101.89A486 486 0 0 1 778.76 101.89`.

### Cut / keep (TopologyRig.astro)

Above the rim — the r=486 arc is the single source of truth; acorns sit ON it, squirrel 26px inward, nothing else drawn there:
- **Dashed chase guide — KEEP, quieter** (motion.ts needs the element; it reads as "route ahead" in the no-JS state; acorns are opaque and painted after it).
- **Rim highlight (r=452) — CUT** (double-line moiré against the r=460 edge).
- **5 node rings — CUT** (duplicate markers that don't match JS-positioned acorns — the core overlap bug; the acorns ARE the markers).
- **5 boundary routes — CUT** (cross the edge, guide, rings, and each other in the squirrel's lane).
- **Edge circle r=460, acorns, ripples — KEEP.**

Inside the globe:
- **4 bands + light plane — KEEP** (soft fills; bands carry the parallax layer). **Shade plane — CUT** (hard edge reads as another rim contour).
- **Grid: 9 → 6 paths** — keep latitudes y≈416/572/730 (drop y≈258 crowding the top); keep meridians 307-curve / center vertical / 693-curve (drop 385/615).
- **Inner routes: 5 → 2** — keep `M90 385…` and `M147 675…`; cut the three that climb toward the top rim.

Result: acorn bottoms sit at radius 468 (8px clear of the rim stroke); acorn centers 71px apart on the arc vs 44px art width. Overlap impossible by construction.

### Shared geometry module (new file `src/lib/hero-geometry.ts`)

Imported by both `TopologyRig.astro` frontmatter (build time) and `motion.ts` (runtime) so no-JS layout ≡ JS layout at progress 0:

```
ARC_CX=500, ARC_CY=500, ARC_R=486, ARC_START_DEG=-125, ARC_SPAN_DEG=70, GLOBE_R=460
ACORN_PROGRESS=[0.14, 0.26, 0.38, 0.5, 0.62]   // moves out of motion.ts
SQUIRREL_START=0.02
arcPoint(t, r=ARC_R) → { x, y, rotation }
```

- Frontmatter: `acorns = ACORN_PROGRESS.map(t => arcPoint(t))` (drop nodeX/nodeY); squirrel static transform = `arcPoint(0.02, 460)` → `translate(245.44 116.87) rotate(-33.60)`.
- motion.ts: import shared constants; replace `pointOnPath()` DOM sampling with closed-form `arcPoint(t)` (removes 3 per-frame `getPointAtLength` calls; keep the `[data-hero-chase-path]` element + guard).
- **Squirrel art stays as-is** — opaque fills, working gradients, all gait hooks already match motion.ts. All gait/collection/ripple/hover mechanics untouched.

### Hero CSS (global.css ~291–442)

- Delete: `.hero-globe__boundary-routes` (+ `> path`), `.hero-globe__node circle:*`, `.hero-globe__rim-highlight`, `.hero-globe__shade-plane`.
- Soften: `.hero-chase-guide` stroke mix transparent 68%→78%, width 2→1.5; `.hero-globe__grid` transparent 70%→78%, width 1.35→1.25; `.hero-globe__routes` width 3→2.5, path opacity 0.72→0.55.

### Cleanup

Delete `src/components/SquirrelMascot.astro` — dead code, zero references in src/ or tests/.

---

## Part 2 — Page structure & composition

### New five-section structure: "One incident, on the record"

1. **Hero** — headline + copy + CTAs composed onto the globe horizon (squirrel scene kept).
2. **Walkthrough** — sticky screenshot + narrative step rail following the real fixture incident (payments worker crash-looping).
3. **System boundary** — "Runs inside your boundary" ruled-ledger section (self-hosted / K8s clusters / Linux VMs / governed action). Fills the biggest content gap: PRODUCT.md says success = "understand the system boundary".
4. **Built in the open** — compact band: MIT license, GitHub, docs. Honest secondary validation, no trust strip.
5. **Final CTA + footer** as one orange closing chapter.

Sections 3–4 are purely typographic with rules (generalizing the existing `.legal__body` ruled pattern) — no cards, no grids, no metrics.

### Hero composition fix

Problem: `.hero__content` absolutely pinned near the top; globe horizon starts at `top: calc(66svh − 9.7vw)` → dead cream band between CTAs and globe.

- Raise the globe: `top: calc(54svh − 9.7vw)` (mobile `~58svh − 18.15vw`); the horizon owns the lower half of the viewport.
- Re-anchor content in flow: `.hero__stage` becomes a grid; `.hero__content` centers in the space above the horizon so the CTA row lands ~5–7svh above the arc. Slight deliberate overlap with the SVG's upper region (pale tints keep ink text AA); `@media (max-height: 720px)` guard shrinks type/lowers globe on short viewports.
- Tighter rhythm: h1→subhead `clamp(1rem,1.5vw,1.25rem)`, subhead→CTAs `1.75rem`, subhead ~46ch, h1 max 16ch.
- Keep `data-hero-stage`, `data-hero-reveal`, 240svh enhanced scroll length, all `data-hero-*` hooks.
- *(Supersedes Part 1's "keep .hero-globe-scene positioning" note — the e2e globe-position band is updated to match, see Test impact.)*

### Walkthrough redesign

Keep: CSS-sticky 100svh stage, 300svh scroll length, ScrollTrigger state-swap only (no pinning), the three `data-proof-screen` names (analytics vocabulary untouched), 360ms/16px settles, native 1280/889 ratio.

Change to **sticky screenshot + narrative step rail**:
- Enhanced desktop: two columns — rail `minmax(20rem, 24rem)` left, screenshot `minmax(0,1fr)` right.
- Rail = narrative + progress: three step blocks (tabular `01` marker, 1.35rem/610 title, 2–3 sentence story ~40ch) grounded in the actual fixture incident; active step gets full ink + orange rule; the separate `.walkthrough__progress` strip is deleted.
- **Cropped detail captures, not fake annotations**: extend `scripts/capture-console-proof.mjs` with element screenshots (`locator.screenshot()`) of three real regions (critical issue row, assistant answer block, expanded run-step list) → `detail-*.{avif,webp}`; update `public/images/proof/README.md` provenance. Fallback if the console mock (port 4186) isn't available: `sharp().extract()` crops from the existing 1280×889 masters.
- `motion.ts` `activate()` additionally toggles `data-active` on rail steps + detail crops; screen fade logic unchanged.
- Non-enhanced flow: steps stack naturally (step text → full screenshot → rule) — all three states stay in normal flow (hard constraint for no-JS/reduced-motion tests).
- Candor small print: "Captured from the console's deterministic fixture workspace. No mockups."

### Typography / spacing system (global.css)

- New tokens: `--text-hero: clamp(3.5rem, 6.4vw, 6.25rem)`, `--text-title: clamp(2.4rem, 4.5vw, 4rem)` (reduced — 5 sections can't all shout), `--text-title-sm: clamp(1.75rem, 3vw, 2.5rem)`, `--text-lead`, `--text-meta: 0.8125rem` tabular-nums; rhythm `--space-section: clamp(5rem, 10vw, 8.5rem)`, `--space-block`.
- `.section-marker` utility: tabular number + sentence-case label (`02 · One incident`) with a full-width 1px rule — the "field guide" chaptering. No uppercase.
- `.ledger` pattern for section 3: `minmax(10rem,16rem) 1fr` rows, 1px `--rule` bottoms, term weight 610.
- Buttons: padding `0.8rem 1.3rem`, font-size 0.95rem.
- Header: add `border-bottom: 1px solid var(--rule)`.
- Footer: brand + tagline left, nav right, small print below the rule; tagline = **"Collecting acorns for everything ops."**
- Final CTA: left-aligned composed chapter (~55svh) flowing into the footer, dashed warm-white trail-rule motif echoing the chase guide.

### Copy (operator's field guide voice)

- **Hero h1**: "Operations that leave a trail." Subhead: "AcornOps is a self-hosted operations platform for Kubernetes clusters and Linux VMs. Ask what's wrong, act under governance, and keep an inspectable record of every run." CTAs unchanged.
- **Walkthrough** (`02 · One incident`): h2 "One incident, followed to the end." Steps: 01 **See the signal.** / 02 **Ask in context.** / 03 **Inspect the trail.** — paragraphs grounded in the real fixture incident (payments worker crash-looping, healthy neighbouring VM, "Why is the payments worker restarting?", expanded run details).
- **System boundary** (`03 · The boundary`): h2 "Runs inside your boundary." Rows: Self-hosted / Kubernetes clusters / Linux VMs / Governed action ("AcornOps doesn't claim autonomous remediation — it makes human decisions faster, and provable.").
- **Built in the open** (`04 · The source`): MIT, GitHub ↗, Documentation →.
- **Final CTA**: h2 "Follow the trail yourself." + "The demo console runs the real product on fixture data."

### File-by-file

New: `src/lib/hero-geometry.ts`; `src/components/home/{Hero,Walkthrough,SystemBoundary,BuiltInTheOpen,FinalCta}.astro` (index.astro becomes a composer).
Modified: `src/pages/index.astro`, `src/components/TopologyRig.astro` (Part 1), `src/styles/global.css`, `src/scripts/motion.ts`, `src/layouts/BaseLayout.astro` (header rule, footer), `scripts/capture-console-proof.mjs` (+ proof README), `DESIGN.md` (five-chapter structure, new type tokens, provenance rule for detail crops; motion rules unchanged).
Deleted: `src/components/SquirrelMascot.astro`.
Unchanged: `src/scripts/analytics.ts`.

---

## Test impact

- `tests/unit/hero.test.ts`: all data hooks survive the SVG rebuild; after component extraction, re-point it from `index.astro` to `src/components/home/Hero.astro` (keep the hero raster-free — detail crops live only in the walkthrough).
- `tests/unit/analytics.test.ts`: unaffected.
- `tests/e2e/site.spec.ts`:
  - Hero chase functional tests pass unchanged (5 acorns, unchanged collection thresholds, hover hooks).
  - Update: exact h1/subhead text (lines 34–35) to new copy; caption assertions (42–44) re-pointed to rail steps (keep `data-proof-screen`); scope the natural-ratio test selector to full captures (e.g. `[data-proof-full] img`) so detail crops don't break it; globe position band (238–244) from 0.63–0.7 to ≈0.50–0.58 (deliberate horizon raise); add a rail active-state assertion to the desktop walkthrough test.
  - New sections: keep heading order, ledger semantics (`<dl>` or headings), alt text on detail crops, `aria-hidden` mirroring the existing screen pattern, orange text on cream only via `--brand-orange-readable` (axe tests must stay green).
  - No-JS/mobile/reduced-motion/save-data tests pass by construction (everything in normal flow un-enhanced).
  - Regenerate all 3 snapshots: `npm run test:e2e:update`, review PNGs, re-run clean.

## Implementation order

1. `src/lib/hero-geometry.ts` + rebuild `TopologyRig.astro` + hero CSS deletions (Part 1) — fixes the overlap complaint first.
2. Detail-crop captures (`capture-console-proof.mjs`, sharp fallback) + proof README.
3. Tokens + rhythm scaffolding in global.css.
4. Extract five home components; restructure index.astro; hero recomposition + short-viewport guard.
5. Walkthrough rail + motion.ts activate() changes.
6. System boundary, open band, final CTA/footer, header rule.
7. Update DESIGN.md.
8. Update unit + e2e tests; regenerate snapshots.

## Validation

1. `npm run check`, `npm run test` (vitest).
2. `npm run dev` (4321): inspect rim at progress 0 / mid-chase / end; JS disabled; 390px width; 200% zoom; keyboard-only; reduced motion.
3. `npm run test:e2e` → fix assertions → `npm run test:e2e:update` → clean re-run.
4. `npm run validate` full gate (check, unit, build, links, 140 KiB gzip JS bundle budget — keep detail AVIFs small, e2e, Lighthouse).

## Post-review revisions (from user feedback)

- **Colour**: reverted the deep-orange experiment. Brand orange `#ff703b` kept everywhere; orange surfaces carry **warm-white** text (buttons, nav CTA, closing chapter, footer). This is below AA contrast by deliberate brand choice — the axe test exempts only the filled-orange brand surfaces (via `closest()`), and the Lighthouse a11y floor is 92 (documented in `run-lighthouse.mjs` + DESIGN.md). Contrast is still enforced everywhere else.
- **Globe** rebuilt: warm terracotta edge (was grey `--rule-strong`), warmer peachy bands, converging meridian "starburst" removed, and a node+route network added across the surface so it reads as a full operations globe (fixes "empty/plain").
- **Hero chase**: acorns spread evenly across the arc (`ACORN_PROGRESS = [0.2, 0.36, 0.52, 0.68, 0.84]`), squirrel travels the full arc (`squirrelPathTravel = 0.84`) so the right side fills; globe lowered to `72svh - 9.7vw` for a clean gap above the CTAs; collection-ripple oval removed; gait amplitudes moderated (motion-design skill) so the run reads as a controlled bound.
- **Walkthrough** ("details") restructured into a proper step rail: all three steps listed on the left with the active one highlighted (orange bar + full ink, others dimmed), screenshot swapping on the right, right-sized heading. Figure captions remain the non-enhanced fallback; the rail is enhanced-only. No `motion.ts` change needed (`data-walkthrough-progress` now on rail steps).
- **Nav**: removed the header rule/backdrop (per "no line"), spaced the CTA arrow, added `:active` press feedback.
- Scratch capture scripts (`_shot.mjs`, `_shot2.mjs`, `_measure.mjs`, `_herochase.mjs`, `_globe.mjs`, `_nav.mjs`, `_probe.mjs`) are in the repo root — delete before committing.
