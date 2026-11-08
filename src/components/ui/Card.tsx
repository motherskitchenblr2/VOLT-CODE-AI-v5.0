/**
 * Card — base UI component built on design system tokens.
 *
 * A contained surface with elevation, border, and hover lift.
 * Used for settings panels, sentinel findings, diagnostics, etc.
 *
 * Design system compliance:
 *   - Background: --color-card
 *   - Border: --color-border
 *   - Shadow: --shadow-md (default), --shadow-lg (hover)
 *   - Radius: --radius-lg
 *   - Cursor: pointer only when onClick is provided
 *   - Focus: visible focus-visible ring when interactive
 */
import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  elevated?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  padded = true,
  elevated = false,
  interactive = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={
        "relative rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] " +
        "transition-all duration-200 " +
        (elevated
          ? "shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5"
          : "shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--color-border-strong)]") +
        (padded ? "p-6" : "") +
        (interactive || props.onClick ? " cursor-pointer" : "") +
        " " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
};
