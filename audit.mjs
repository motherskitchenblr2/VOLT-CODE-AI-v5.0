import { chromium } from "playwright";
import fs from "fs";

const BASE = process.env.AUDIT_URL || "https://volt-code-ai-v5-0.vercel.app";
const SHOTS = "/tmp/opencode/shots";
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: "phone-390", w: 390, h: 844, mobile: true },
  { name: "tab-834", w: 834, h: 1112, mobile: true },
  { name: "laptop-1440", w: 1440, h: 900, mobile: false },
];
// [display label, candidates to click — mobile/container labels then laptop sidebar labels]
const VIEWS = [
  ["Editor", ["Editor", "NEW ANALYSIS"]],
  ["IDE Canvas", ["IDE Canvas", "IDE CANVAS"]],
  ["Agent Swarm", ["Agent Swarm", "AGENT SWARM"]],
  ["Volt Hub", ["Volt Hub", "VOLT HUB"]],
  ["Agents", ["Agents", "MEETING PANEL"]],
  ["Sentinel", ["Sentinel", "SENTINEL"]],
  ["GitHub", ["GitHub", "GITHUB WORKSPACE"]],
  ["Settings", ["Settings", "SETTINGS"]],
];

const scan = () =>
  (() => {
    const vw = window.innerWidth;
    const sec = document.querySelector("section");
    const masked = sec ? Math.max(0, sec.scrollWidth - sec.clientWidth) : 0;
    const bad = [];
    let shadowed = 0;
    const shadowSample = [];
    document.querySelectorAll("section *, aside *, header *, nav *, footer *").forEach((el) => {
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
      const sh = getComputedStyle(el).boxShadow;
      if (sh && sh !== "none") {
        shadowed++;
        if (shadowSample.length < 4 && r.width > 60 && r.height > 30) shadowSample.push({ cls: String(el.className || "").slice(0, 40), sh: sh.slice(0, 46) });
      }
    });
    const small = [];
    if (vw <= 900) {
      document.querySelectorAll("button, [role=button]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.height < 40)
          small.push({ h: Math.round(r.height), text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20) });
      });
    }
    return {
      vw,
      scrollW: document.documentElement.scrollWidth,
      hOverflow: Math.max(0, document.documentElement.scrollWidth - vw),
      maskedOverflow: masked,
      offenders: bad.length,
      sample: bad.slice(0, 5),
      smallTargets: small.length,
      smallSample: small.slice(0, 5),
      shadowed,
      shadowSample,
    };
  })();

async function clickView(page, candidates) {
  for (const label of candidates) {
    const loc = page.locator(`:is(button,div,a):has-text("${label}")`);
    const all = await loc.all();
    // innermost first: smallest area that is visible
    const cands = [];
    for (const h of all) {
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
      const all2 = await loc.all();
      for (const h of all2) if (await h.isVisible().catch(() => false)) { await h.click({ timeout: 1500 }).catch(() => {}); return label; }
    }
  }
  return false;
}

const out = [];
const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.mobile, hasTouch: vp.mobile });
  await ctx.addInitScript(() => localStorage.setItem("volt_onboarded", "1"));
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  for (const [name, cands] of VIEWS) {
    const clicked = await clickView(page, cands);
    await page.waitForTimeout(900);
    const r = await page.evaluate(scan);
    const file = `${SHOTS}/${vp.name}--${name.replace(/\s+/g, "_")}.png`;
    await page.screenshot({ path: file });
    out.push({ vp: vp.name, view: name, clicked, ...r, file });
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync("/tmp/opencode/audit.json", JSON.stringify(out, null, 1));
for (const r of out) {
  const worst = Math.max(r.hOverflow, r.maskedOverflow);
  console.log(`${r.vp.padEnd(12)} ${r.view.padEnd(12)} ${worst > 0 ? "OVERFLOW" : "ok      "} mask=${r.maskedOverflow} doc=${r.hOverflow} off=${r.offenders} small=${r.smallTargets} shadows=${r.shadowed} click=${r.clicked}`);
}
