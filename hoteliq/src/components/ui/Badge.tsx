import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gold';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-text-muted',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  gold: 'bg-gold/15 text-gold',
};

export function Badge({ children, tone = 'neutral', className, dot }: {
  children: ReactNode; tone?: Tone; className?: string; dot?: boolean;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      tones[tone], className,
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', {
        'bg-text-muted': tone === 'neutral',
        'bg-primary': tone === 'primary',
        'bg-success': tone === 'success',
        'bg-warning': tone === 'warning',
        'bg-error': tone === 'error',
        'bg-info': tone === 'info',
        'bg-gold': tone === 'gold',
      })} />}
      {children}
    </span>
  );
}
