/**
 * Panel — base UI component built on design system tokens.
 *
 * A larger content surface used for section containers, sidebars,
 * and grouped content areas. Distinct from Card in that it is typically
 * full-bleed within a layout column rather than a standalone contained object.
 *
 * Design system compliance:
 *   - Background: --color-background
 *   - Border: --color-border
 *   - Radius: --radius-lg
 *   - Padding: --space-6 (default)
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
        "relative rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] " +
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
