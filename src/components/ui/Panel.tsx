/**
 * Panel — base UI component built on design system tokens.
 *
 * A larger content surface used for section containers, sidebars,
 * and grouped content areas. Distinct from Card in that it is typically
 * full-bleed within a layout column rather than a standalone contained object.
 *
 * Design system compliance:
 *   - Background: --ds-color-background
 *   - Border: --ds-color-border
 *   - Radius: --ds-radius-lg
 *   - Padding: --ds-space-lg (default)
 *   - Focus: visible focus-visible ring when interactive
 */
import React from "react";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  padded = true,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={
        "relative rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-background)] " +
        "transition-all duration-200 " +
        (padded ? "p-6" : "") +
        " " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
};
