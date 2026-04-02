# UI Redesign Quick Reference

## 🎨 Color Quick Reference

### Backgrounds

```
Dark (primary):       #1a1410 → bg-surface
Dark (secondary):     #2d2620 → bg-surface-secondary
Dark (tertiary):      #3d3630 → bg-surface-tertiary
```

### Text

```
Main text:            #f5f0e8 → text-foreground
Secondary text:       #d4cfc7 → text-foreground-secondary
Muted text:           #a89f97 → text-foreground-muted
```

### Accents

```
Gold (primary):       #b8956a → text-accent or bg-accent
Gold (hover):         #d4a574 → text-accent-light
Gold (subtle):        #8b7d6b → text-accent-muted or border-accent-muted
```

---

## 🧩 Common Component Patterns

### Form Inputs

```jsx
<input className="input-field" placeholder="..." />
```

### Buttons

```jsx
{
	/* Primary (gold) */
}
<button className="btn-primary">Submit</button>;

{
	/* Secondary (dark) */
}
<button className="btn-secondary">Cancel</button>;

{
	/* Ghost (transparent) */
}
<button className="btn-ghost">Skip</button>;
```

### Cards

```jsx
{
	/* Standard card */
}
<div className="card">Content</div>;

{
	/* Interactive card (hover) */
}
<div className="card-interactive">Content</div>;

{
	/* Active card */
}
<div className="card card-active">Content</div>;
```

### Messages

```jsx
{
	/* User message (gold background) */
}
<div className="message-user">User text</div>;

{
	/* AI message (dark with left accent border) */
}
<div className="message-assistant">
	<div className="markdown">AI text</div>
</div>;
```

---

## 📝 Typography Classes

### Headings

```jsx
<h1 className="text-display-lg">Main Title</h1>
<h2 className="text-display">Large Section</h2>
<h3 className="text-heading-lg">Section</h3>
<h4 className="text-heading">Subsection</h4>
```

### Body Text

```jsx
<p className="text-body-lg">Large body text</p>
<p className="text-body">Regular body text</p>
<p className="text-caption">Small label text</p>
```

### Uppercase Labels (Legal Style)

```jsx
<button className="text-caption">TEXT</button>;
{
	/* or */
}
<button className="tracking-legal">BUTTON TEXT</button>;
```

---

## 🎭 Utility Classes

### Text Colors

```
text-foreground          → Main text (#f5f0e8)
text-foreground-secondary → Secondary (#d4cfc7)
text-foreground-muted    → Muted (#a89f97)
text-accent              → Gold (#b8956a)
text-accent-light        → Light gold (#d4a574)
text-error               → Red (#c65555)
text-success             → Green (#7cb342)
```

### Background Colors

```
bg-surface              → Primary dark (#1a1410)
bg-surface-secondary    → Secondary (#2d2620)
bg-surface-tertiary     → Tertiary (#3d3630)
```

### Border Colors & Widths

```
border-surface-tertiary     → Dark border
border border-accent         → Gold accent border
border-l-3 border-accent     → Gold left border (3px)
rounded-xs                   → 2px border-radius (formal)
```

### Spacing (8px units)

```
p-1 → 8px      p-2 → 16px     p-3 → 24px     p-4 → 32px
m-1 → 8px      m-2 → 16px     m-3 → 24px     m-4 → 32px
gap-1 → 8px    gap-2 → 16px   gap-3 → 24px   gap-4 → 32px
```

---

## 🔄 Color Migration Guide

**Before → After**

```css
bg-white → bg-surface-secondary
bg-neutral-50 → bg-surface
text-ink → text-foreground
text-neutral-600 → text-foreground-muted
text-primary → text-accent
bg-primary → bg-accent
border-primary → border-accent
border-neutral-200 → border-surface-tertiary
rounded-lg → rounded-xs
rounded-2xl → rounded-xs
```

---

## ✨ Special Classes

### Edit Mode Banner

```jsx
<div className="border border-accent/40 bg-accent/10 px-3 py-2.5 text-sm">
	✎ Editing message
</div>
```

### Error State

```jsx
<div className="bg-error/10 rounded-xs p-2">⚠ Error message</div>
```

### Loading State

```jsx
<div className="flex gap-1.5">
	{[0, 1, 2].map(i => (
		<div
			className="w-2 h-2 bg-accent rounded-full"
			style={{ animation: 'pulse-subtle 1.4s infinite' }}
		/>
	))}
</div>
```

### Markdown Container

```jsx
<div className="markdown">
	<Markdown>{content}</Markdown>
</div>
```

