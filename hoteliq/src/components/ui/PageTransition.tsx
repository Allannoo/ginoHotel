import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

// Контейнер страницы с fade+slide-up входной анимацией
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}

// Обёртка для stagger-анимации списка карточек
export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};
