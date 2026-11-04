/**
 * Button — base UI component built on design system tokens.
 *
 * Variants:
 *   primary   — Filled accent button for primary actions (RUN AI, FIX ALL)
 *   secondary — Outlined button for secondary actions
 *   ghost     — Transparent button for subtle actions
 *   destructive — Red-filled button for destructive actions
 *
 * Design system compliance:
 *   - Colors: --ds-color-accent, --ds-color-primary, --ds-color-destructive
 *   - Spacing: --ds-space-*, --ds-radius-*
 *   - Hover: smooth 200ms transition
 *   - Focus: visible focus-visible ring
 *   - Cursor: pointer on all variants
 *   - No emojis as icons (use Lucide SVG)
 */
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
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
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  const variantClasses: Record<string, string> = {
    primary:
      "bg-[#22C55E] text-[#0F172A] hover:bg-[#16A34A] active:scale-[0.97] shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]",
    secondary:
      "bg-transparent border border-[#475569] text-[#F8FAFC] hover:bg-[#334155]/20 active:scale-[0.97]",
    ghost:
      "bg-transparent text-[#94A3B8] hover:bg-[#334155]/20 hover:text-[#F8FAFC] active:scale-[0.97]",
    destructive:
      "bg-[#EF4444] text-[#FFFFFF] hover:bg-[#DC2626] active:scale-[0.97] shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]",
  };

  const sizeClasses: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <span className="mr-2 inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-[spin_1s_linear_infinite]"></span>
      )}
      {children}
    </button>
  );
};
