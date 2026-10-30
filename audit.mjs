import { chromium } from "playwright";
import fs from "fs";

/**
 * VOLT dual-theme browser audit (regression gate).
 *   AUDIT_URL=http://localhost:4173 node audit.mjs   (local build)
 *   AUDIT_URL=https://volt-code-ai-v5-0.vercel.app node audit.mjs  (prod)
 * Scans 7 views × 3 viewports × 2 themes (42 checks). Emits AUDIT_REPORT.md + FIX_PROMPT.md.
 */
const BASE = process.env.AUDIT_URL || "http://localhost:4173";
const SHOTS = "/tmp/opencode/shots";
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: "phone-390", w: 390, h: 844, mobile: true },
  { name: "tab-834", w: 834, h: 1112, mobile: true },
  { name: "laptop-1440", w: 1440, h: 900, mobile: false },
];
const VIEWS = [
  ["Editor", ["Editor", "NEW ANALYSIS"]],
  ["IDE Canvas", ["IDE Canvas", "IDE CANVAS"]],
  ["Agent Swarm", ["Agent Swarm", "AGENT SWARM"]],
  ["Agents", ["Agents", "MEETING PANEL"]],
  ["Sentinel", ["Sentinel", "SENTINEL"]],
  ["GitHub", ["GitHub", "GITHUB WORKSPACE"]],
  ["Settings", ["Settings", "SETTINGS"]],
];

const scan = (theme) =>
  (() => {
    const vw = window.innerWidth;
    const sec = document.querySelector("section");
    const masked = sec ? Math.max(0, sec.scrollWidth - sec.clientWidth) : 0;
    const bad = [];
    let shadowed = 0;
    const whiteGlow = [];
    const lightBleed = [];
    const darkBleed = [];
    const isDay = theme === "day";
    document
      .querySelectorAll("section *, aside *, header *, nav *, footer *")
      .forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        if (r.right > vw + 2) {
          bad.push({
            tag: el.tagName.toLowerCase(),
            cls: String(el.className || "").slice(0, 60),
            right: Math.round(r.right),
            w: Math.round(r.width),
            text: (el.textContent || "").trim().slice(0, 24),
          });
        }
        const cs = getComputedStyle(el);
        const sh = cs.boxShadow;
        if (sh && sh !== "none") {
          shadowed++;
          if (!isDay && /255,\s*255,\s*255/.test(sh)) {
            whiteGlow.push({
              cls: String(el.className || "").slice(0, 50),
              sh: sh.slice(0, 48),
            });
          }
        }
        if (!isDay && cs.backgroundColor) {
          const m = cs.backgroundColor.match(
            /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/,
          );
          if (
            m &&
            (m[4] === undefined ? 1 : parseFloat(m[4])) >= 0.5 &&
            r.width * r.height > 2500
          ) {
            const lum = 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3];
            if (lum > 195)
              lightBleed.push({
                cls: String(el.className || "").slice(0, 45),
                bg: cs.backgroundColor,
                text: (el.textContent || "").trim().slice(0, 16),
              });
          }
        }
        if (isDay && cs.backgroundColor) {
          const m = cs.backgroundColor.match(
            /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/,
          );
          if (m && (m[4] === undefined ? 1 : parseFloat(m[4])) >= 0.35) {
            const lum = 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3];
            if (lum < 70 && !String(el.className).includes("vol-code-well")) {
              darkBleed.push({
                cls: String(el.className || "").slice(0, 50),
                bg: cs.backgroundColor,
                text: (el.textContent || "").trim().slice(0, 16),
              });
            }
          }
        }
      });
    const small = [];
    if (vw <= 900) {
      document.querySelectorAll("button, [role=button]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.height < 40)
          small.push({
            h: Math.round(r.height),
            text: (el.textContent || el.getAttribute("aria-label") || "")
              .trim()
              .slice(0, 20),
          });
      });
    }
    return {
      vw,
      theme,
      hOverflow: Math.max(0, document.documentElement.scrollWidth - vw),
      maskedOverflow: masked,
      offenders: bad.length,
      sample: bad.slice(0, 5),
      smallTargets: small.length,
      smallSample: small.slice(0, 4),
      shadowed,
      darkBleed: darkBleed.length,
      darkSample: darkBleed.slice(0, 4),
      whiteGlow: whiteGlow.length,
      whiteGlowSample: whiteGlow.slice(0, 4),
      lightBleed: lightBleed.length,
      lightBleedSample: lightBleed.slice(0, 4),
    };
  })();

async function clickView(page, candidates) {
  for (const label of candidates) {
    const cands = [];
    for (const h of await page
      .locator(`:is(button,div,a):has-text("${label}")`)
      .all()) {
      if (!(await h.isVisible().catch(() => false))) continue;
      const b = await h.boundingBox().catch(() => null);
      if (b) cands.push({ h, area: b.width * b.height });
    }
    cands.sort((a, b) => a.area - b.area);
    if (cands[0]) {
      await cands[0].h.click({ timeout: 2000 }).catch(() => {});
      return label;
    }
    const more = page.locator('button:has-text("MORE")').first();
    if (await more.isVisible().catch(() => false)) {
      await more.click().catch(() => {});
      await page.waitForTimeout(250);
      for (const h of await page
        .locator(`:is(button,div,a):has-text("${label}")`)
        .all()) {
        if (await h.isVisible().catch(() => false)) {
          await h.click({ timeout: 1500 }).catch(() => {});
          return label;
        }
      }
    }
  }
  return false;
}

