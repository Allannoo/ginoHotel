// Управление объектами: карточки/таблица, мастер из 4 шагов
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, MapPin, Star, Plus, Wifi, Coffee, Sparkles, Car, ChevronRight } from 'lucide-react';
import { PageTransition, StaggerList, staggerItem } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { properties as initialProps, rooms } from '@/mock/data';
import { fmtMoney, fmtPct, cn } from '@/utils/format';
import type { Property } from '@/types';
import { useToast } from '@/components/ui/Toast';

export default function PropertiesPage() {
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [list, setList] = useState(initialProps);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selected, setSelected] = useState<Property | null>(null);

  return (
    <PageTransition>
      <PageHeader
        title="Объекты"
        subtitle={`${list.length} объектов · ${rooms.length} номеров в управлении`}
        action={
          <>
            <div className="bg-surface-2 rounded-btn p-1 flex">
              {(['cards', 'table'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn('px-3 h-8 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors',
                    view === v ? 'bg-bg text-text shadow-soft' : 'text-text-muted')}
                >
                  {v === 'cards' ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                  {v === 'cards' ? 'Карточки' : 'Таблица'}
                </button>
              ))}
            </div>
            <Button size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setWizardOpen(true)}>
              Добавить объект
            </Button>
          </>
        }
      />

      {view === 'cards' ? (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((p) => (
            <motion.div key={p.id} variants={staggerItem}>
              <Card hoverable padding="none" onClick={() => setSelected(p)}>
                <div className="h-40 bg-gradient-to-br from-primary/80 to-gold/80 flex items-center justify-center text-6xl">
                  {p.cover}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <Badge tone={p.type === 'hotel' ? 'primary' : 'gold'}>
                      {p.type === 'hotel' ? 'Отель' : 'Апартаменты'}
                    </Badge>
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                      <span className="font-bold">{p.rating.toFixed(1)}</span>
                    </span>
                  </div>
                  <h3 className="font-display text-lg text-text leading-tight">{p.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-text-muted mt-1">
                    <MapPin className="h-3 w-3" /> {p.city}, {p.address}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                    <Stat label="Номера" value={`${p.rooms}`} />
                    <Stat label="OCC" value={fmtPct(p.occupancy)} />
                    <Stat label="Выручка" value={fmtMoney(p.revenueMonth, { compact: true })} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </StaggerList>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                {['Объект', 'Город', 'Тип', 'Номеров', 'OCC', 'Выручка/мес', 'Рейтинг', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-surface-2/50 cursor-pointer" onClick={() => setSelected(p)}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">{p.cover}</span>
                    <span className="font-bold text-text">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">{p.city}</td>
                  <td className="px-4 py-3"><Badge tone={p.type === 'hotel' ? 'primary' : 'gold'}>{p.type === 'hotel' ? 'Отель' : 'Апт'}</Badge></td>
                  <td className="px-4 py-3 text-sm">{p.rooms}</td>
                  <td className="px-4 py-3"><Badge tone={p.occupancy > 80 ? 'success' : 'warning'}>{p.occupancy}%</Badge></td>
                  <td className="px-4 py-3 text-sm font-bold">{fmtMoney(p.revenueMonth, { compact: true })}</td>
                  <td className="px-4 py-3 text-sm"><span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-gold fill-gold" />{p.rating.toFixed(1)}</span></td>
                  <td className="px-4 py-3"><ChevronRight className="h-4 w-4 text-text-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <PropertyWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreate={(p) => { setList([p, ...list]); setWizardOpen(false); }}
      />

      <PropertyDetailModal property={selected} onClose={() => setSelected(null)} />
    </PageTransition>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-text-muted font-bold">{label}</p>
      <p className="text-sm font-bold text-text mt-0.5">{value}</p>
    </div>
  );
}

// ============ Мастер добавления (4 шага) ============
function PropertyWizard({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (p: Property) => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', type: 'hotel' as 'hotel' | 'apartment', city: '', address: '', description: '',
    categories: 'Standard,Deluxe', basePrice: 5000, checkIn: '14:00', checkOut: '12:00',
    photos: [] as string[],
  });
  const { push } = useToast();

  const STEPS = ['Основная информация', 'Категории номеров', 'Фотографии', 'Тарифы и правила'];

  const handleCreate = () => {
    onCreate({
      id: `prop_new_${Date.now()}`,
      name: form.name || 'Новый объект',
      type: form.type,
      city: form.city || 'Москва',
      address: form.address || '—',
      description: form.description,
      rating: 5,
      cover: '🏨',
      rooms: 1,
      occupancy: 0,
      revenueMonth: 0,
      amenities: ['Wi-Fi'],
    });
    push({ tone: 'success', title: 'Объект добавлен', description: form.name });
    setStep(0);
    setForm({ name: '', type: 'hotel', city: '', address: '', description: '', categories: 'Standard,Deluxe', basePrice: 5000, checkIn: '14:00', checkOut: '12:00', photos: [] });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Добавление объекта"
      subtitle={`Шаг ${step + 1} из 4 — ${STEPS[step]}`}
      size="lg"
      footer={
        <>
          {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Назад</Button>}
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Далее</Button>
          ) : (
            <Button onClick={handleCreate}>Создать</Button>
          )}
        </>
      }
    >
      {/* Прогресс */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((_, i) => (
          <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-border')} />
        ))}
      </div>

      {step === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Название" placeholder="Гранд-Отель «Метрополь»" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Тип" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'hotel' | 'apartment' })}
            options={[{ value: 'hotel', label: 'Отель' }, { value: 'apartment', label: 'Апартаменты / Квартира' }]} />
          <Input label="Город" placeholder="Москва" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Адрес" placeholder="Театральный пр., 2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="col-span-2">
            <Textarea label="Описание" placeholder="Краткое описание объекта…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Добавьте категории номеров. Их можно отредактировать позже.</p>
          <div className="space-y-2">
            {['Standard', 'Deluxe', 'Suite', 'Family', 'Studio'].map((c) => {
              const checked = form.categories.split(',').includes(c);
              return (
                <label key={c} className="flex items-center gap-3 p-3 rounded-btn border border-border hover:bg-surface-2 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={(e) => {
                    const set = new Set(form.categories.split(',').filter(Boolean));
                    e.target.checked ? set.add(c) : set.delete(c);
                    setForm({ ...form, categories: [...set].join(',') });
                  }} />
                  <span className="text-sm font-bold text-text">{c}</span>
                  <span className="text-xs text-text-muted ml-auto">Базовая цена от 4 000 ₽</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="border-2 border-dashed border-border rounded-card p-10 text-center hover:border-primary cursor-pointer transition-colors">
            <div className="text-5xl mb-3">📸</div>
            <p className="font-bold text-text">Перетащите фотографии</p>
            <p className="text-xs text-text-muted mt-1">или нажмите для выбора файлов (JPG, PNG, до 10 МБ)</p>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {['🏨', '🛏️', '🛁', '🌆'].map((e, i) => (
              <div key={i} className="aspect-square rounded-btn bg-surface-2 flex items-center justify-center text-4xl">{e}</div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Базовая цена за ночь" type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: +e.target.value })} />
          <Input label="Время заезда" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
          <Input label="Время выезда" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
          <Select label="Политика отмены" options={[
            { value: 'flexible', label: 'Гибкая' },
            { value: 'moderate', label: 'Умеренная' },
            { value: 'strict', label: 'Строгая' },
          ]} />
        </div>
      )}
    </Modal>
  );
}

// ============ Карточка объекта (детальный модал) ============
function PropertyDetailModal({ property, onClose }: { property: Property | null; onClose: () => void }) {
  const [tab, setTab] = useState<'info' | 'rooms' | 'photos' | 'rates'>('info');
  if (!property) return null;
  const propRooms = rooms.filter((r) => r.propertyId === property.id);
  const amenityIcons: Record<string, React.ReactNode> = {
    'Wi-Fi': <Wifi className="h-4 w-4" />,
    'Завтрак': <Coffee className="h-4 w-4" />,
    'Спа': <Sparkles className="h-4 w-4" />,
    'Паркинг': <Car className="h-4 w-4" />,
  };

  return (
    <Modal open={!!property} onClose={onClose} size="xl" title={property.name} subtitle={`${property.city} · ${property.address}`}>
      {/* Табы */}
      <div className="flex gap-1 border-b border-border mb-4 -mx-6 px-6">
        {(['info', 'rooms', 'photos', 'rates'] as const).map((t) => {
          const labels = { info: 'Информация', rooms: 'Номера', photos: 'Фото', rates: 'Тарифы' };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
                tab === t ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text')}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {tab === 'info' && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted leading-relaxed">{property.description}</p>
          <div className="grid grid-cols-4 gap-3">
            <Card padding="sm"><Stat label="Номеров" value={`${property.rooms}`} /></Card>
            <Card padding="sm"><Stat label="OCC" value={fmtPct(property.occupancy)} /></Card>
            <Card padding="sm"><Stat label="Выручка/мес" value={fmtMoney(property.revenueMonth, { compact: true })} /></Card>
            <Card padding="sm"><Stat label="Рейтинг" value={`${property.rating.toFixed(1)} ⭐`} /></Card>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-text-muted mb-2">Удобства</p>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a) => (
                <Badge key={a} tone="neutral">
                  <span className="flex items-center gap-1.5">{amenityIcons[a] || '✓'} {a}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'rooms' && (
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr>{['№', 'Категория', 'Этаж', 'Мест', 'Цена', 'Статус'].map((h) =>
              <th key={h} className="px-3 py-2 text-left text-xs uppercase font-bold text-text-muted">{h}</th>
            )}</tr>
          </thead>
          <tbody>
            {propRooms.length === 0 && <tr><td colSpan={6} className="text-center text-text-muted py-6">Нет номеров</td></tr>}
            {propRooms.map((r) => {
              const statusTone = { clean: 'success', dirty: 'warning', occupied: 'primary', inspection: 'info', maintenance: 'error' } as const;
              const statusLabel = { clean: 'Чисто', dirty: 'Грязно', occupied: 'Занят', inspection: 'Проверка', maintenance: 'Ремонт' };
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-bold">{r.number}</td>
                  <td className="px-3 py-2">{r.category}</td>
                  <td className="px-3 py-2">{r.floor}</td>
                  <td className="px-3 py-2">{r.capacity}</td>
                  <td className="px-3 py-2 font-bold">{fmtMoney(r.basePrice)}</td>
                  <td className="px-3 py-2"><Badge tone={statusTone[r.status]} dot>{statusLabel[r.status]}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {tab === 'photos' && (
        <div className="grid grid-cols-3 gap-3">
          {['🏨', '🛏️', '🛁', '🪟', '🍽️', '🌆', '🛋️', '🌿', '✨'].map((e, i) => (
            <div key={i} className="aspect-video rounded-btn bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center text-4xl">{e}</div>
          ))}
        </div>
      )}

      {tab === 'rates' && (
        <div className="space-y-3">
          {['Базовый', 'Невозвратный (-15%)', 'Заранее за 30 дней (-20%)', 'Завтрак включён (+800₽)'].map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-btn border border-border">
              <div>
                <p className="font-bold text-text">{r}</p>
                <p className="text-xs text-text-muted">Применяется ко всем категориям</p>
              </div>
              <Badge tone="success" dot>Активен</Badge>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
