/**
 * Button — base UI component built on design system tokens.
 *
 * Variants:
 *   primary     — Filled accent button for primary actions (RUN AI, FIX ALL)
 *   secondary   — Outlined button for secondary actions
 *   ghost       — Transparent button for subtle actions
 *   destructive — Red-filled button for destructive actions
 *
 * Design system compliance:
 *   - Colors: --color-accent, --color-destructive, --color-border
 *   - Spacing: --space-*, --radius-*
 *   - Hover: smooth 200ms transition
 *   - Focus: visible focus-visible ring (--color-ring)
 *   - Cursor: pointer on all variants
 *   - Touch: 44px minimum height on mobile
 *   - No emojis as icons (use Lucide SVG)
 */
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-semibold rounded " +
    "transition-all duration-200 cursor-pointer " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-[var(--color-ring)] " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none " +
    "btn";

  const variantClasses: Record<string, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    destructive: "btn-destructive",
  };

  const sizeClasses: Record<string, string> = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <span
          className="mr-2 inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        ></span>
      )}
      {children}
    </button>
  );
};
