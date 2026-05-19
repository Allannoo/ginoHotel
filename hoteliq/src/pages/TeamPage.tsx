// Раздел «Команда» — тонкая обёртка вокруг универсального TeamManager.
// Тот же компонент используется во вкладке «Сотрудники» в Настройках,
// чтобы интерфейс был идентичным в обоих местах.
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { TeamManager } from '@/components/TeamManager';

export default function TeamPage() {
  return (
    <PageTransition>
      <PageHeader title="Команда" subtitle="Сотрудники, роли, доступы" />
      <TeamManager />
    </PageTransition>
  );
}
