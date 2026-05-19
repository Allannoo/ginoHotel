import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {icon && <div className="mb-4 text-5xl opacity-60">{icon}</div>}
      <h3 className="font-display text-lg text-text mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-md mb-4">{description}</p>}
      {action}
    </div>
  );
}
