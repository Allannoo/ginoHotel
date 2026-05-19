import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';
import { cn } from '@/utils/format';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn(
              'relative w-full bg-bg border border-border rounded-modal shadow-lift overflow-hidden',
              sizes[size],
            )}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
                <div>
                  {title && <h2 className="font-display text-xl text-text">{title}</h2>}
                  {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="text-text-muted hover:text-text rounded-btn p-1.5 hover:bg-surface-2 transition" aria-label="Закрыть">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
            {footer && (
              <div className="px-6 py-4 border-t border-border bg-surface flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
