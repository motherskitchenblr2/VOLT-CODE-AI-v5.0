/**
 * Regression test for the Codex P2 finding on PR #125:
 * common CSS selectors (pseudo-classes, compound, attribute) fell through to
 * "unknown", which sends the analyzer down the non-JS/TS path and downgrades
 * Syntax Repair to Bug Isolation in Auto Detect mode.
 *
 * Imports the real helper module rather than a mirror copy.
 */
import { describe, it, expect } from "vitest";
import { detectLanguage } from "../lib/detectLanguage";

describe("detectLanguage", () => {
  it("detects CSS selectors that use pseudo-classes, compound or attribute forms", () => {
    expect(detectLanguage(".button:hover { color: red; }")).toBe("css");
    expect(detectLanguage("a:focus { outline: none; }")).toBe("css");
    expect(detectLanguage(".btn.primary { padding: 4px; }")).toBe("css");
    expect(detectLanguage("nav > ul li { display: block; }")).toBe("css");
    expect(detectLanguage('[data-state="open"] { opacity: 1; }')).toBe("css");
    expect(detectLanguage("@media (max-width: 600px) { .x { color: red; } }")).toBe(
      "css",
    );
    expect(detectLanguage(".card {\n  color: red;\n}")).toBe("css");
  });

  it("does not steal JS, TS, Python or YAML", () => {
    expect(detectLanguage("const a = 1;")).toBe("javascript");
    expect(detectLanguage("let x = () => 1;")).toBe("javascript");
    expect(detectLanguage("interface Foo { bar: string }")).toBe("typescript");
    expect(detectLanguage("def f(x):\n  return x")).toBe("python");
    expect(detectLanguage("rules:\n  - name: x")).toBe("yaml");
    expect(detectLanguage("")).toBe("unknown");
  });

  it("prefers the file extension when a path is given", () => {
    expect(detectLanguage("const a = 1;", "styles/theme.css")).toBe("css");
    expect(detectLanguage("const a = 1;", "src/app.tsx")).toBe("typescript");
  });
});
