/**
 * Input — base UI component built on design system tokens.
 *
 * A styled text input with focus ring, disabled state, and error variant.
 *
 * Design system compliance:
 *   - Background: --ds-color-card
 *   - Border: --ds-color-border
 *   - Focus ring: --ds-color-ring
 *   - Text: --ds-color-foreground
 *   - Placeholder: --ds-color-muted-foreground
 *   - Cursor: text input behavior
 *   - Hover: subtle border change
 *   - Focus: visible focus-visible ring (2px)
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
  ...props
}) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          className="block text-xs font-semibold text-[#94A3B8] mb-1 uppercase tracking-wider"
          htmlFor={props.id}
        >
          {label}
        </label>
      )}
      <input
        className={
          "w-full px-4 py-2.5 rounded-lg text-sm font-mono " +
          "border border-[var(--ds-color-border)] bg-[var(--ds-color-card)] " +
          "text-[var(--ds-color-foreground)] " +
          "transition-all duration-200 " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-color-ring)] " +
          "disabled:opacity-50 disabled:cursor-not-allowed " +
          (error
            ? "border-[#EF4444] focus-visible:ring-[#EF4444]"
            : "hover:border-[#475569]") +
          " " +
          className
        }
        {...props}
      />
      {error && (
        <p className="text-xs text-[#EF4444] font-medium mt-1">{error}</p>
      )}
    </div>
  );
};
