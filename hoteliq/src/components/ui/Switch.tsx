// Универсальный переключатель (toggle/switch). Заменяет inline-реализации,
// которые были визуально кривые (несимметричные отступы ползунка).
import { cn } from '@/utils/format';

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  hint?: string;
  /** Подпись располагается слева (по умолчанию) или справа. */
  labelPosition?: 'left' | 'right';
  className?: string;
  id?: string;
}

export function Switch({
  checked, onChange, disabled, size = 'md', label, hint, labelPosition = 'left', className, id,
}: SwitchProps) {
  // Размеры рассчитаны так, чтобы ползунок имел одинаковый зазор слева и справа.
  // Трек: w-11 (44px), ползунок: 20px, отступ: 2px → ход 20px (translate-x-5).
  // Маленький размер: w-9 (36px), ползунок: 16px, отступ: 2px → ход 16px (translate-x-4).
  const cfg = size === 'sm'
    ? { track: 'h-5 w-9', knob: 'h-4 w-4', travel: 'translate-x-4' }
    : { track: 'h-6 w-11', knob: 'h-5 w-5', travel: 'translate-x-5' };

  const handleToggle = () => { if (!disabled) onChange(!checked); };

  const toggle = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        'relative inline-flex shrink-0 rounded-full transition-colors duration-200 focus-ring',
        cfg.track,
        checked ? 'bg-primary' : 'bg-border',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 left-0.5 rounded-full bg-white shadow-soft transition-transform duration-200 ease-out',
          cfg.knob,
          checked && cfg.travel,
        )}
      />
    </button>
  );

  if (!label) return <span className={className}>{toggle}</span>;

  return (
    <label
      htmlFor={id}
      className={cn('flex items-center justify-between gap-3 cursor-pointer select-none', disabled && 'cursor-not-allowed', className)}
    >
      {labelPosition === 'left' && (
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text">{label}</span>
          {hint && <span className="block text-xs text-text-muted mt-0.5">{hint}</span>}
        </span>
      )}
      {toggle}
      {labelPosition === 'right' && (
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-text">{label}</span>
          {hint && <span className="block text-xs text-text-muted mt-0.5">{hint}</span>}
        </span>
      )}
    </label>
  );
}
