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
      className={`flex items-center justify-center rounded-xl border vol-ring transition-all cursor-pointer ${
        compact ? "h-10 w-10" : "h-10 w-10"
      }`}
    >
      {isDay ? (
        <Moon className="w-4 h-4 vol-accent" />
      ) : (
        <Sun className="w-4 h-4 vol-accent" />
      )}
    </button>
  );
};
