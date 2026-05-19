// CRM Гостей: таблица + drawer-карточка
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Plus, MessageSquare, X, Mail, Phone, Award, AlertOctagon, FileText, UserSearch } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { guests as initial, bookings, properties } from '@/mock/data';
import type { Guest, LoyaltyTier } from '@/types';
import { fmtMoney, fmtDate, cn } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

const TIER_TONE: Record<LoyaltyTier, 'neutral' | 'primary' | 'gold' | 'success'> = {
  Bronze: 'neutral', Silver: 'primary', Gold: 'gold', Platinum: 'success',
};
const TIER_NEXT: Record<LoyaltyTier, number> = { Bronze: 500, Silver: 1500, Gold: 3500, Platinum: 5000 };

export default function GuestsPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'vip' | 'blacklist'>('all');
  const [selected, setSelected] = useState<Guest | null>(null);
  const [msgFor, setMsgFor] = useState<Guest | null>(null);

  const filtered = useMemo(() => {
    let arr = initial;
    if (tab === 'vip') arr = arr.filter((g) => g.tags.includes('VIP'));
    if (tab === 'blacklist') arr = arr.filter((g) => g.blacklisted);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((g) =>
        (g.firstName + ' ' + g.lastName + ' ' + g.email + ' ' + g.phone).toLowerCase().includes(q),
      );
    }
    return arr;
  }, [query, tab]);

  return (
    <PageTransition>
      <PageHeader
        title="Гости"
        subtitle={`${initial.length} гостей в базе CRM`}
        action={<Button size="md" leftIcon={<Plus className="h-4 w-4" />}>Добавить гостя</Button>}
      />

      <Card padding="md" className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Поиск по имени, телефону, email…"
            leftIcon={<Search className="h-4 w-4" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <div className="bg-surface-2 rounded-btn p-1 flex">
            {(['all', 'vip', 'blacklist'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-4 h-8 rounded-md text-xs font-bold transition-colors',
                  tab === t ? 'bg-bg text-text shadow-soft' : 'text-text-muted')}>
                {t === 'all' ? 'Все' : t === 'vip' ? 'VIP' : 'Чёрный список'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<UserSearch className="h-12 w-12 text-text-muted" />} title="Гости не найдены" description="Попробуйте изменить параметры поиска" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2">
                <tr>
                  {['Гость', 'Контакты', 'Страна', 'Заездов', 'Сумма', 'Лояльность', 'Теги'].map((h) =>
                    <th key={h} className="px-4 py-3 text-left text-xs uppercase font-bold text-text-muted">{h}</th>,
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className={cn(
                    'border-t border-border hover:bg-surface-2/60 cursor-pointer transition-colors',
                    g.blacklisted && 'opacity-60',
                  )} onClick={() => setSelected(g)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${g.firstName} ${g.lastName}`} size="sm" />
                        <div>
                          <p className="font-bold text-text">{g.firstName} {g.lastName}</p>
                          <p className="text-[11px] text-text-muted">с {fmtDate(g.registeredAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      <p>{g.email}</p>
                      <p className="text-[11px]">{g.phone}</p>
                    </td>
                    <td className="px-4 py-3">{g.country}</td>
                    <td className="px-4 py-3 font-bold">{g.staysCount}</td>
                    <td className="px-4 py-3 font-bold text-primary">{fmtMoney(g.totalSpent, { compact: true })}</td>
                    <td className="px-4 py-3"><Badge tone={TIER_TONE[g.loyaltyTier]}>{g.loyaltyTier}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {g.tags.slice(0, 2).map((t) => (
                          <Badge key={t} tone={t === 'VIP' ? 'gold' : t === 'ЧС' ? 'error' : 'neutral'}>{t}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Drawer карточки гостя */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} />
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-bg border-l border-border shadow-lift overflow-y-auto"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <GuestDetail guest={selected} onClose={() => setSelected(null)} onMessage={(g) => { setMsgFor(g); }} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <MessageModal guest={msgFor} onClose={() => setMsgFor(null)} />
    </PageTransition>
  );
}

function GuestDetail({ guest, onClose, onMessage }: { guest: Guest; onClose: () => void; onMessage: (g: Guest) => void }) {
  const history = bookings.filter((b) => b.guestId === guest.id).slice(0, 8);
  const progressNext = TIER_NEXT[guest.loyaltyTier];
  const progress = Math.min(100, (guest.loyaltyPoints / progressNext) * 100);
  return (
    <div>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="font-display text-xl text-text">Карточка гостя</h2>
        <button onClick={onClose} className="h-9 w-9 rounded-btn hover:bg-surface-2 flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Профиль */}
        <div className="flex items-center gap-4">
          <Avatar name={`${guest.firstName} ${guest.lastName}`} size="lg" />
          <div className="flex-1">
            <h3 className="font-display text-2xl text-text leading-none">{guest.firstName} {guest.lastName}</h3>
            <p className="text-xs text-text-muted mt-1">{guest.country} · с {fmtDate(guest.registeredAt)}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {guest.tags.map((t) => (
                <Badge key={t} tone={t === 'VIP' ? 'gold' : t === 'ЧС' ? 'error' : 'neutral'}>{t}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Контакты */}
        <div className="grid grid-cols-2 gap-3">
          <Card padding="sm">
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1"><Mail className="h-3 w-3" />Email</div>
            <p className="text-sm font-semibold text-text truncate">{guest.email}</p>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1"><Phone className="h-3 w-3" />Телефон</div>
            <p className="text-sm font-semibold text-text">{guest.phone}</p>
          </Card>
        </div>

        {/* Лояльность */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 font-bold">
              <Award className="h-4 w-4 text-gold" /> Лояльность
            </span>
            <Badge tone={TIER_TONE[guest.loyaltyTier]}>{guest.loyaltyTier}</Badge>
          </div>
          <p className="text-xs text-text-muted mb-2">{guest.loyaltyPoints} / {progressNext} баллов</p>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-gold rounded-full"
            />
          </div>
        </Card>

        {/* Метрики */}
        <div className="grid grid-cols-2 gap-3">
          <Card padding="sm">
            <p className="text-[10px] uppercase font-bold text-text-muted">Заездов</p>
            <p className="font-display text-2xl mt-1">{guest.staysCount}</p>
          </Card>
          <Card padding="sm">
            <p className="text-[10px] uppercase font-bold text-text-muted">Общая сумма</p>
            <p className="font-display text-2xl mt-1">{fmtMoney(guest.totalSpent, { compact: true })}</p>
          </Card>
        </div>

        {/* Заметки */}
        {guest.notes && (
          <div className="p-3 rounded-btn bg-warning/10 text-sm text-text">
            <p className="font-bold mb-1 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Заметки</p>
            <p className="text-text-muted">{guest.notes}</p>
          </div>
        )}

        {/* История */}
        <div>
          <p className="text-xs uppercase font-bold text-text-muted mb-2">История заездов</p>
          <div className="space-y-2">
            {history.length === 0 && <p className="text-sm text-text-muted">Нет записей</p>}
            {history.map((b) => {
              const p = properties.find((pp) => pp.id === b.propertyId);
              return (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-btn border border-border text-sm">
                  <div>
                    <p className="font-bold text-text">{p?.name}</p>
                    <p className="text-xs text-text-muted">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</p>
                  </div>
                  <span className="font-bold text-primary">{fmtMoney(b.amount, { compact: true })}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Действия */}
        <div className="flex gap-2">
          <Button className="flex-1" leftIcon={<MessageSquare className="h-4 w-4" />} onClick={() => onMessage(guest)}>
            Сообщение
          </Button>
          <Button variant={guest.blacklisted ? 'outline' : 'danger'} leftIcon={<AlertOctagon className="h-4 w-4" />}>
            {guest.blacklisted ? 'Убрать из ЧС' : 'В ЧС'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageModal({ guest, onClose }: { guest: Guest | null; onClose: () => void }) {
  const { push } = useToast();
  if (!guest) return null;
  return (
    <Modal open={!!guest} onClose={onClose} title="Отправка сообщения" subtitle={`Гость: ${guest.firstName} ${guest.lastName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={() => { onClose(); push({ tone: 'success', title: 'Сообщение отправлено' }); }}>Отправить</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Select label="Канал" options={[
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'telegram', label: 'Telegram' },
        ]} />
        <Input label="Тема" placeholder="Подтверждение бронирования" />
        <Textarea label="Сообщение" placeholder="Здравствуйте, ..." rows={6} />
      </div>
    </Modal>
  );
}
