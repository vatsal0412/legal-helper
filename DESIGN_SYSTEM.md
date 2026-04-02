# Legal AI Legal Book Design System

**Version:** 1.0  
**Last Updated:** April 2026  
**Aesthetic:** Aged Legal Manuscript with Deep Brown & Gold Accent Theme

---

## 🎨 Design Philosophy

This design system evokes the feeling of working inside an **aged, yellowed law book**. The interface is deliberately formal, textured, and atmospheric—avoiding generic SaaS patterns in favor of a distinct legal aesthetic.

### Visual Hierarchy

- **Serious & Immersive** - Dark, deep tones suggest formal legal documents
- **Tactile & Worn** - Subtle textures, soft shadows create aged paper feeling
- **Scholarly & Refined** - Serif typography, precise spacing, legal formatting
- **Accessible & Readable** - High contrast, generous line-height despite dark theme

---

## 🎭 Color Palette

### Primary Surfaces

| Name                  | Color     | Usage                                |
| --------------------- | --------- | ------------------------------------ |
| **surface**           | `#1a1410` | Main background (deep brown-black)   |
| **surface-secondary** | `#2d2620` | Cards, modals, secondary backgrounds |
| **surface-tertiary**  | `#3d3630` | Borders, hover states, accents       |

### Text Colors

| Name                     | Color     | Usage                       |
| ------------------------ | --------- | --------------------------- |
| **foreground**           | `#f5f0e8` | Primary text (warm cream)   |
| **foreground-secondary** | `#d4cfc7` | Secondary text              |
| **foreground-muted**     | `#a89f97` | Tertiary text, placeholders |

### Accent Colors

| Name             | Color     | Usage                       |
| ---------------- | --------- | --------------------------- |
| **accent**       | `#b8956a` | Primary accent (muted gold) |
| **accent-light** | `#d4a574` | Hover states, highlights    |
| **accent-muted** | `#8b7d6b` | Subtle accents, borders     |

### Semantic Colors

- **error:** `#c65555` - Destructive actions, error states
- **warning:** `#c9a961` - Warnings and cautions
- **success:** `#7cb342` - Confirmation, success states

---

## ✍️ Typography System

### Font Families

- **Display & Body:** Georgia, Cambria, or serif fallback
- **Monospace:** Courier New for code and references

### Text Scales

| Class              | Size            | Weight   | Line-Height | Usage              |
| ------------------ | --------------- | -------- | ----------- | ------------------ |
| `.text-display-lg` | 2.25rem (36px)  | Bold     | 1.25        | Main headings      |
| `.text-display`    | 1.875rem (30px) | Bold     | 1.375       | Section headings   |
| `.text-heading-lg` | 1.5rem (24px)   | Bold     | 1.375       | Subsections        |
| `.text-heading`    | 1.125rem (18px) | Semibold | 1.375       | Card titles        |
| `.text-body-lg`    | 1rem (16px)     | Regular  | 1.625       | Primary body       |
| `.text-body`       | 0.875rem (14px) | Regular  | 1.625       | Secondary body     |
| `.text-caption`    | 0.75rem (12px)  | Regular  | 1.625       | Labels, small text |

### Letter Spacing

- **legal:** 0.025em - Uppercase labels, formal text (e.g., "NEW CASE", "PROFILE")
- **normal heading:** 0.015em - Headings
- **display:** 0.01em - Large display text

### Paragraph Styling

- First paragraph of any section has **no indent**
- Following paragraphs have **2rem left indent** (legal document style)
- Line height is **generous** (1.625 for readability)

---

## 🧩 Component Library

### Buttons

#### Primary Button (`.btn-primary`)

```
Background: Gold accent (#b8956a)
Text: Surface color (dark)
Border: 1px solid rgba(184, 149, 106, 0.6)
Shadow: Inset + outer shadow (tactile)
Hover: Lighter gold (#d4a574), elevated
Active: Darker, deeper shadow
```

#### Secondary Button (`.btn-secondary`)

