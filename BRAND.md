# Lumitrail Brand Guidelines

---

## 1. Name & Meaning

**Lumitrail** is a compound of two roots:

- **Lumi** — from _lumen_, Latin for light. The same root gives us "illuminate," "luminous," and "luminary." Light is not decorative here; it is the mechanism of discovery.
- **Trail** — a path that has been walked, left behind, and made visible for others. A trail implies movement, progress, and a world being steadily uncovered.

Together the name describes a literal and metaphorical act: a trail of light burning through fog, revealing the world one step at a time. The user is the source of that light. Every walk they complete makes the map a little less dark.

**Metaphor in depth.** The fog is not hostile — it is simply the unknown. The world is always there, waiting. Lumitrail treats exploration as an act of revelation: you do not conquer terrain, you _illuminate_ it. The amber glow of the comet trail in the icon, fading into teal hex tiles behind it, visualises this precisely.

**Why not the alternatives:**

| Candidate | Problem                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Wisp      | Implies something fleeting and insubstantial. A wisp drifts; it does not trail. Reads as ghostly or fragile.                     |
| Fathom    | Strong word but carries ocean/depth connotations. Suggests downward, interior movement — the opposite of outdoor forward motion. |
| Lumora    | Phonetically pleasant but passive. Sounds like a wellness or spa brand; lacks the spatial, kinetic energy the product needs.     |

Lumitrail is active, spatial, and memorably compound. It survives translation (the Latin root is recognised across Romance languages) and works as both a noun and a verb.

---

## 2. Tagline

**Primary — "Walk the world out of the fog."**

This is the full thesis of the product in one sentence. "Walk" roots it in the physical act the user performs. "The world" positions the scale as ambitious — not a neighbourhood, not a city, the world. "Out of the fog" makes the mechanism explicit: movement equals revelation. It is declarative and confident without being aggressive.

**Secondary — "Walk. Reveal. Explore."**

Three imperatives, each one beat long. Used in contexts where the primary tagline is too long (app store subtitles, splash screens, social captions). The three words map to the three stages of the user loop: you walk a route, the map reveals, and the revealed territory invites further exploration. Order is intentional and non-negotiable.

---

## 3. Tone of Voice

**Encouraging, not patronising.** The app celebrates every walk, including the short and ordinary ones. Encouragement is specific and earned ("You uncovered 12 new tiles today") rather than hollow ("Great job!"). Never condescend.

**Adventurous, not extreme.** Lumitrail is for anyone who walks: commuters, dog-walkers, hikers, urban explorers. The tone is curious and expansive, not adrenaline-chasing. Avoid language that implies danger, competition, or athletic performance unless the user has opted into a challenge context.

**Precise.** Numbers and distances matter. "A 3.2 km walk" is better than "a long walk." The fog metaphor calls for clarity — the product literally makes the unclear clear, so copy should do the same.

**Warm but not casual.** The colour palette runs amber and teal, not primary red-green-blue. The writing should feel the same way: grounded, honest, a little poetic when the moment calls for it, but never sloppy or ironic.

**Forward-facing.** Lumitrail is about what is still unexplored, not what has already been done. Copy should orient the user toward the next walk, the next tile, the next tier — not dwell on the past.

---

## 4. Color Palette

All token names correspond directly to `src/app/theme.ts`. Treat this table as the single source of truth for when and why each colour is used.

