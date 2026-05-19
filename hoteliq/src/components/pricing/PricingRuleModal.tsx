// Модалка создания/редактирования правила авто-ценообразования
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import type { PricingRule } from '@/types';
import { properties } from '@/mock/data';

export const RULE_CONDITION_LABEL: Record<PricingRule['condition'], string> = {
  'occupancy-above': 'Загрузка выше %',
  'occupancy-below': 'Загрузка ниже %',
  'days-ahead': 'Раннее бронирование (за N дней)',
  'last-minute': 'Last-minute (за 1–2 дня)',
  'weekend': 'Выходные (Пт–Сб)',
  'day-of-week': 'Конкретные дни недели',
  'holiday': 'Государственные праздники',
  'event': 'Событие в городе',
  'season': 'Высокий сезон',
  'long-stay': 'Длинное проживание (от N ночей)',
  'short-stay': 'Короткое проживание (1–2 ночи)',
  'channel-specific': 'Конкретный канал бронирования',
  'competitor-cheaper': 'Конкуренты дешевле',
  'competitor-expensive': 'Конкуренты дороже',
  'low-pace': 'Низкий pace vs прошлый год',
  'high-pace': 'Высокий pace vs прошлый год',
};

const ACTION_LABEL: Record<PricingRule['action'], string> = {
  'increase': 'Повысить цену',
  'decrease': 'Снизить цену',
  'set-fixed': 'Зафиксировать цену',
};

const CHANNELS: Array<{ value: string; label: string }> = [
  { value: 'direct', label: 'Прямая бронь (сайт)' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'ostrovok', label: 'Ostrovok' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'avito', label: 'Авито' },
  { value: 'sutochno', label: 'Суточно.ру' },
  { value: 'walk-in', label: 'Walk-in' },
];

const DOW = [
  { v: 1, l: 'Пн' }, { v: 2, l: 'Вт' }, { v: 3, l: 'Ср' },
  { v: 4, l: 'Чт' }, { v: 5, l: 'Пт' }, { v: 6, l: 'Сб' }, { v: 0, l: 'Вс' },
];

function thresholdUnit(c: PricingRule['condition']): string {
  switch (c) {
    case 'occupancy-above':
    case 'occupancy-below':
    case 'low-pace':
    case 'high-pace':
      return '%';
    case 'days-ahead':
    case 'last-minute':
      return 'дней до заезда';
    case 'long-stay':
    case 'short-stay':
      return 'ночей';
    case 'competitor-cheaper':
    case 'competitor-expensive':
      return '% разницы';
    default:
      return '';
  }
}

function thresholdNeeded(c: PricingRule['condition']): boolean {
  return !['weekend', 'day-of-week', 'holiday', 'event', 'season', 'channel-specific'].includes(c);
}

export function PricingRuleModal({
  open, onClose, onSave, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (rule: PricingRule) => void;
  initial?: PricingRule | null;
}) {
  const blank: PricingRule = {
    id: `rule-${Date.now()}`,
    propertyId: 'all',
    name: '',
    condition: 'occupancy-above',
    threshold: 80,
    action: 'increase',
    amount: 10,
    enabled: true,
    priority: 5,
    daysOfWeek: [],
    channels: [],
  };
  const [draft, setDraft] = useState<PricingRule>(initial ?? blank);

  useEffect(() => {
    if (open) setDraft(initial ?? blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const toggleDow = (d: number) => {
    const cur = draft.daysOfWeek ?? [];
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
    setDraft({ ...draft, daysOfWeek: next });
  };
  const toggleChannel = (c: string) => {
    const cur = draft.channels ?? [];
    const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
    setDraft({ ...draft, channels: next });
  };

  const handleSave = () => {
    if (!draft.name.trim()) return;
    onSave(draft);
    onClose();
  };

  const unit = thresholdUnit(draft.condition);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Редактировать правило' : 'Новое правило ценообразования'}
      subtitle="Правила применяются по приоритету (меньше = раньше). Несколько правил можно комбинировать."
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-text-muted">Название правила</label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Например: +20% на выходные летом"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-text-muted">Объект</label>
            <Select
              value={draft.propertyId}
              onChange={(e) => setDraft({ ...draft, propertyId: e.target.value })}
              options={[
                { value: 'all', label: 'Все объекты' },
                ...properties.map((p) => ({ value: p.id, label: `${p.type === 'hotel' ? '🏨' : '🏠'} ${p.name}` })),
              ]}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-text-muted">Приоритет (1 — высший)</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) || 5 })}
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-text-muted">Когда срабатывает (условие)</label>
          <Select
            value={draft.condition}
            onChange={(e) => setDraft({ ...draft, condition: e.target.value as PricingRule['condition'], threshold: 0 })}
            options={(Object.keys(RULE_CONDITION_LABEL) as PricingRule['condition'][]).map((k) => ({
              value: k,
              label: RULE_CONDITION_LABEL[k],
            }))}
          />
        </div>

        {/* Порог (если нужен для условия) */}
        {thresholdNeeded(draft.condition) && (
          <div>
            <label className="text-[11px] font-bold text-text-muted">Значение порога {unit && <span className="text-text-muted/70">({unit})</span>}</label>
            <Input
              type="number"
              value={draft.threshold}
              onChange={(e) => setDraft({ ...draft, threshold: Number(e.target.value) || 0 })}
            />
          </div>
        )}

        {/* Дни недели */}
        {draft.condition === 'day-of-week' && (
          <div>
            <label className="text-[11px] font-bold text-text-muted block mb-1.5">Дни недели</label>
            <div className="flex gap-1.5">
              {DOW.map((d) => {
                const active = (draft.daysOfWeek ?? []).includes(d.v);
                return (
                  <button
                    key={d.v}
                    onClick={() => toggleDow(d.v)}
                    className={`px-3 h-9 rounded-btn text-sm font-bold border transition ${
                      active ? 'bg-primary text-white border-primary' : 'bg-surface text-text-muted border-border hover:border-primary/50'
                    }`}
                  >
                    {d.l}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Каналы */}
        {draft.condition === 'channel-specific' && (
          <div>
            <label className="text-[11px] font-bold text-text-muted block mb-1.5">Каналы бронирования</label>
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map((c) => {
                const active = (draft.channels ?? []).includes(c.value);
                return (
                  <button
                    key={c.value}
                    onClick={() => toggleChannel(c.value)}
                    className={`px-3 h-8 rounded-btn text-xs font-bold border transition ${
                      active ? 'bg-primary text-white border-primary' : 'bg-surface text-text-muted border-border hover:border-primary/50'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Действие */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
          <div>
            <label className="text-[11px] font-bold text-text-muted">Действие</label>
            <Select
              value={draft.action}
              onChange={(e) => setDraft({ ...draft, action: e.target.value as PricingRule['action'] })}
              options={(Object.keys(ACTION_LABEL) as PricingRule['action'][]).map((k) => ({
                value: k,
                label: ACTION_LABEL[k],
              }))}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-text-muted">
              Размер ({draft.action === 'set-fixed' ? '₽' : '%'})
            </label>
            <Input
              type="number"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <label className="inline-flex items-center gap-2 text-sm">
            <Switch checked={draft.enabled} onChange={() => setDraft({ ...draft, enabled: !draft.enabled })} />
            Сразу активировать
          </label>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave} disabled={!draft.name.trim()}>
              {initial ? 'Сохранить' : 'Создать правило'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