```
Background: Surface-secondary
Text: Foreground
Border: 1px solid surface-tertiary
Hover: Surface-tertiary background, tertiary accent border
```

#### Ghost Button (`.btn-ghost`)

```
Background: Transparent
Text: Foreground-secondary
Hover: Subtle background (rgba accent/10%), border accent
```

### Input Fields (`.input-field`)

```
Background: Surface-secondary
Border: 1px solid surface-tertiary
Focus: Accent border + glow (2px rgba accent/20%)
Placeholder: Foreground-muted
Shadow: Inset shadow for depth
```

### Cards (`.card` / `.card-interactive`)

```
Background: Surface-secondary with paper texture
Border: 1px solid surface-tertiary
Shadow: 0 2px 6px rgba(0,0,0,0.5) + inset shadow
Hover: Slightly elevated, tertiary border
Active: Tertiary background, accent border
```

### Messages

#### User Message (`.message-user`)

```
Background: Accent (#b8956a)
Text: Surface (dark)
Border: 1px solid rgba(accent, 0.7)
Style: Right-aligned, rounded-xs
```

#### Assistant Message (`.message-assistant`)

```
Background: Surface-secondary
Border: Left border 3px accent-muted, 1px border surface-tertiary
Style: Markdown formatted, left-aligned
```

---

## 📐 Spacing & Layout

### Spacing Scale

All spacing uses **8px base unit**:

| Value | Pixels | Usage           |
| ----- | ------ | --------------- |
| 0.5   | 4px    | Extra tight     |
| 1     | 8px    | Tight spacing   |
| 1.5   | 12px   | Small padding   |
| 2     | 16px   | Default padding |
| 2.5   | 20px   | Medium spacing  |
| 3     | 24px   | Large spacing   |
| 3.5   | 28px   | Extra large     |
| 4     | 32px   | XXL spacing     |

### Border Radius

- **xs:** 2px - Minimal rounding (legal, formal)
- **sm:** 4px - Subtle rounding
- **md:** 6px - Medium rounding
- **lg:** 8px - Generous rounding

### Container Widths

- Mobile: Full width with padding
- Desktop: Max 1200px centered

---

## 🎬 Animations & Interactions

### Animations

- **fade-up:** 300ms, subtle entrance from bottom
- **fade-in:** 300ms, opacity fade
- **slide-in-left:** 300ms, entrance from left
- **pulse-subtle:** Continuous subtle pulsing (used for thinking state)

All animations use `cubic-bezier(0.34, 1.56, 0.64, 1)` for natural bounce.

### Transitions

- Standard: `transition-all duration-200`
- Hover states: Color/shadow changes over 200ms
- All interactive elements have smooth state transitions

### Focus States

```css
outline: 2px solid var(--color-accent-light);
outline-offset: 2px;
```

---

## 📝 Markdown Styling (Legal Document Format)

### Headings

- **h1:** Large gold underline, extreme letter-spacing
- **h2:** Gold left border (3px), indented
- **h3-h6:** Styled consistent with hierarchy

### Paragraphs

- Text indent: 2rem (legal document style)
- Line height: relaxed (1.625)
- Bottom margin: 1.125rem

### Lists

- Disc bullets (ul) or decimal (ol)
- Left indentation: 1.5rem
- Item spacing: 0.5rem
- Blue accent links: `text-accent hover:text-accent-light`

### Code Blocks

```
Background: Surface (dark black)
Border: 1px surface-tertiary + 3px left border accent
Text: Foreground-secondary monospace
Padding: 1rem
Border-radius: 2px
```

### Blockquotes

```
Border-left: 4px solid accent
Background: rgba(accent, 5%)
Padding: 1rem 1.5rem
Font-style: italic
Color: Foreground-secondary
```

### Tables

- Header: Surface-secondary with 2px bottom border (accent)
- Rows: Alternating none (consistent)
- Cell padding: 0.75rem
- Border: 1px surface-tertiary

---

## 🗂️ Page Layouts

### Chat Page