| Token         | Hex                      | Semantic meaning                                     | Usage                                                                                                                                                |
| ------------- | ------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ink`         | `#0F1B2D`                | Deep fog — the unexplored world                      | Deepest background layer; unexplored map tiles; the canvas behind everything                                                                         |
| `surface`     | `#17263B`                | Lifted fog — a surface that has emerged              | Primary card and panel backgrounds; one step above ink                                                                                               |
| `surfaceAlt`  | `#1E3149`                | A lighter surface variant                            | Secondary card backgrounds, modals, sheet surfaces; creates depth without adding a new colour family                                                 |
| `lumen`       | `#FFB74D`                | Warm light dispelling fog — the primary brand colour | Primary interactive elements (buttons, CTAs, active tab indicators); the trail itself; anything that represents the user's momentum                  |
| `lumenBright` | `#FFC97A`                | Amplified lumen — full light                         | Hover and pressed states on lumen elements; comet head highlights; badge highlights                                                                  |
| `aurora`      | `#38E0A6`                | Discovery and progress                               | Newly revealed tiles; streak completion states; progress indicators; achievement badges; anything that signals "this just became known"              |
| `sky`         | `#5B8DEF`                | Cool secondary accent                                | Hyperlinks; informational UI (tooltips, info banners); secondary actions that are not the primary CTA; stat labels                                   |
| `text`        | `#E8EEF5`                | Starlight on fog-blue — primary readable text        | All body copy, headings, labels; optimised for contrast against ink and surface                                                                      |
| `textMuted`   | `#8FA3BC`                | Dimmed starlight — secondary text                    | Timestamps, metadata, captions, placeholder text, disabled labels                                                                                    |
| `danger`      | `#FF6B6B`                | Alert red                                            | Destructive actions, error states, GPS loss warnings; use sparingly                                                                                  |
| `success`     | `#38E0A6`                | Alias of aurora                                      | Confirmation states, completed challenges, successful saves; same colour as aurora to reinforce "progress = discovery"                               |
| `warning`     | `#FFB74D`                | Alias of lumen                                       | Cautionary states (battery low, GPS inaccurate); same colour as lumen intentionally — a warning is a prompt to act, which is the brand's core action |
| `fogOverlay`  | `rgba(15, 27, 45, 0.86)` | Semi-transparent fog fill                            | Painted directly over unexplored map tiles; must remain semi-transparent so the underlying map remains faintly visible                               |

**Conceptual note on aliases.** `success` and `warning` share hex values with `aurora` and `lumen` respectively. This is intentional. In the Lumitrail world, a warning is an invitation to walk (lumen — warm light), and a success is a moment of discovery (aurora — teal revelation). The system reinforces meaning rather than just labelling states.

---

## 5. Tier Badge Colors

Tiers represent how much of the world a user has illuminated. The progression is modelled on natural materials advancing from earth to sky.

| Tier     | Hex       | Usage                                                     |
| -------- | --------- | --------------------------------------------------------- |
| Bronze   | `#CD7F32` | Entry tier; warm earth tone; the trail begins             |
| Silver   | `#C7D0DB` | Mid tier; cool neutral; the fog is thinning               |
| Gold     | `#FFC24B` | High tier; close to lumen; near-full illumination         |
| Platinum | `#7FE7FF` | Top tier; icy sky-blue; beyond the fog, into the open sky |

The progression from warm browns through neutrals to cool light mirrors the product metaphor: starting in the foggy earth-toned world and ascending toward clarity and sky.

---

## 6. Typography

| Role                       | Typeface      | Sizes used                                 | Notes                                                                                                                                                                               |
| -------------------------- | ------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display / headings / stats | Space Grotesk | xl (28px), xxl (40px)                      | Geometric sans with distinctive letterforms. Used for anything that needs to feel like a milestone or number — screen titles, distance stats, tier names. Do not use for body copy. |
| Body / UI text             | Inter         | xs (12px), sm (14px), md (16px), lg (20px) | Highly legible at small sizes on dark backgrounds. Used for all labels, descriptions, captions, form fields, and navigation. The workhouse of the UI.                               |

**Size scale reference:**

| Token | px  | Common use                                             |
| ----- | --- | ------------------------------------------------------ |
| xs    | 12  | Captions, timestamps, micro-labels                     |
| sm    | 14  | Secondary body text, UI metadata                       |
| md    | 16  | Default body copy, standard UI labels                  |
| lg    | 20  | Section sub-headings, emphasis                         |
| xl    | 28  | Screen titles (Space Grotesk)                          |
| xxl   | 40  | Hero stats — km walked, tiles revealed (Space Grotesk) |

---

## 7. The Icon

**File location:** `brand/icon.svg`

**Dimensions:** 1024 × 1024 px, clipped to a rounded rectangle (radius 180) matching the iOS/Android app icon shape.

**Visual description.** A deep fog-blue canvas — a gradient from `#0F1B2D` at top-left to `#17263B` at bottom-right — is the starting state: the unexplored world before a single step has been taken. A sparse field of near-invisible white dots reads as stars, reinforcing scale and the sense of a wide, waiting world.

The left third of the canvas is deliberately still in fog. Soft radial fog overlays and semi-transparent ellipses obscure that side, conveying that what is left unwalked remains hidden.

