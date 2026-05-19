// Анимированный счётчик count-up
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { fmtMoney, fmtNum } from '@/utils/format';

interface Props {
  value: number;
  duration?: number;
  format?: 'number' | 'money' | 'percent' | 'compact-money';
  className?: string;
}

export function CountUp({ value, duration = 1.2, format = 'number', className }: Props) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => {
    if (format === 'percent') return `${Math.round(v)}%`;
    if (format === 'money') return fmtMoney(Math.round(v));
    if (format === 'compact-money') return fmtMoney(Math.round(v), { compact: true });
    return fmtNum(Math.round(v));
  });
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.4, 0, 0.2, 1] });
    return () => controls.stop();
  }, [value, duration, mv]);
  return <motion.span className={className}>{rounded}</motion.span>;
}
