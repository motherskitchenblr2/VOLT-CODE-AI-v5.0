# VOLT UI/UX Refactor — Direction Card (oil-ui process)

## 北极星 (North Star)
A **machined workshop**: soft embossed depth, ONE orange accent, every card
earns its shadow. The **code canvas is the hero**; controls are tools on the
bench — grouped, quiet, never stacked as cards inside cards.

## 调性 (Tone, 5 scales)
| Scale | Value | Evidence |
|---|---|---|
| Energy | 安静 | Single accent #FF5F00; muted greys |
| Finish | 精致 | Strict 1px borders, consistent dual soft shadows |
| Density | 中 | Controls grouped on one bench row; content breathes |
| Weight | 轻中 | Thin borders, soft shadows; code area dominant |
| Seriousness | 庄重可亲 | Rounded 14–18px; no skeuo jokes; clear states |

## 生成引擎 (Engine)
**Material × environment**: machined aluminium bench under soft daylight.
Light top-left → raised cards, debossed wells, orange indicator-light accent.

## 删除清单 (Editor view)
- Toolbar raised `vol-elev` → **flat** `vol-surface` (cards-in-cards, lint-proven)
- OPERATION MODE track `vol-panel` → **debossed** `vol-well`
- ACTIVE ENGINE card: keep, single
- Micro labels 9–10px: keep only as uppercase tracking meta (oil-ui exception)
- Free-tier info: keep ONE badge

## 色彩 (Color)
bg #e6ebf2 · raised #edf1f7 · well #e0e6ee · ink #1f2937/#505c6e ·
accent #ff5f00 (text-safe #8f3600 ≥4.5:1) · free green-600/black ·
dark: OLED flat (no shadows).

## 控件语法 (Control grammar)
Radius 14–18px · 1px hairline borders · raised cards / debossed wells ·
press = inset on touch (150ms).

## 记忆点 (Memorable moment)
**AI at work**: RUN AI drops into a debossed well + orange pulse while
analyzing; result lands on the code canvas, not a spinner.

## 结构性突破
Breaking the AI-tool cliché (dark + purple glow) with a daylight machined
bench + inset pressed bottom-nav tab on mobile.

## 放弃什么
Card-in-card nesting; rainbow surface chrome (kept as small identity dots);
decorative shadows on chrome bars.
