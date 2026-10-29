# VOLT Code AI v5 — Design System (source of truth)
Generated via ui-ux-pro-max (style DB: neumorphism + dark-mode dev-tool), applied as CSS custom properties in `src/app.css`.

## Theme contract
| Slot | Day (default, neumorphic) | Dark (OLED workbench) |
|---|---|---|
| bg | `#e6ebf2` | `#0a0a0b` |
| elevated panel | `#edf1f7` | `#161616` |
| inset well | `#e0e6ee` + inner shadow | `#070707` |
| ink primary `--t1` | `#1f2937` (7.4:1 on bg) | `#ffffff` |
| ink secondary `--t2` | `#505c6e` (4.9:1) | `#9aa3b1` |
| accent `--acc` | `#ff5f00` (bg), text `#a43e00` | `#ff5f00` |
| depth | dual soft shadows `--neo-out/--neo-in` | none |
Toggle: `<html data-theme>` persisted as `localStorage.volt-theme`.

## Semantic class layer (replaces ~500 hardcoded utilities)
`vol-surface vol-elev vol-well vol-veil vol-wash vol-acc-bg vol-acc-wash
vol-accent vol-accent-soft vol-ring vol-ring-strong vol-line vol-t1 vol-t2`
plus `hover:/focus:` pseudo variants (`hover:vol-wash`, `focus:vol-ring-hi`, …).

## Rules
- New UI MUST use semantic classes, never raw hex utilities.
- Dark mode is default fallback for users who toggle; day is first-class.
- Motion: 150–300ms transitions; `prefers-reduced-motion` globally enforced.
- Focus: visible `:focus-visible` accent ring on every interactive element.
- Breakpoints: phones <768 single column (grid utils collapse), tablet <1280 icon rail,
  laptop ≥1280 three-pane shell (see `ResponsiveContainer.tsx`).
- Contrast gate ≥4.5:1 for text; day accent text uses `#a43e00`.