- **Header:** Surface-secondary, hamburger + title + subtitle
- **Sidebar:** Collapsible, w-72, surface-secondary
- **Main:** Full flex layout with messages + composer
- **Composer:** Sticky bottom, dark background, gold send button

### Auth Pages (Login/Signup)

- Centered card layout
- Dark background (surface)
- Card with 8px rounded corners
- Gold primary button, secondary links

### Dashboard

- Grid 3-column card layout
- Emoji + title + description per card
- Hover lifts and lightens text to accent

### Documents / Profile

- Similar card layouts
- Full-width max-3xl container
- Section-based organization

---

## 🔍 Accessibility Checklist

✅ **Contrast Ratios**

- Primary text on dark: Cream on dark brown = 10:1+ (WCAG AAA)
- Accent on dark: Gold on dark brown = 4.5:1+ (WCAG AA)
- Interactive elements clearly distinguishable

✅ **Focus Management**

- All interactive elements have visible focus states (2px outline)
- Focus order follows DOM structure
- Skip links not visible but available for screen readers

✅ **Typography**

- Serif fonts improve readability despite dark theme
- Minimum 14px font size for body
- Generous line-height (1.625) aids scanning
- High character width limits (max 80 chars per line in content)

✅ **Motion**

- Animations respect `prefers-reduced-motion`
- No auto-playing animations
- Essential interactions work without animation

✅ **Color**

- Distinction not reliant on color alone (icons + text)
- Error/success states use text + visual indicators
- No color-only information encoding

---

## 🚀 Implementation Guide

### Tailwind Classes

Replace old blue palette with new gold:

**Old → New**

```
bg-white → bg-surface-secondary
text-ink → text-foreground
border-neutral-200 → border-surface-tertiary
text-primary → text-accent
text-neutral-600 → text-foreground-muted
```

### Component Updates

1. Replace `glass` class (doesn't exist) with `.card`
2. Update color names in JS (dusk → surface, blaze → accent)
3. Add `tracking-legal` to uppercase labels
4. Use emoji icons for visual clarity (💬, 📄, 👤, 🗑, ⏳, ✓)

### CSS Customization

All design tokens in `:root` variables:

```css
--color-surface: #1a1410;
--color-accent: #b8956a;
--paper-texture: /* SVG pattern */;
```

---

## 📋 Design Tokens (CSS Variables)

```css
--color-surface: #1a1410;
--color-surface-secondary: #2d2620;
--color-surface-tertiary: #3d3630;
--color-foreground: #f5f0e8;
--color-foreground-secondary: #d4cfc7;
--color-foreground-muted: #a89f97;
--color-accent: #b8956a;
--color-accent-light: #d4a574;
--color-accent-muted: #8b7d6b;
--spacing-unit: 8px;
--paper-texture: /* gradient pattern */;
```

---

## 🎯 Usage Examples

### Chat Message Component

```jsx
// User message (gold)
<div className="message-user">
  {content}
  {hasBeenEdited && <p className="text-[11px] text-accent-light mt-1">edited</p>}
</div>

// Assistant message (sepia)
<div className="message-assistant">
  <div className="markdown">{content}</div>
</div>
```

### Form Input

```jsx
<input className="input-field" placeholder="..." />
```

### Button Group

```jsx
<button className="btn-primary">Save</button>
<button className="btn-secondary">Cancel</button>
<button className="btn-ghost">Skip</button>
```

---

## 📈 Future Enhancements

1. **Dark Mode Toggle:** Add light theme variant (inverse colors)
2. **Texture Options:** Paper, leather, parchment textures
3. **Animation Preferences:** Respect prefers-reduced-motion
4. **Theme Customization:** Allow users to adjust accent color
5. **Print Stylesheet:** Optimize for legal document printing
6. **Accessibility:** Enhanced keyboard navigation guide

---

## 📞 Design System Maintenance

**Last Reviewed:** April 2026  
**Next Review:** August 2026  
**Maintainer:** Design System Team

For questions or updates to this design system, please reference these files:

- `tailwind.config.js` - Design tokens
- `src/styles/index.css` - CSS components
- Component files - Implementation examples