Moving rightward, a cluster of hexagonal tiles emerges. Hexagons are the natural tessellation of exploration maps and immediately signal "map grid" to the user. The leftmost hexagons are faint outlines barely visible through the fog (`opacity: 0.3`). Moving right, they become more solid and more brightly lit, transitioning in colour from teal (`#38E0A6`) on the left — newly discovered — to amber (`#FFB74D`) on the right, nearest the light source. The centre hex carries a double-stroke inner highlight; the right amber hex does the same. This gradient from teal to amber across the cluster encodes the product's core arc: discovery (aurora teal) becoming warmth and momentum (lumen amber).

A sweeping comet trail curves from the lower-left to the upper-right across the composition. Its outer glow is a soft, blurred amber gradient that fades to transparency at the left and becomes fully opaque at the right. A tight amber core line rides along the centre; a near-white `#FFF0C0` hairline marks the hottest point. The trail reads as movement — the user's path through the world — and it literally dispels the fog it crosses.

At the far right, the comet head is a radial bloom: a large soft glow in amber, a smaller warm-white core, and a pure white centre dot. Comet-tail sparks trail back to the left in diminishing sizes, giving the motion a sense of velocity.

A faint teal elliptical shimmer sits behind the hex cluster, grounding the aurora glow.

**What the icon communicates.** In two seconds, it tells the viewer: fog, light, movement, discovery. The fog-blue of the background is the world before you walk it. The comet trail is your walk. The glowing hex tiles are the world after you have walked through it. The image is the entire product thesis in one frame.

---

## 8. Do / Don't Usage Rules

### Name

| Do                                                         | Don't                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| Write the name as **Lumitrail** — one word, capital L only | Write "LumiTrail", "lumitrail", "LUMITRAIL", or "Lumi Trail" |
| Refer to the app as "Lumitrail" in all contexts            | Abbreviate to "LT", "Lumi", or "the trail app"               |

### Taglines

| Do                                                                 | Don't                                              |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| Use the primary tagline verbatim: "Walk the world out of the fog." | Reword, shorten, or paraphrase the primary tagline |
| Use the secondary tagline verbatim: "Walk. Reveal. Explore."       | Reorder the three words or add a fourth            |
| Choose one tagline per placement                                   | Stack both taglines in the same surface            |
| End the primary tagline with a full stop                           | Drop the full stop from the primary tagline        |

### Color

| Do                                                                     | Don't                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Use `lumen` (#FFB74D) as the sole primary interactive colour           | Use `aurora` as a CTA or button colour — it signals discovery/completion, not action  |
| Use `ink` as the base background for all screens                       | Use white or light backgrounds — Lumitrail is a dark-first product                    |
| Use `fogOverlay` at its specified opacity (0.86) over unexplored tiles | Make the fog fully opaque — the map must remain faintly visible underneath            |
| Limit `danger` to genuine error or destructive states                  | Use `danger` for decorative accent or warning states — use `warning` (lumen) for that |
| Respect the tier colour order (bronze → silver → gold → platinum)      | Assign tier colours arbitrarily or reuse them outside the tier system                 |

### Typography

| Do                                                                  | Don't                                                           |
| ------------------------------------------------------------------- | --------------------------------------------------------------- |
| Use Space Grotesk exclusively for display, headings, and hero stats | Use Space Grotesk for body copy, labels, or any text under 20px |
| Use Inter for all body, UI, and label text                          | Substitute system fonts (San Francisco, Roboto) in shipped UI   |
| Follow the defined size scale tokens (xs through xxl)               | Introduce arbitrary point sizes outside the defined scale       |

### Icon

| Do                                                                  | Don't                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Use `brand/icon.svg` as the canonical source for all icon exports   | Recreate the icon from scratch or approximate it in a raster editor          |
| Export at the sizes required by each platform from the SVG source   | Upscale a rasterised version of the icon                                     |
| Maintain the rounded-rect clip shape when exporting for app stores  | Present the icon as a circle, sharp square, or any other shape               |
| Keep the fog on the left and the comet trail moving left-to-right   | Flip, rotate, or mirror the icon composition                                 |
| Preserve the teal-to-amber colour transition across the hex cluster | Recolour the hexes, trail, or comet independently of the design token values |
