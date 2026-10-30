# AGENT LESSONS — learning ledger for VOLT agents

Every time a human deletes/rejects a PR, the reason is appended here via
`node scripts/ship-fix.mjs --learn "<reason>"`. Agents MUST read this file
before pushing a fix and never repeat a recorded mistake.

## Lessons learned (verified during development)

1. **`src/app.css` was an orphan for weeks** — nothing imported it, so an
   entire design layer never compiled. Always verify a stylesheet is actually
   imported (`grep -r "app.css" src/main.tsx`) before trusting that its rules
   ship. Lesson: after adding CSS, grep the built bundle for a marker string.

2. **Blanket `min-height: 44px` on all buttons breaks dense panels** — it
   inflated tiny toolbar chips and pushed layout out. Lesson: size touch
   targets per-component (bottom bar, primary CTAs), not globally; verify with
   `audit.mjs` smallTouch metric, not by eye.

3. **`flex-wrap: wrap` on `flex-col` containers wraps them into off-screen
   columns** — a phone-only wrap rule silently destroyed tablet/desktop rows.
   Lesson: scope wrap rules to `:not([class*="flex-col"])`.

4. **`overflow-x: hidden` on `#root` masks real overflow** — elements were
   clipped, not fixed. Lesson: measure `section.scrollWidth` too; "no document
   overflow" is NOT "no overflow".

5. **A single class (`vol-veil`) can't be both an overlay backdrop and a
   panel surface.** Panels rendered as dark translucent sludge in day theme.
   Lesson: split semantics (`vol-veil` = overlay, `vol-panel` = surface).

6. **Class-based color transforms miss `from-/via-/to-` gradient stops and
   inline `style={{ background }}`** — dark cards survived every pass.
   Lesson: theme-lint must scan gradients, inline styles, and SVG attrs, not
   only `bg-[#...]` utilities.

7. **Luminance checks count `rgba(0,0,0,0)` (transparent) as black** — a
   "0 dark bleed" gate produced 100+ false positives. Lesson: gate on alpha

   > = 0.35 before judging darkness.

8. **Vitest per-test timeout is the THIRD argument** (`it(name, fn, timeout)`)
   — the second-arg form is ignored and tests still die at the default 5s.

9. **Vercel: a manually-created domain alias pins the domain forever and
   blocks auto-aliasing** — every later production deploy goes to a per-commit
   URL while the main link serves an old build. Lesson: never create a manual
   alias for `<project>.vercel.app`; register it as a project domain instead.

10. **`it('...', 20000, fn)` also silently fails** (options-object parse) —
    only the third-arg form works; verify by reading the timeout in the error
    message after the change.

## Workflow contract

- Fixes ship on a NEW branch → PR → human merges to `main`.
- A deleted/rejected PR = a lesson. Record it here. No repeats.

11. **Never `git reset --hard` with uncommitted work** — PR #119 shipped EMPTY because a reset wiped wave-1 edits before staging. Always `git stash` or verify `git diff --stat` is non-empty before commit.
