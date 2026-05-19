import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/format';

interface Props extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const pads = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };

export function Card({ hoverable, padding = 'md', className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-card shadow-soft',
        pads[padding],
        hoverable && 'hover-lift cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-display text-lg leading-tight text-text">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
