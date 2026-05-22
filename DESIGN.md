# Design System

## 1. Visual Theme & Atmosphere

RMap's design system embodies an aspirational, dreamlike quality that celebrates learning as an adventurous journey. The palette blends soft purples and lavenders with deep navy accents, creating a sophisticated yet welcoming atmosphere. Whimsical illustrated elements—hot air balloons, lighthouses, and wind turbines—reinforce the metaphor of navigation and progress. The design prioritizes clarity and confidence, with generous whitespace and smooth interactions that encourage exploration. Typography choices lean toward modern serifs for headlines, paired with approachable sans-serif bodies, establishing both professionalism and accessibility. The overall aesthetic is calming yet motivating, designed to support learners in mapping their career trajectories with optimism and precision.

**Key Characteristics**

- Soft, pastel-dominant color palette with purple and lavender foundations
- Delicate, illustrative visual language suggesting journey and discovery
- Modern serif headlines contrasted with clean sans-serif body text
- Generous whitespace and breathing room throughout layouts
- Smooth, rounded interactive elements with subtle depth
- Emphasis on clarity, confidence, and forward momentum
- Accessible, inclusive design supporting diverse learning paths

## 2. Color Palette & Roles

### Primary

- **Purple Gradient Base** (`--primary: hsl(262, 83%, 58%)`): Primary interactive elements, CTAs, and brand accent; defined in [packages/design-system/styles/globals.css](packages/design-system/styles/globals.css) as `--primary`.
- **Primary Active / Hover** (`--primary-active: hsl(263, 70%, 50%)`): Hover/active variant; defined as `--primary-active` in the CSS tokens.
- **Light Lavender / Background Secondary** (`--background-secondary: hsla(251, 91%, 95%, 1)`): Dominant background tint; use `--background-secondary` from the design-system tokens.

### Accent Colors

