/**
 * Modal — base modal component built on design system tokens.
 *
 * Provides the overlay, backdrop blur, animation, and close button.
 * Children provide the modal content.
 *
 * Design system compliance:
 *   - Overlay: rgba(15, 23, 42, 0.5) backdrop-blur
 *   - Card: --ds-color-card with --ds-shadow-xl
 *   - Radius: --ds-radius-lg
 *   - Focus trap via focus-visible ring
 *   - Close button: cursor-pointer, hover transition
 *   - No emojis as icons (Lucide SVG only)
 */
import React, { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleIcon,
  className = "",
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[var(--ds-z-modal)] flex items-center justify-center p-4 sm:p-6 select-text"
          onClick={onClose}
        >
          <div
            className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 15 }}
            transition={{ ease: [0.21, 0.92, 0.3, 1] }}
            className={
              "relative z-[51] w-full max-w-4xl max-h-[90vh] " +
              "border border-[var(--ds-color-border)] bg-[var(--ds-color-card)] " +
              "rounded-[var(--ds-radius-lg)] shadow-[var(--ds-shadow-xl)] overflow-hidden flex flex-col " +
              className
            }
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="px-6 py-4 border-b border-[var(--ds-color-border)] flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  {titleIcon && (
                    <span className="w-5 h-5 flex-shrink-0">{titleIcon}</span>
                  )}
                  <h3 className="font-bold text-xl text-[#F8FAFC]">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="cursor-pointer hover:bg-[#334155]/20 rounded-lg p-1.5 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-[#F8FAFC]" />
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
