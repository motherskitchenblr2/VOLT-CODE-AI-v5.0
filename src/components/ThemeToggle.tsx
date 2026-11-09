import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Day (neumorphic) / Dark theme switch. Persists in localStorage; attr on <html>. */
export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [isDay, setIsDay] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("volt-theme");
    if (stored) return stored !== "dark";
    return document.documentElement.dataset.theme !== "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = isDay ? "day" : "dark";
  }, [isDay]);

  const toggle = () => {
    const next = !isDay;
    setIsDay(next);
    localStorage.setItem("volt-theme", next ? "day" : "dark");
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDay ? "Switch to dark theme" : "Switch to day theme"}
      className={`icon-btn rounded-xl border border-[var(--color-border)] ${
        compact ? "" : ""
      }`}
      style={{ minHeight: "44px", minWidth: "44px" }}
    >
      {isDay ? (
        <Moon className="w-5 h-5 text-[var(--color-accent)]" />
      ) : (
        <Sun className="w-5 h-5 text-[var(--color-accent)]" />
      )}
    </button>
  );
};
