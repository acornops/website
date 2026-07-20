# AcornOps Website Design System

## Direction

The site is a calm operator workspace for a platform engineer evaluating AcornOps on a bright office monitor between incident reviews. The homepage follows one product-led story and gives each chapter enough room to land. Nothing should feel like an alarm unless it represents an actual alert.

Warm off-white surfaces, dark brown ink, quiet rules, and one bright orange accent make the site feel controlled and human. Authentic console captures carry the product argument. The navigation and footer use the canonical management-console wordmark: a 36-pixel squirrel tile, 12-pixel gap, and tightly tracked lowercase `acornops`, with brown or cream `acorn` and bright-orange `ops`. The homepage hero may use the squirrel when it supports a purposeful operational story.

The canonical wordmark, orange activation controls, and the two compact orange infrastructure labels are recorded with `data-brand-contrast-exception`. This is a narrow brand exception: bright-orange wordmark text and warm-white text on orange fills match the management console. Automated accessibility scans exclude only these marked elements, and a regression test fixes the allowed scope at two wordmarks, three activation links, and two infrastructure labels. No other text or control may use the exception.

## Color

Use OKLCH values and semantic roles.

- Canvas: `oklch(0.985 0.006 85)` (`#FCFAF6`)
- Surface: `oklch(0.996 0.004 85)` (`#FFFEFB`)
- Muted surface: `oklch(0.962 0.012 74)` (`#F7F1EA`)
- Rule: `oklch(0.925 0.012 74)` (`#EBE5DE`)
- Ink: `oklch(0.3 0.008 72)` (`#302D29`)
- Muted ink: `oklch(0.54 0.025 54)` (`#7B6B61`)
- Brand orange: `oklch(0.712 0.187 39.7)` (`#FF703B`)
- Strong orange: `oklch(0.651 0.179 38.9)` (`#E65F2F`)
- Bright orange: `oklch(0.755 0.154 42.2)` (`#FF8B5C`)
- Readable orange: `oklch(0.48 0.145 38.9)` (`#AC4118`)
- Soft orange: `oklch(0.96 0.035 52)` (`#FFECDD`)
- Dark canvas: `oklch(0.178407 0.002613 67.659)` (`#121110`)
- Dark surface: `oklch(0.221666 0.007407 48.368)` (`#1E1A18`)
- Dark strong surface: `oklch(0.281925 0.00766 31.115)` (`#2D2827`)
- Dark rule: `oklch(0.379934 0.00707 31.086)` (`#464140`)
- Dark text: `oklch(0.960674 0.00508 48.686)` (`#F5F1EF`)
- Dark muted text: `oklch(0.712881 0.005998 31.059)` (`#A6A1A0`)

The website uses the management console's canonical light and dark tokens. Orange is limited to activation, focus, and selected states. Large content chapters use neutral console surfaces rather than orange fills. `--brand-orange-readable` is reserved for small orange text on light surfaces.

## Typography

Use self-hosted Outfit Variable with a metric-adjusted system fallback. Hierarchy comes from scale and weight rather than decoration.

Scale and rhythm are held in tokens (`--text-*`, `--space-*`) in `:root` so every section shares one system.

- Hero (`--text-hero`): fluid `clamp(3.5rem, 6.4vw, 6.25rem)`, weight 610, compact line height
- Section title (`--text-title`): fluid `clamp(2.4rem, 4.5vw, 4rem)`, weight 610
- Small section title (`--text-title-sm`): fluid `clamp(1.75rem, 3vw, 2.5rem)`, for supporting chapters
- Lead (`--text-lead`): `clamp(1.05rem, 1.5vw, 1.25rem)`, weight 400, maximum roughly 52ch
- Body: 1rem, weight 400, maximum roughly 56ch
- Metadata (`--text-meta`): `0.8125rem`, tabular numerals, for section markers and step numbers

Section titles are deliberately smaller than the hero so the page keeps a clear hierarchy. Chapters open directly with their heading. Do not add numbered eyebrows, ruled kickers, or chapter labels above section titles.

## Homepage Structure

The homepage establishes two core product loops across six chapters:

1. A centered, scroll-responsive hero composed onto the globe chase scene: a six-beat headline and supporting incident story with two persistent actions. The static opening beat contains the whole arc for mobile, reduced-motion, data-saving, and no-JavaScript visitors. On enhanced desktops, each collected acorn advances one reversible beat: promise, workload failure, alert, human-selected triage, capability discovery across MCP servers/skills/tools, and root cause with inspectable evidence. The squirrel and acorns carry the progression without extra labels or progress controls.
2. A product walkthrough of one real incident, the payments worker crash-loop, shown as a sticky narrative: a step's number, title, and story beside the console capture for that state (workspace overview, assistant answer, expanded run trace), with a three-step progress rail. Captures are non-interactive product evidence with deterministic fixture provenance. On mobile, no-JS, and reduced motion the steps stack in normal flow.
3. A "Workflows and Agents" chapter establishes the second core product loop in a ruled sequence: reusable intent, direct or coordinated Agents, governed execution, and durable evidence. It stays code-native until deterministic workflow and Agent captures are available.
4. A "Runs inside your boundary" chapter states the system boundary in plain text and separates investigation from execution.
5. A compact "Built in the open" band pointing to the source and docs.
6. A final call to action flowing directly into the footer.

New sections must earn their place against the one-incident story and stay purely typographic where they are not showing the console. Do not add trust strips, invented metrics, testimonials, feature-card grids, abstract incident UI, or duplicated proof grids. The homepage squirrel is reserved for the purposeful globe chase in the hero. The console captures render at their native `1280 / 889` ratio. Use `width: auto` or `width: 100%` with `height: auto`, and never force both dimensions. All product imagery must be deterministic fixture captures with recorded provenance (`public/images/proof/README.md`); no mockups or hand-drawn UI.

## Motion

Motion is quiet, functional, and progressively enhanced.

- Fine pointers receive Lenis smooth scrolling unless reduced motion or data saving is enabled.
- Fine-pointer desktops at least `64rem × 45rem` use a CSS-sticky `100svh` walkthrough stage across a `270svh` scroll range. ScrollTrigger maps reversible scene progress; it does not pin the stage.
- Detect, Investigate, and Verify crossfade in one overflow-hidden console frame. Captures remain at native scale with no transform so dense console text stays sharp.
- The narrative rail, orange progress trace, and subtle frame-shadow shift support the scene changes. There is no looping, bounce, blur, or layout-property animation.
- The hero enters once over 480 milliseconds with a short stagger.
- The hero uses a CSS-sticky `100svh` stage across a `320svh` scroll range. Each acorn collection reversibly swaps both the headline and supporting story copy while the actions stay fixed.
- The hero squirrel may move only as a direct, reversible expression of scroll progress. Do not loop decorative motion or hide the complete static summary before JavaScript initializes.

## Responsive and Fallback Behavior

Mobile layouts, coarse pointers, reduced-motion users, data-saving users, and JavaScript-disabled contexts receive a complete static hero, native scrolling, and all three product states in normal flow. Maintain 44-pixel targets, visible focus, no horizontal overflow, readable content at 200 percent zoom, and equivalent access to every caption and screenshot.