### Paper Texture Background

```
Classes: paper-texture (applied to certain cards)
Effect: Subtle repeating gradient pattern
```

---

## 🎯 Animation Utilities

### Fade Up (entrance)

```jsx
<div className="fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
	Content
</div>
```

### Fade In

```jsx
<div className="fade-in">Content</div>
```

### Slide In Left

```jsx
<div className="slide-in-left">Content</div>
```

---

## 📐 Common Layout Patterns

### Centered Modal

```jsx
<div className="fixed inset-0 z-40 flex items-center justify-center p-4">
	<div className="absolute inset-0 bg-black/60" /> {/* Backdrop */}
	<div className="card rounded-xs p-6 w-full max-w-md z-50">
		{/* Modal content */}
	</div>
</div>
```

### Sidebar Layout

```jsx
<aside className="fixed inset-y-0 left-0 w-72 flex flex-col
                   bg-surface-secondary border-r border-surface-tertiary">
  {/* Sidebar content */}
</aside>

<main className={`flex-1 lg:ml-${sidebarOpen ? 72 : 0}`}>
  {/* Main content */}
</main>
```

### Chat Message Group

```jsx
<div className="flex-up flex justify-end">
  <div className="message-user max-w-lg">
    {content}
  </div>
</div>

<div className="flex justify-start">
  <div className="message-assistant w-full">
    {content}
  </div>
</div>
```

### Form Layout

```jsx
<form className="card p-6 space-y-4">
	<div>
		<label className="text-body font-semibold mb-2">Label</label>
		<input className="input-field" />
	</div>
	<button className="btn-primary w-full">Submit</button>
</form>
```

---

## 🎨 Emoji Guide (Visual Clarity)

Use emojis strategically to enhance visual clarity:

```
💬 Chat / Conversation
📄 Document / File
📑 All Documents
👤 User / Profile
🗑 Delete
🔍 Search
⚠ Warning / Error
✓ Success / Confirm
ℹ Information
🔐 Security / Auth
↻ Refresh
✎ Edit
⏳ Loading / Processing
```

---

## 🚀 Developer Tips

1. **Always import styles** in component: `import '../styles/index.css'`
2. **Use CSS variables** for dynamic styling: `var(--color-accent)`
3. **Update Tailwind config** when adding new tokens
4. **Test dark backgrounds** for readability (contrast ratio ≥ 4.5:1)
5. **Lazy load images** in documents page
6. **Memoize components** that don't need frequent updates
7. **Use Markdown plugin** for AI responses (already configured)

---

## ⚠️ Common Pitfalls

❌ **Don't use:**

- `bg-white` (use `bg-surface-secondary`)
- `text-black` (use `text-surface`)
- `text-gray-600` (use `text-foreground-muted`)
- `rounded-lg` or `rounded-2xl` (use `rounded-xs` or `rounded-sm`)
- Old theme class `glass` (use `card`)

✅ **Do use:**

- Semantic color names (accent, foreground, surface)
- 8px spacing scale
- Small border radius (2-8px)
- Serif typography throughout
- Inset shadows for depth

---

## 📞 Quick Debug Checklist

If a component looks wrong:

1. ✓ Check color class names (old name → new name)
2. ✓ Verify text color contrast on background
3. ✓ Ensure border colors are `surface-tertiary` based
4. ✓ Check rounded corners (should be `rounded-xs` or `rounded-sm`)
5. ✓ Verify font family is serif (not sans-serif)
6. ✓ Check shadow classes (should use `shadow-xs` or `shadow-sm`)
7. ✓ Confirm spacing uses 8px units (p-1, p-2, p-3, etc.)

---

## 📂 File Organization

```
frontend/
├── src/
│   ├── styles/
│   │   └── index.css           ← Design system tokens & components
│   ├── components/
│   │   ├── ChatWindow.jsx      ← Message rendering
│   │   ├── MessageComposer.jsx ← Input field
│   │   ├── Sidebar.jsx         ← Navigation
│   │   └── ...
│   └── pages/
│       ├── ChatPage.jsx        ← Main chat layout
│       ├── LoginPage.jsx       ← Auth page
│       └── ...
└── tailwind.config.js          ← Theme configuration
```

---

## 🔗 Related Files

- **Design System:** `DESIGN_SYSTEM.md` (comprehensive reference)
- **Tailwind Config:** `tailwind.config.js` (color tokens)
- **CSS Components:** `src/styles/index.css` (component styling)
- **Component Examples:** Various `.jsx` files
