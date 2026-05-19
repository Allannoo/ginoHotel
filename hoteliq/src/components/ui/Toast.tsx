// Toast-уведомления: контекст + стек справа вверху, автозакрытие через 3с
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/utils/format';

type ToastTone = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; tone: ToastTone; title: string; description?: string; }

interface Ctx {
  push: (t: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast вне ToastProvider');
  return ctx;
}

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <AlertCircle className="h-5 w-5 text-error" />,
  info: <Info className="h-5 w-5 text-info" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = (id: string) => setToasts((arr) => arr.filter((t) => t.id !== id));
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((arr) => [...arr, { ...t, id }]);
    setTimeout(() => remove(id), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'pointer-events-auto bg-bg border border-border shadow-lift rounded-card px-4 py-3 min-w-[280px] max-w-sm flex items-start gap-3',
              )}
            >
              <div className="mt-0.5">{icons[t.tone]}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">{t.title}</p>
                {t.description && <p className="text-xs text-text-muted mt-0.5">{t.description}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="text-text-muted hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
