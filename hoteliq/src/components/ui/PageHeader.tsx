// Заголовок раздела — единый компонент для всех страниц
import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl sm:text-3xl text-text leading-tight break-words">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-2">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
