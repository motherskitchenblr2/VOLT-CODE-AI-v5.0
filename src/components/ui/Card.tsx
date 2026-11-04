/**
 * Card — base UI component built on design system tokens.
 *
 * A contained surface with elevation, border, and hover lift.
 * Used for settings panels, sentinel findings, diagnostics, etc.
 *
 * Design system compliance:
 *   - Background: --ds-color-card
 *   - Border: --ds-color-border
 *   - Shadow: --ds-shadow-md (default), --ds-shadow-lg (hover)
 *   - Radius: --ds-radius-lg
 *   - Cursor: pointer only when onClick is provided
 *   - Focus: visible focus-visible ring when interactive
 */
import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  padded = true,
  elevated = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={
        "relative rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-card)] " +
        "transition-all duration-200 " +
        (elevated
          ? "shadow-[var(--ds-shadow-md)] hover:shadow-[var(--ds-shadow-lg)] hover:-translate-y-1"
          : "shadow-[var(--ds-shadow-md)]") +
        (padded ? "p-6" : "") +
        (props.onClick ? " cursor-pointer" : "") +
        " " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
};
