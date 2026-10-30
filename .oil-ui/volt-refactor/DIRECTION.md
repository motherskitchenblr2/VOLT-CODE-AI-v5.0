# VOLT UI/UX Refactor — Direction Card (oil-ui process)

## 北极星 (North Star)
A **machined workshop**: soft embossed depth, ONE orange accent, every card
earns its shadow. The **code canvas is the hero**; controls are tools on the
bench — grouped, quiet, never stacked as cards inside cards.

## 调性 (Tone, 5 scales)
| Scale | Value | Evidence |
|---|---|---|
| Energy | 安静 (quiet) | Single accent #FF5F00; muted greys; no rainbow chrome |
| Finish | 精致 (refined) | Strict 1px borders, consistent dual soft shadows, aligned grids |
| Density | 中 (moderate) | Controls grouped on one bench row; content breathes |
| Weight | 轻中 (medium-light) | Thin borders, soft shadows; code area dominant |
| Seriousness | 庄重可亲 | Rounded 14–18px; no skeuo jokes; clear states |

## 生成引擎 (Engine)
**Material × environment**: machined aluminium bench under soft daylight.
Light top-left → raised cards (dual shadow), inset wells (debossed), orange
accent as a machine indicator light.

## 删除清单 (Deletion list) — Editor view
| Element | Verdict | Reason |
|---|---|---|
| Toolbar raised `vol-elev` background | **Flat** → `vol-surface` | Cards-inside-cards (lint-proven) |
| OPERATION MODE inner track `vol-panel` | **Inset** → `vol-well` | Track reads as control, not card |
| ACTIVE ENGINE card | Keep, single | It is the selected-model state |
| Micro labels 9–10px | Keep if uppercase tracking meta; else bump | Intentional meta labels (oil-ui exception) |
| SHORTCUTS | Keep | Real task |
| Free-tier info duplication | Keep ONE badge | Dropdown ★ + card badge = state clarity |

## 色彩 (Color)
Layers: bg #e6ebf2 · raised #edf1f7 · well #e0e6ee · ink #1f2937/#505c6e ·
accent #ff5f00 (text-safe #a43e00) · free-tier green-600/black · dark:
OLED flat #0a0a0b (shadows none). Derived from the app's content (code) and
brand (orange).

## 控件语法 (Control grammar)
Radius 14–18px · 1px hairline borders · raised cards / debossed wells ·
press = inset shadow on touch (150ms).

## 记忆点 (Memorable moment)
**AI at work**: RUN AI drops into a debossed well with a live orange pulse;
done → green flash on the canvas. Result happens on the thing it affects
(the code), not a spinner.

## 结构性突破 (Structural break)
Breaking the AI-tool cliché (dark + purple glow + floating particles) with a
day-light machined bench — and the inset pressed bottom-nav tab on mobile.

## 放弃什么 (What we give up)
Card-inside-card nesting, rainbow per-agent colors as surface chrome
(kept only as small identity dots), decorative shadows on chrome bars.
