// Задачи: Kanban + статусы номеров + расписание персонала
import { useState } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Plus, Sparkles, Wrench, Eye, KeyRound, Calendar as CalIcon } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { tasks as initial, staff, rooms, properties } from '@/mock/data';
import type { Task, TaskStatus, RoomStatus } from '@/types';
import { cn } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

const COLUMNS: { id: TaskStatus; label: string; tone: 'neutral' | 'warning' | 'success' }[] = [
  { id: 'todo', label: 'К выполнению', tone: 'neutral' },
  { id: 'in_progress', label: 'В работе', tone: 'warning' },
  { id: 'done', label: 'Выполнено', tone: 'success' },
];

const TYPE_ICON = {
  cleaning: <Sparkles className="h-3.5 w-3.5" />,
  repair: <Wrench className="h-3.5 w-3.5" />,
  inspection: <Eye className="h-3.5 w-3.5" />,
  checkin: <KeyRound className="h-3.5 w-3.5" />,
  other: <CalIcon className="h-3.5 w-3.5" />,
};

const ROOM_STATUS_TONE: Record<RoomStatus, 'success' | 'warning' | 'primary' | 'info' | 'error'> = {
  clean: 'success', dirty: 'warning', occupied: 'primary', inspection: 'info', maintenance: 'error',
};
const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  clean: 'Чисто', dirty: 'Грязно', occupied: 'Занят', inspection: 'Проверка', maintenance: 'Ремонт',
};

export default function TasksPage() {
  const [items, setItems] = useState(initial);
  const [view, setView] = useState<'kanban' | 'rooms' | 'schedule'>('kanban');
  const { push } = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over) return;
    const tid = String(e.active.id);
    const target = String(e.over.id) as TaskStatus;
    setItems((arr) => arr.map((t) => t.id === tid ? { ...t, status: target } : t));
    push({ tone: 'success', title: 'Задача обновлена' });
  };

  return (
    <PageTransition>
      <PageHeader
        title="Задачи и Персонал"
        subtitle="Управление работой команды"
        action={
          <>
            <div className="bg-surface-2 rounded-btn p-1 flex">
              {(['kanban', 'rooms', 'schedule'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={cn('px-3 h-8 rounded-md text-xs font-bold transition-colors',
                    view === v ? 'bg-bg text-text shadow-soft' : 'text-text-muted')}>
                  {v === 'kanban' ? 'Доска' : v === 'rooms' ? 'Номера' : 'Расписание'}
                </button>
              ))}
            </div>
            <Button size="md" leftIcon={<Plus className="h-4 w-4" />}>Новая задача</Button>
          </>
        }
      />

      {view === 'kanban' && (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <Column key={col.id} {...col} tasks={items.filter((t) => t.status === col.id)} />
            ))}
          </div>
        </DndContext>
      )}

      {view === 'rooms' && <RoomsBoard />}
      {view === 'schedule' && <ScheduleBoard />}
    </PageTransition>
  );
}

function Column({ id, label, tone, tasks }: { id: TaskStatus; label: string; tone: 'neutral' | 'warning' | 'success'; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn(
      'bg-surface rounded-card border border-border p-3 transition-colors min-h-[400px]',
      isOver && 'bg-primary/5 border-primary',
    )}>
      <div className="flex items-center justify-between mb-3 px-1">
        <Badge tone={tone}>{label}</Badge>
        <span className="text-xs font-bold text-text-muted">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
        {tasks.length === 0 && (
          <p className="text-center text-xs text-text-muted py-8 border-2 border-dashed border-border rounded-btn">
            Перетащите задачу сюда
          </p>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const prio = { low: 'neutral', medium: 'warning', high: 'error' } as const;
  return (
    <div
      ref={setNodeRef} {...attributes} {...listeners}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.8 : 1,
      }}
      className="bg-bg border border-border rounded-btn p-3 cursor-grab active:cursor-grabbing hover-lift"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge tone="neutral"><span className="flex items-center gap-1">{TYPE_ICON[task.type]} {task.type}</span></Badge>
        <Badge tone={prio[task.priority]} dot>{task.priority}</Badge>
      </div>
      <p className="font-bold text-sm text-text leading-snug">{task.title}</p>
      <p className="text-xs text-text-muted mt-1">{task.description}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-xs text-text-muted">👤 {task.assignee}</span>
        <span className="text-xs font-bold text-text">⏱ {task.dueDate.slice(5)}</span>
      </div>
    </div>
  );
}

function RoomsBoard() {
  return (
    <div className="space-y-4">
      {properties.filter((p) => p.type === 'hotel').map((p) => {
        const propRooms = rooms.filter((r) => r.propertyId === p.id);
        return (
          <Card key={p.id} padding="md">
            <CardHeader title={p.name} subtitle={`${propRooms.length} номеров`} />
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {propRooms.map((r) => {
                const colors: Record<RoomStatus, string> = {
                  clean: 'bg-success/15 border-success text-success',
                  dirty: 'bg-warning/15 border-warning text-warning',
                  occupied: 'bg-primary/15 border-primary text-primary',
                  inspection: 'bg-info/15 border-info text-info',
                  maintenance: 'bg-error/15 border-error text-error',
                };
                return (
                  <div key={r.id} className={cn(
                    'aspect-square rounded-btn border-2 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform',
                    colors[r.status],
                  )} title={ROOM_STATUS_LABEL[r.status]}>
                    <span className="font-bold text-sm">{r.number}</span>
                    <span className="text-[9px] uppercase mt-0.5">{ROOM_STATUS_LABEL[r.status].slice(0, 6)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ScheduleBoard() {
  const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const shiftStyle = {
    off: 'bg-surface-2 text-text-muted',
    morning: 'bg-success/20 text-success',
    evening: 'bg-warning/20 text-warning',
    night: 'bg-primary/20 text-primary',
  };
  const shiftLabel = { off: 'Вых', morning: 'Утро', evening: 'Вечер', night: 'Ночь' };
  return (
    <Card padding="none" className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-surface-2">
          <tr>
            <th className="px-4 py-3 text-left text-xs uppercase font-bold text-text-muted">Сотрудник</th>
            {DAYS.map((d) => <th key={d} className="px-2 py-3 text-center text-xs uppercase font-bold text-text-muted">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.avatar}</span>
                  <div>
                    <p className="font-bold text-text text-sm">{s.name}</p>
                    <p className="text-xs text-text-muted">{s.role}</p>
                  </div>
                </div>
              </td>
              {s.schedule.map((sh, i) => (
                <td key={i} className="px-1 py-2">
                  <div className={cn('h-9 rounded-btn flex items-center justify-center text-xs font-bold', shiftStyle[sh])}>
                    {shiftLabel[sh]}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
