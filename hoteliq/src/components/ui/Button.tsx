import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/format';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:brightness-110 shadow-soft',
  secondary: 'bg-surface-2 text-text hover:bg-border',
  ghost: 'text-text-muted hover:bg-surface-2 hover:text-text',
  outline: 'border border-border text-text hover:bg-surface-2',
  danger: 'bg-error text-white hover:brightness-110',
  gold: 'bg-gold text-white hover:brightness-110 shadow-soft',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10 p-0',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, leftIcon, rightIcon, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-btn font-semibold transition-all duration-200 ease-smooth',
        'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-ring',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
