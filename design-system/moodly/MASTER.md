# Moodly — Design System Master

> **Style:** Neumorphism (Beyond Neumorphism)  
> **Stack:** React + Tailwind + shadcn/ui  
> **Variance:** 4/10 (Balanced) | **Motion:** 6/10 (Standard) | **Density:** 5/10 (Standard)

---

## Global Rules

### Color Palette

| Role | Hex | Tailwind |
|------|-----|----------|
| Primary | `#DC2626` | `bg-primary` / `text-primary` |
| On Primary | `#FFFFFF` | `text-primary-foreground` |
| Secondary | `#C4B5FD` | `bg-secondary` |
| Accent | `#059669` | `text-accent` |
| Background | `#FAF5FF` | `bg-background` |
| Foreground | `#4C1D95` | `text-foreground` |
| Card | `#FFFFFF` | `bg-card` |
| Muted | `#EDEFF9` | `bg-muted` / `text-muted-foreground` |
| Border | `#EDE9FE` | `border-border` |
| Destructive | `#DC2626` | `bg-destructive` |

### Typography

- **Headings:** Lora (serif) — `font-serif`
- **Body:** Raleway (sans-serif) — `font-sans`

### Shadows (Neumorphic)

| Level | Tailwind | Usage |
|-------|----------|-------|
| Extruded | `shadow-neumorphic` | Cards |
| Extruded sm | `shadow-neumorphic-sm` | Buttons |
| Inset | `shadow-neumorphic-inset` | Inputs |

### Key Effects

- `active:scale-[0.97]` on buttons (press feedback)
- `focus-visible:ring-2 focus-visible:ring-ring` for keyboard nav
- `duration-150` transitions
- Rounded corners: `rounded-lg` (12px) on cards/buttons, `rounded-lg` (12px) on inputs

---

## Component Specs (Tailwind Implementation)

### Buttons
```
default:   bg-primary text-primary-foreground shadow-neumorphic-sm hover:shadow-neumorphic
secondary: bg-secondary text-secondary-foreground shadow-neumorphic-sm hover:shadow-neumorphic
ghost:     text-foreground hover:bg-secondary
outline:   border border-border bg-card text-foreground shadow-neumorphic-sm
```

### Cards
```
rounded-xl bg-card text-card-foreground shadow-neumorphic
```

### Inputs
```
rounded-lg border border-border bg-card shadow-neumorphic-inset
```

---

## Anti-Patterns (Do NOT Use)

- ❌ Bright neon, motion overload
- ❌ Emojis as icons (use SVG: Lucide/Heroicons)
- ❌ Low contrast text (maintain 4.5:1)
- ❌ Instant state changes (always 150-300ms)
- ❌ Invisible focus states

---

## Pre-Delivery Checklist

- [ ] All icons from consistent SVG set (Lucide/Heroicons)
- [ ] `cursor-pointer` on all clickable elements
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Focus rings visible for keyboard navigation
