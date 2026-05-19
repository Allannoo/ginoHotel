// Премиальный аватар: инициалы в градиентном круге.
// Цвет градиента детерминированно зависит от имени.
import { cn } from '@/utils/format';

const GRADIENTS = [
  'from-primary to-info',
  'from-primary to-gold',
  'from-info to-success',
  'from-gold to-warning',
  'from-success to-info',
  'from-error to-gold',
  'from-info to-primary',
  'from-success to-primary',
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const sizeMap: Record<Size, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-2xl',
};

export function Avatar({
  name, size = 'md', className, ring, src,
}: { name: string; size?: Size; className?: string; ring?: boolean; src?: string }) {
  const g = GRADIENTS[hash(name) % GRADIENTS.length];
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'shrink-0 rounded-full object-cover select-none shadow-soft',
          sizeMap[size],
          ring && 'ring-2 ring-bg',
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        'shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold tracking-tight select-none shadow-soft',
        g,
        sizeMap[size],
        ring && 'ring-2 ring-bg',
        className,
      )}
      aria-label={name}
    >
      {initialsOf(name)}
    </div>
  );
}
