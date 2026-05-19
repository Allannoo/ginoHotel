import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/format';

const base = 'w-full bg-surface border border-border rounded-btn px-3.5 text-sm text-text placeholder:text-text-muted/70 focus-ring transition-colors';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: ReactNode;
  hint?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, leftIcon, hint, className, id, ...rest }, ref,
) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="block text-xs font-semibold text-text-muted mb-1.5">{label}</span>}
      <div className="relative">
        {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{leftIcon}</span>}
        <input
          ref={ref}
          id={id}
          className={cn(base, 'h-10', leftIcon && 'pl-9', className)}
          {...rest}
        />
      </div>
      {hint && <span className="block text-[11px] text-text-muted mt-1">{hint}</span>}
    </label>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, className, ...rest }, ref,
) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-text-muted mb-1.5">{label}</span>}
      <select ref={ref} className={cn(base, 'h-10 cursor-pointer', className)} {...rest}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, className, ...rest }, ref,
) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-text-muted mb-1.5">{label}</span>}
      <textarea ref={ref} className={cn(base, 'py-2 min-h-[88px]', className)} {...rest} />
    </label>
  );
});