- **Vivid Purple** (`var(--primary-active)`): Hover states and elevated interactive moments (use `--primary-active`)
- **Dark Purple Shadow** (#181033): Deep accent for premium or elevated contexts

### Interactive

### Interactive

- **Purple CTA** (`var(--primary)`): Primary call-to-action buttons with white text — canonical value is `--primary` in [packages/design-system/styles/globals.css](packages/design-system/styles/globals.css).
- **Muted Purple Border** (`var(--btn-white-border)` / `var(--btn-purple-border)`): Secondary button borders and subtle dividers (see CSS tokens in globals.css).
- **Purple Alpha Border** (`rgba(90, 33, 181, 0.13)`): Soft button borders for tertiary actions (use CSS tokens where available).

### Neutral Scale

- **Pure White** (`var(--card)`): Default button backgrounds, card surfaces, and main text areas
- **Off-White** (`var(--background-secondary)`): Subtle background variation for nested content
- **Light Gray** (`var(--muted)`): Secondary background for inactive or reduced-emphasis sections
- **Dark Navy** (`var(--foreground)`): Primary text color for all body content and headings
- **Deep Navy** (`var(--card-foreground)`): Alternative dark text for increased contrast
- **Charcoal** (#262626): Secondary text and disabled states
- **Black** (#000000): Maximum contrast for critical information
- **Gray Medium** (#B1B1B7): Placeholder text and tertiary information

### Surface & Borders

- **Very Light Gray** (`#F0F0F0`): Light background tints and subtle borders
- **Lavender Overlay** (`rgba(222, 215, 254, 0.6)`): Input field borders and subtle focus states

### Shadow Colors

- **Inset Light** (`rgba(231, 230, 244, 0.5)`): Subtle inset shadows for button depth; creates tactile raised effect
- **Purple Glow** (`rgba(70, 58, 203, 0.25)`): Soft inner glow on primary interactive elements
- **Black Fade 10%** (`rgba(0, 0, 0, 0.1)`): Dropdown and small shadow effects
- **Black Fade 5%** (`rgba(0, 0, 0, 0.05)`): Minimal depth for subtle layering

## 3. Typography Rules

### Font Family

- **Primary (Headlines):** Mackinac, Georgia, serif — for display, headings, and emphasis
- **Secondary (Body):** Bricolage Grotesque, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif — for body, buttons, inputs, and navigation

### Hierarchy

| Role              | Font                | Size                                           | Weight | Line Height | Letter Spacing | Notes                                                        |
| ----------------- | ------------------- | ---------------------------------------------- | ------ | ----------- | -------------- | ------------------------------------------------------------ |
| Display / Hero    | Mackinac            | 36px / 48px / 64px (mobile / tablet / desktop) | 500    | 43.2px      | 0px            | Large headlines, page titles; responsive sizes: 36 / 48 / 64 |
| Heading H1        | Mackinac            | 16px                                           | 600    | 24px        | 0px            | Section headers and emphasis                                 |
| Heading Accent    | Mackinac            | 24px                                           | 700    | 32px        | 0px            | Featured text, underlined accents                            |
| Body Text         | Bricolage Grotesque | 18px                                           | 400    | 30.6px      | 0px            | Main descriptive content                                     |
| Link Text         | Bricolage Grotesque | 16px                                           | 400    | 24px        | 0px            | Inline links, navigation items                               |
| Button Label      | Bricolage Grotesque | 16px                                           | 500    | 24px        | 0px            | All button text; compact buttons use 14px                    |
| Input Placeholder | Bricolage Grotesque | 16px                                           | 300    | 24px        | 0px            | Form field text, reduced weight                              |
| Caption / Small   | Bricolage Grotesque | 14px                                           | 400    | 20px        | 0px            | Supporting text, metadata                                    |

### Principles

- Serif headlines (Mackinac) establish sophistication and learning-focused brand identity
- Sans-serif bodies ensure readability and modern approachability
- Generous line height (1.5–1.7x) supports legibility and breathing room
- Font weights are conservative; hierarchy relies primarily on size and family distinction
- All text maintains sufficient contrast against backgrounds (WCAG AA minimum)
- Input fields use reduced weight (300) to signal placeholder/inactive state

## 4. Component Stylings

### Buttons

#### Primary Button (Large)

**Background:** `var(--primary)` (see `--primary` in [packages/design-system/styles/globals.css](packages/design-system/styles/globals.css))
**Text Color:** `var(--primary-foreground)`
**Font:** Bricolage Grotesque, 16px, weight 500
**Padding:** `12px 20px`
**Border Radius:** `9999px` (pill shape)
**Border:** None
**Box Shadow:** `rgba(70, 58, 203, 0.25) 0px 0px 0px 1px inset`
**Height:** `48px`
**Line Height:** `24px`
**Hover State:** Background shift to `var(--primary-active)`, maintain shadow

-#### Secondary Button (Medium)

- **Background:** `var(--btn-white-background)`
- **Text Color:** `var(--foreground)`
- **Font:** Bricolage Grotesque, 14px, weight 500
- **Padding:** `6px 12px`
- **Border Radius:** `9999px`
- **Border:** `1px solid rgba(90, 33, 181, 0.13)`
- **Box Shadow:** `rgb(231, 230, 244) 0px -3px 6px -2px inset`
- **Height:** `32px`
- **Line Height:** `20px`
- **Hover State:** Add `rgba(222, 215, 254, 0.3)` background tint

#### Ghost Button (Icon)

- **Background:** `var(--btn-white-background)`
- **Text Color:** `var(--foreground)`
- **Font:** Bricolage Grotesque, 16px, weight 500
- **Padding:** `0px`
- **Border Radius:** `9999px`
- **Border:** `1px solid rgba(90, 33, 181, 0.13)`
- **Box Shadow:** `rgb(231, 230, 244) 0px -3px 6px -2px inset`
- **Height:** `40px`
- **Width:** `40px`
- **Line Height:** `24px`
- **Hover State:** Background tint to `rgba(222, 215, 254, 0.2)`

### Inputs & Forms

#### Search Input

**Background:** `var(--background)` / outlined-filled look (design-system `Input` uses `bg-background` + `border-border`)
**Text Color:** `var(--foreground)`
**Font:** Bricolage Grotesque, 16px, weight 300
**Padding:** `px-3 py-2.5` (component uses these)
**Border Radius:** `var(--radius-md)` (design-system uses `rounded-md`)
**Border:** `1px solid var(--border)` (outlined)
**Box Shadow:** subtle (component uses `shadow-[0_1px_2px_0_rgba(139,92,246,0.10)]`)
**Height:** `40px` (component `h-10`)
**Line Height:** `24px`
**Placeholder Color:** `var(--muted-foreground)` (applied with reduced opacity in component)
**Focus State:** `focus-visible:ring-2` using `var(--ring)`; component removes inset shadow on focus

### Navigation

#### Navigation Links

- **Background:** `rgba(0, 0, 0, 0)`
- **Text Color:** `var(--foreground)`
- **Font:** Bricolage Grotesque, 16px, weight 400
- **Padding:** `0px`
- **Border Radius:** `0px`
- **Border:** None
- **Box Shadow:** None
- **Height:** `42px`
- **Line Height:** `24px`
- **Active State:** Text color to `var(--primary)`, add bottom border `2px solid var(--primary)`
- **Hover State:** Text color fade to `var(--muted-foreground)`

#### Navigation Button Link

- **Background:** `rgba(0, 0, 0, 0)`
- **Text Color:** `var(--foreground)`
- **Font:** Bricolage Grotesque, 16px, weight 500
- **Padding:** `8px 16px`
- **Border Radius:** `9999px`
- **Border:** None
- **Box Shadow:** None
- **Height:** `40px`
- **Line Height:** `24px`
- **Hover State:** Background to `rgba(222, 215, 254, 0.4)`, text to `var(--primary)`

### Cards & Containers

#### Card Surface

**Background:** `var(--card)`
**Border:** `1px solid var(--border)` (uses `--border` token)
**Border Radius:** `var(--radius)` (0.625rem ≈ 10px) — canonical `--radius` is defined in [packages/design-system/styles/globals.css](packages/design-system/styles/globals.css)
**Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
**Padding:** `24px`
**Hover State:** Shadow to `rgba(0, 0, 0, 0.1) 0px 4px 12px 0px`

#### Nested Container

- **Background:** `var(--background-secondary)`
- **Border:** None
- **Border Radius:** `8px`
- **Box Shadow:** None
- **Padding:** `16px`

## 5. Layout Principles

### Spacing System

- **Base Unit:** `4px`
- **Scale:** 4, 8, 12, 16, 20, 24, 28, 32, 48, 64, 112, 120px
- **Usage:**
  - `4px–8px`: Micro-spacing (gaps between inline elements, component internals)
  - `12px–16px`: Component padding (buttons, cards, inputs)
  - `20px–24px`: Section padding (content blocks, container interiors)
  - `28px–32px`: Medium spacing (between related sections)
  - `48px–64px`: Large spacing (between major sections, hero to body)
  - `112px–120px`: Extra-large spacing (page margins, full-bleed sections)

### Grid & Container

- **Max Width:** `1400px` (inferred for content containers)
- **Column Strategy:** Flexible grid supporting 1–3 columns depending on breakpoint; 12-column flexible layout recommended
- **Section Patterns:**
  - Hero: Full bleed with `120px` vertical padding
  - Content: Contained to max width with `32px` horizontal padding (desktop), `16px` (mobile)
  - Cards Grid: 3 columns (desktop), 2 columns (tablet), 1 column (mobile) with `24px` gap

### Whitespace Philosophy

Whitespace is treated as a first-class design element. The design emphasizes breathing room to reduce cognitive load and guide user attention. Vertical rhythm is maintained through consistent spacing scales. Generous margins around text blocks and illustrations prevent visual crowding. Container padding is always symmetrical unless asymmetry serves a specific information hierarchy need.

### Border Radius Scale

- **Pill / Buttons:** `9999px` (max value for full pill effect)
- **Cards:** `var(--radius)` (canonical value `0.625rem` ≈ 10px in [packages/design-system/styles/globals.css](packages/design-system/styles/globals.css))
- **Nested Elements:** `var(--radius-md)` / ~8px (derived)
- **Slight Rounding:** `4px` (minimal softening for edges)
- **Sharp:** `0px` (text inputs, dividers, borders)

## 6. Depth & Elevation

| Level         | Treatment                                                                 | Use                                                       |
| ------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| Flat (L0)     | No shadow, `var(--card)` background                                       | Base surfaces, input fields, text layers                  |
| Subtle (L1)   | `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`                                     | Cards, containers, light depth                            |
| Raised (L2)   | `rgb(231, 230, 244) 0px -3px 6px -2px inset`                              | Buttons (secondary), interactive elements, tactile effect |
| Glowing (L3)  | `rgba(70, 58, 203, 0.25) 0px 0px 0px 1px inset`                           | Primary buttons, focused interactive, emphasis            |
| Dropdown (L4) | `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` | Floating menus, overlays, lifted modals                   |

**Shadow Philosophy:** Shadows are minimal and inward-focused. Primary buttons use inset glows (`rgba(70, 58, 203, 0.25)`) to create a gentle, non-aggressive depth. Secondary elements employ soft inset shadows for tactile feedback. Outer shadows are reserved for floating or overlay components. This approach maintains the soft, calming aesthetic while preserving hierarchy through subtle elevation cues.

## 7. Do's and Don'ts

### Do

- Use `var(--primary)` (defined in [packages/design-system/styles/globals.css](packages/design-system/styles/globals.css)) for all primary CTAs and moments requiring maximum attention
- Pair serif (Mackinac) headlines with sans-serif (Bricolage Grotesque) bodies for visual distinction
- Maintain minimum `48px` height for touch targets on interactive elements
- Apply `9999px` border radius consistently to all buttons for cohesive pill aesthetic
- Preserve generous whitespace around major sections (`48px–64px` minimum)
- Use `var(--card)` backgrounds with subtle `rgba(222, 215, 254, 0.6)` borders for surfaces
- Employ inset shadows on secondary buttons for tactile feedback
- Keep input fields simple with bottom borders only; minimize visual weight
- Use `var(--foreground)` for primary text; ensure minimum `4.5:1` contrast ratio
- Organize navigation with underline indicators for active states rather than background fills

### Don't

- Mix serif and sans-serif fonts within the same typographic role
- Use pure black for body text; default to `var(--foreground)`
- Apply outward shadows to interactive elements (reserved for floating/overlay components)
- Create button heights smaller than `32px` for primary actions
- Use inconsistent border radius values; stick to the scale (0, 4, 8, 12, 9999px)
- Reduce line height below `1.5x` font size for body text
- Apply colored backgrounds to input fields; keep them transparent or very subtle
- Overuse the purple accent; it should guide but not dominate
- Nest shadows (avoid multiple shadow layers on a single element)
- Forget to test contrast ratios; maintain WCAG AA minimum for all text

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name | Width        | Key Changes                                                                            |
| --------------- | ------------ | -------------------------------------------------------------------------------------- |
| Mobile          | 320px–640px  | Single column, `16px` horizontal padding, `24px` gaps, stacked navigation              |
| Tablet          | 641px–1024px | Two-column grids, `20px` horizontal padding, `32px` gaps, condensed navigation         |
| Desktop         | 1025px+      | Three-column grids, `32px` horizontal padding, `48px` gaps, full horizontal navigation |

### Touch Targets

- **Minimum Interactive Size:** `48px × 48px` (buttons, links, icons)
- **Comfortable Spacing:** `16px` minimum between adjacent touch targets
- **Button Padding Adjustments:**
  - Mobile: `12px 16px` (height 40px)
  - Desktop: `12px 20px` (height 48px)

### Collapsing Strategy

- **Hero Section:** Full-bleed width at all breakpoints; adjust padding and font sizes
  - Desktop: 64px headline, 18px body, `120px` vertical padding
  - Tablet: 48px headline, 16px body, `64px` vertical padding
  - Mobile: 36px headline, 14px body, `48px` vertical padding
- **Card Grids:** Reflow from 3 columns (desktop) → 2 columns (tablet) → 1 column (mobile) with consistent `24px` gap
- **Navigation:** Horizontal list (desktop/tablet) → hamburger menu + drawer (mobile)
- **Inputs:** Full width at mobile (`width: 100%`), constrained width (600px max) at desktop
- **Spacing Scale:** Reduce `48px–64px` gaps to `32px` at tablet, `24px` at mobile
- **Font Sizes:** Reduce by approximately `2px–4px` at tablet, `4px–6px` at mobile

## 9. Agent Prompt Guide

### Quick Color Reference

### Quick Color Reference

- **Primary CTA:** `var(--primary)` (see [packages/design-system/styles/globals.css](packages/design-system/styles/globals.css)) — hover: `var(--primary-active)`
- **Background (Base):** `var(--background)` or `var(--background-secondary)`
- **Heading Text / Body Text:** `var(--foreground)` (dark navy)
- **Secondary Text:** `var(--muted-foreground)`
- **Borders:** `var(--border)` (used alongside alpha borders such as `rgba(90, 33, 181, 0.13)`)
- **Placeholder:** `var(--muted-foreground)`

### Iteration Guide

1. **Buttons are always pill-shaped** (`border-radius: 9999px`) with heights of `32px` (secondary) or `48px` (primary).
2. **Primary buttons use `var(--primary)` background with white text**; secondary buttons use white with subtle purple borders and inset lavender shadow.
3. **All headlines use Mackinac serif; all body/UI text uses Bricolage Grotesque sans-serif.**
4. **Typography hierarchy is driven by size first** (display responsive: 36px / 48px / 64px for mobile / tablet / desktop, body 18px, button 16px), then weight (headlines 500–700, body 300–400).
5. **Line heights are always generous** (1.5–1.7x font size) to support readability and visual breathing room.
6. **Spacing follows the scale strictly** (4, 8, 12, 16, 20, 24, 28, 32, 48, 64, 112, 120px); no arbitrary values.
7. **Shadows are inset-only for interactive elements** (buttons), using `rgba(70, 58, 203, 0.25)` for glow or `rgba(231, 230, 244, 0.5)` for tactile depth.
8. **Input fields are transparent backgrounds with bottom borders only**; no filled inputs.
9. **Navigation links are underlined only when active** (`2px solid var(--primary)` bottom border).
10. **Card surfaces always use `var(--card)` with subtle `rgba(222, 215, 254, 0.6)` borders and minimal outer shadows** for depth without dominance.
11. **Mobile layouts stack to single columns with `16px` padding**; tablet uses 2 columns with `20px` padding; desktop uses 3 columns with `32px` padding.
12. **Touch targets are minimum `48px × 48px`** with `16px` spacing between adjacent interactive elements; adjust all button sizes and link hit areas accordingly.
