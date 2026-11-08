/**
 * Modal — base modal component built on design system tokens.
 *
 * Provides the overlay, backdrop blur, animation, and close button.
 * Children provide the modal content.
 *
 * Design system compliance:
 *   - Overlay: rgba(5, 5, 5, 0.6) backdrop-blur
 *   - Card: --color-card with --shadow-xl
 *   - Radius: --radius-xl
 *   - Focus trap via focus-visible ring
 *   - Close button: cursor-pointer, hover transition
 *   - No emojis as icons (Lucide SVG only)
 *   - Mobile: full-screen on small screens
 */
import React, { ReactNode, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: ReactNode;
  className?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleIcon,
  className = "",
  children,
  size = "md",
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus first focusable element
      setTimeout(() => {
        contentRef.current?.focus();
      }, 0);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
        if (e.key === "Tab") {
          const focusableElements =
            contentRef.current?.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
          if (!focusableElements?.length) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  const sizeClasses: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-full mx-4 my-4",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 select-text"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          <div
            className="absolute inset-0 bg-[var(--color-background)]/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ ease: [0.21, 0.92, 0.3, 1], duration: 0.2 }}
            className={
              "relative z-[51] w-full " +
              sizeClasses[size] +
              " max-h-[90vh] " +
              "border border-[var(--color-border-strong)] bg-[var(--color-card)] " +
              "rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden flex flex-col " +
              className
            }
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  {titleIcon && (
                    <span className="w-5 h-5 flex-shrink-0">{titleIcon}</span>
                  )}
                  <h3
                    id="modal-title"
                    className="font-bold text-xl text-[var(--color-foreground)]"
                  >
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="icon-btn hover:bg-[var(--color-accent-soft)] hover:border-[var(--color-border)] rounded-lg p-1.5 transition-colors duration-200"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-[var(--color-foreground)]" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
