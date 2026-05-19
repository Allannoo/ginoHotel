// Заголовок раздела — единый компонент для всех страниц
import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-3xl text-text leading-none">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-2">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
