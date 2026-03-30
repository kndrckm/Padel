# Design System: The Heritage Court Manual

## 1. Overview & Creative North Star: "The Modern Alpinist"
The Creative North Star for this design system is **"The Digital Country Club."** We are intentionally moving away from the "SaaS-blue" and "heavy-grid" layouts that dominate sports apps. Instead, we are channeling the heritage of 1970s racquet clubs—think high-end stationery, sun-drenched courts, and tactile prestige—reimagined through a minimalist, modern lens.

To achieve this, we break the "template" look through **intentional asymmetry**. Hero sections should feature oversized, off-center typography that overlaps image containers. We use high-contrast typography scales (the juxtaposition of a heavy serif and a light sans-serif) to create an editorial feel that feels more like a premium magazine than a utility tool.

---

## 2. Colors: Tonal Sophistication
This palette is designed to feel warm, optimistic, and expensive. We rely on the "Vibrant Sunshine" (`primary`) to provide energy against a "Soft Cream" (`surface`) foundation.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit on a `surface` background to create a "well" effect.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine paper sheets. Use the surface-container tiers to define importance:
- **Base Layer:** `surface` (#fcfaee) for the main background.
- **Sectioning:** Use `surface-container-low` (#f6f4e8) for large grouped content areas.
- **Interactive Cards:** Use `surface-container-lowest` (#ffffff) to make interactive elements "pop" with a clean, crisp white.

### The "Glass & Gradient" Rule
To elevate the "Vintage" vibe into "Modern Tech," use **Glassmorphism** for floating action buttons or navigation bars. Use `surface` at 80% opacity with a `20px` backdrop-blur. 
- **Signature Texture:** Apply a subtle radial gradient on primary CTAs, transitioning from `primary` (#705d00) at the bottom-right to `primary_container` (#ffde59) at the top-left. This mimics the curve of a Padel ball and adds three-dimensional "soul."

---

## 3. Typography: The Editorial Contrast
We use a "High-Low" typographic approach to signal both tradition and efficiency.

*   **Display & Headlines (Noto Serif):** These are your "Brand Moments." Use `display-lg` for tournament titles and `headline-md` for section headers. The serif font conveys authority and the "Vintage Court" legacy.
*   **Body & Titles (Work Sans):** These are your "Utility Moments." Use `body-lg` for player bios and `title-sm` for navigation. The sans-serif keeps the app feeling fast, legible, and tech-forward.
*   **The Signature Move:** Use `label-sm` in all-caps with `0.1rem` letter spacing for "over-titles" (the small text above a headline). This mimics high-end print journalism.

---

## 4. Elevation & Depth: Tonal Layering
Avoid the "material" look of heavy shadows. We convey depth through light and color.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on top of a `surface-container-low` background. The slight shift from cream to pure white creates a soft, natural lift.
*   **Ambient Shadows:** If a floating effect is required (e.g., a Modal), use a diffused shadow: `box-shadow: 0 20px 40px rgba(27, 28, 21, 0.06)`. Note the use of the `on-surface` color (#1b1c15) at a very low opacity to mimic natural light.
*   **The "Ghost Border":** If accessibility requires a stroke, use `outline-variant` (#cfc6af) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Refined Primitives

### Buttons
*   **Primary:** Solid `primary_container` (#ffde59) with `on_primary_container` (#756100) text. Use `md` (0.375rem) roundedness—not full pill—to maintain a sophisticated, structured look.
*   **Tertiary:** No background. Use `notoSerif` in `title-md` for an elegant, text-only "Underlined" style.

### Cards & Lists
*   **Strict Rule:** Forbid the use of horizontal divider lines. Use `spacing-6` (2rem) of vertical white space or a subtle shift to `surface-container-high` to separate list items.
*   **Padel Scorecards:** Use `surface-container-highest` (#e5e3d7) for the background of the losing set and `primary_container` (#ffde59) for the winning set to create instant visual hierarchy.

### Input Fields
*   **Style:** Minimalist. No bottom line or full border. Use a `surface-variant` background with `sm` roundedness. The label should be `label-md` floating *above* the field, never inside.

### Signature Component: The "Match-Day Bracket"
*   Use asymmetric paths. Instead of standard "squared-off" tournament brackets, use thin `outline` tokens with `lg` rounded corners to create a more organic, flowing journey through the tournament tree.

---

## 6. Do's and Don'ts

### Do:
*   **Do** embrace white space. Use `spacing-12` (4rem) between major sections to let the "Vintage Court" aesthetic breathe.
*   **Do** use `secondary` (#456553) for "Success" states or "Court Availability." The forest green complements the yellow and cream perfectly, reinforcing the sports club vibe.
*   **Do** overlap elements. Let a player's action photo break the container of a card to create a sense of movement.

### Don't:
*   **Don't** use pure black (#000000). Always use `on_surface` (#1b1c15) for text to maintain the soft, vintage feel.
*   **Don't** use "pill" buttons for everything. Reserved `full` roundedness only for small tags/chips; keep main buttons at `md` for a more tailored, premium look.
*   **Don't** use standard icon sets. Choose thin-stroke (1px or 1.5px) icons to match the sophistication of the typography.

---

## 7. Spacing & Rhythm
The system relies on a **3:2 ratio** for spacing. Larger gaps (using `spacing-10` or `spacing-16`) should be used between unrelated content blocks to create an "Editorial Sprawl" that feels intentional and high-end. Use `spacing-2` and `spacing-3` strictly for internal component padding.