const out = [];
const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
  });
  await ctx.addInitScript(() => localStorage.setItem("volt_onboarded", "1"));
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  for (const [name, cands] of VIEWS) {
    const clicked = await clickView(page, cands);
    await page.waitForTimeout(900);
    const day = await page.evaluate(scan, "day");
    await page.screenshot({
      path: `${SHOTS}/${vp.name}--${name.replace(/\s+/g, "_")}--day.png`,
    });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });
    await page.waitForTimeout(250);
    const dark = await page.evaluate(scan, "dark");
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "day";
    });
    out.push({ vp: vp.name, view: name, clicked, day, dark });
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync("/tmp/opencode/audit.json", JSON.stringify(out, null, 1));

function isFail(r) {
  return (
    Math.max(r.hOverflow, r.maskedOverflow, r.offenders, r.smallTargets) > 0 ||
    r.darkBleed > 0 ||
    r.whiteGlow > 0 ||
    r.lightBleed > 0
  );
}
const fails = out.filter((o) => isFail(o.day) || isFail(o.dark));
for (const o of out) {
  const f = (t) => (isFail(t) ? "FAIL" : "ok");
  console.log(
    `${o.vp.padEnd(12)} ${o.view.padEnd(12)} day=${f(o.day)}(off=${o.day.offenders},dark=${o.day.darkBleed},shadow=${o.day.shadowed}) dark=${f(o.dark)}(glow=${o.dark.whiteGlow},light=${o.dark.lightBleed},off=${o.dark.offenders})`,
  );
}
for (const o of fails) {
  if (o.dark.whiteGlow > 0)
    console.log(
      `  ✗ ${o.vp}/${o.view} DARK white-glow: ${JSON.stringify(o.dark.whiteGlowSample)}`,
    );
  if (o.dark.lightBleed > 0)
    console.log(
      `  ✗ ${o.vp}/${o.view} DARK light-bleed: ${JSON.stringify(o.dark.lightBleedSample)}`,
    );
  if (o.day.darkBleed > 0)
    console.log(
      `  ✗ ${o.vp}/${o.view} DAY dark-bleed: ${JSON.stringify(o.day.darkSample)}`,
    );
  if (o.day.offenders > 0)
    console.log(
      `  ✗ ${o.vp}/${o.view} DAY overflow: ${JSON.stringify(o.day.sample)}`,
    );
}
const now = new Date().toISOString();
const rows = out
  .map(
    (o) =>
      `| ${o.vp} | ${o.view} | ${o.day.offenders} | ${o.day.darkBleed} | ${o.day.smallTargets} | ${o.dark.whiteGlow} | ${o.dark.lightBleed} | ${o.dark.offenders} |`,
  )
  .join("\n");
const report = `# VOLT Dual-Theme Audit Report — ${now.slice(0, 16)} UTC
Scope: 7 views × 3 viewports × 2 themes = 42 checks.

## Result: ${fails.length ? `❌ ${fails.length} failing check(s)` : "✅ ALL GREEN"}

| Viewport | View | DayOff | DayDark | DaySmall | DarkGlow | DarkLight | DarkOff |
|---|---|---|---|---|---|---|---|
${rows}
`;
const fixPrompt = `# VOLT Auto-Fix Prompt — dual-theme audit ${now.slice(0, 16)} UTC
Branch: \`${process.env.VOLT_BRANCH || "fix/auto"}\`

## Task for any AI/agent
1. Reproduce: \`npm run build && npx vite preview\` then \`AUDIT_URL=http://localhost:4173 node audit.mjs\`.
2. Fix every failing metric: DayDark (dark surfaces in day), DarkGlow (white box-shadows on dark), DarkLight (large light surfaces on dark), overflow/touch.
3. Re-audit until 0 failures. Push, open PR with this file. If rejected, append the reason to AGENT_LESSONS.md.
## Failures
${fails.length ? fails.map((o) => `- ${o.vp} / ${o.view}: ${isFail(o.day) ? "day " + JSON.stringify(o.day.sample) : ""} ${isFail(o.dark) ? "dark glow=" + o.dark.whiteGlow + " light=" + o.dark.lightBleed : ""}`).join("\n") : "None."}
`;
fs.writeFileSync("AUDIT_REPORT.md", report);
fs.writeFileSync("FIX_PROMPT.md", fixPrompt);
console.log(
  fails.length
    ? `→ ${fails.length} failing — AUDIT_REPORT.md + FIX_PROMPT.md written`
    : "→ ALL GREEN — AUDIT_REPORT.md + FIX_PROMPT.md written",
);
process.exit(fails.length ? 1 : 0);
