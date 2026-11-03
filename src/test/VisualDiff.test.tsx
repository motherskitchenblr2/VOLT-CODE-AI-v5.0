/**
 * Mobile diff inspector: on phones (<md) the side-by-side view must show one
 * pane at a time behind a [Original] [Patch] [Diff] toggle, while ≥md keeps
 * both columns. Tailwind's `hidden md:block` is what does the split; this test
 * asserts the `hidden` class is toggled on exactly one pane at a time.
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VisualDiff } from "../components/VisualDiff";

const issue = {
  id: 1,
  type: "Null check",
  severity: "High" as const,
  description: "Missing guard",
  explanation: "Add a guard.",
  original: "const a = 1;\nconst b = 2;",
  fixed: "const a = 1;\nconst b = 3;",
};

const paneOf = (label: string) =>
  screen.getByText(label, { selector: "div" }).parentElement as HTMLElement;

describe("VisualDiff mobile panes", () => {
  it("shows one pane at a time with the toggle", () => {
    render(
      <VisualDiff
        issues={[issue]}
        acceptedHunkIds={[]}
        onToggleHunk={() => {}}
      />,
    );

    fireEvent.click(screen.getByText("Side-By-Side"));

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    // default pane is Diff → both code columns hidden on mobile
    expect(paneOf("Original Code").className).toContain("hidden");
    expect(paneOf("Staged Patch").className).toContain("hidden");

    fireEvent.click(screen.getByText("Original"));
    expect(paneOf("Original Code").className).not.toContain("hidden");
    expect(paneOf("Staged Patch").className).toContain("hidden");

    fireEvent.click(screen.getByText("Patch"));
    expect(paneOf("Original Code").className).toContain("hidden");
    expect(paneOf("Staged Patch").className).not.toContain("hidden");

    fireEvent.click(screen.getByText("Diff"));
    expect(paneOf("Original Code").className).toContain("hidden");
    expect(paneOf("Staged Patch").className).toContain("hidden");
  });
});
