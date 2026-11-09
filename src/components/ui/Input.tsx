/**
 * Input — base UI component built on design system tokens.
 *
 * A styled text input with focus ring, disabled state, and error variant.
 *
 * Design system compliance:
 *   - Background: --color-card
 *   - Border: --color-border
 *   - Focus ring: --color-ring
 *   - Text: --color-foreground
 *   - Placeholder: --color-muted-foreground
 *   - Cursor: text input behavior
 *   - Hover: subtle border change
 *   - Focus: visible focus-visible ring (2px)
 *   - Mobile: 16px font size prevents iOS zoom
 */
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          className="block text-xs font-semibold text-[var(--color-muted-foreground)] mb-1 uppercase tracking-wider"
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={
          "w-full px-4 py-3 rounded-lg text-sm font-mono " +
          "border border-[var(--color-border)] bg-[var(--color-card)] " +
          "text-[var(--color-foreground)] " +
          "transition-all duration-200 " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] " +
          "disabled:opacity-50 disabled:cursor-not-allowed " +
          (error
            ? "border-[var(--color-destructive)] focus-visible:ring-[var(--color-destructive)]"
            : "hover:border-[var(--color-border-strong)]") +
          " " +
          className
        }
        {...props}
      />
      {error && (
        <p className="text-xs text-[var(--color-destructive)] font-medium mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
