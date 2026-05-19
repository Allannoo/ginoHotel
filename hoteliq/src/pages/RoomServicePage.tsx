// Страница: Доставка в номер (Room Service)
// Каталог осетинских и кавказских кафе Владикавказа + канбан заказов + превью гостя.
//
// Как гость это видит:
// 1. В каждом номере распечатан QR-код. Сканирует — открывается мобильная
//    веб-страница со списком партнёрских кафе ИМЕННО этого отеля.
// 2. Гость выбирает блюда, оплачивает через СБП/ЮKassa или ставит на счёт номера.
// 3. Заказ улетает в кафе через нашу интеграцию, доставка 30–60 мин.
// 4. Отель получает 10% комиссии с каждого заказа.
import { useState, useMemo } from 'react';
import {
  UtensilsCrossed, QrCode, Star, Clock, Truck, ChefHat,
  CheckCircle2, X, Smartphone, MapPin, Phone, BadgeCheck,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { RESTAURANTS } from '@/mock/restaurants';
import { useRoomService, ORDER_STATUS_LABEL } from '@/store/roomservice';
import { properties } from '@/mock/data';
import { fmtMoney, cn } from '@/utils/format';
import type { RoomOrderStatus } from '@/types';

const STATUS_TONE: Record<RoomOrderStatus, 'neutral' | 'info' | 'warning' | 'primary' | 'success' | 'error'> = {
  new: 'info', accepted: 'primary', cooking: 'warning', delivering: 'primary',
  delivered: 'success', completed: 'success', cancelled: 'error',
};
const STATUS_ICON: Record<RoomOrderStatus, JSX.Element> = {
  new: <Clock className="h-3.5 w-3.5" />,
  accepted: <CheckCircle2 className="h-3.5 w-3.5" />,
  cooking: <ChefHat className="h-3.5 w-3.5" />,
  delivering: <Truck className="h-3.5 w-3.5" />,
  delivered: <CheckCircle2 className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  cancelled: <X className="h-3.5 w-3.5" />,
};
const NEXT_STATUS: Partial<Record<RoomOrderStatus, RoomOrderStatus>> = {
  new: 'accepted', accepted: 'cooking', cooking: 'delivering', delivering: 'delivered', delivered: 'completed',
};

export default function RoomServicePage() {
  const { orders, enabledByProperty, toggleRestaurant, setStatus } = useRoomService();
  const hotels = properties.filter((p) => p.type === 'hotel');
  const [activeHotel, setActiveHotel] = useState<string>(hotels[0]?.id ?? '');
  const [view, setView] = useState<'catalog' | 'orders' | 'preview'>('catalog');
  const [previewOpen, setPreviewOpen] = useState(false);

  const enabledIds = enabledByProperty[activeHotel] ?? [];

  const stats = useMemo(() => {
    const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.status)).length;
    const today = orders.filter((o) => o.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
    const revenue = today.reduce((s, o) => s + o.subtotal, 0);
    const commission = today.reduce((s, o) => s + o.hotelCommission, 0);
    return { active, todayCount: today.length, revenue, commission };
  }, [orders]);

  return (
    <PageTransition>
      <PageHeader
        title="Доставка в номер"
        subtitle="Партнёрские кафе и рестораны Северной Осетии. QR-меню → заказ → доставка → комиссия отелю."
        action={
          <>
            <Select
              value={activeHotel}
              onChange={(e) => setActiveHotel(e.target.value)}
              options={hotels.map((p) => ({ value: p.id, label: p.name }))}
              className="!h-10 w-64"
            />
            <Button leftIcon={<QrCode className="h-4 w-4" />} onClick={() => setPreviewOpen(true)}>
              Превью для гостя
            </Button>
          </>
        }
      />

      {/* Объяснение для пользователя */}
      <Card padding="md" className="mb-5 bg-gradient-to-br from-primary/5 to-gold/5 border-primary/20">
        <div className="flex items-start gap-3">
          <span className="h-10 w-10 rounded-btn bg-primary text-white flex items-center justify-center shrink-0">
            <QrCode className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-text">Как гость видит ваши кафе</p>
            <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
              В каждом номере мы печатаем QR-код. Гость сканирует — открывается мобильное меню
              <span className="font-mono bg-surface-2 px-1.5 py-0.5 rounded text-[11px] mx-1">gino.menu/{activeHotel}</span>
              со списком только тех кафе, которые вы отметили ниже. Заказ оплачивается через СБП/ЮKassa
              либо ставится на счёт номера. Отель получает <span className="font-bold text-success">10%</span> с каждого заказа.
            </p>
          </div>
        </div>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Активных заказов" value={stats.active} accent="primary" />
        <KpiCard label="Сегодня заказов" value={stats.todayCount} accent="info" />
        <KpiCard label="Выручка сегодня" value={fmtMoney(stats.revenue, { compact: true })} accent="success" />
        <KpiCard label="Комиссия отелю" value={fmtMoney(stats.commission, { compact: true })} accent="gold" />
      </div>

      {/* Вкладки */}
      <div className="bg-surface-2 rounded-btn p-1 inline-flex gap-1 mb-4">
        {(['catalog', 'orders'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'px-4 h-9 rounded-btn text-sm font-bold transition',
              view === v ? 'bg-surface text-text shadow-soft' : 'text-text-muted hover:text-text'
            )}
          >
            {v === 'catalog' ? 'Каталог кафе' : `Активные заказы (${stats.active})`}
          </button>
        ))}
      </div>

      {view === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {RESTAURANTS.map((r) => {
            const enabled = enabledIds.includes(r.id);
            return (
              <Card key={r.id} padding="md" className={cn(enabled && 'ring-1 ring-primary/40')}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-14 w-14 rounded-card bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center text-3xl shrink-0">
                    {r.cover}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display text-base text-text">{r.name}</h3>
                      {r.verified && <BadgeCheck className="h-4 w-4 text-info" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                      <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-gold" /> {r.rating}</span>
                      <span>·</span>
                      <span>{r.reviewsCount} отз.</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {r.cuisine.map((c) => <Badge key={c} tone="neutral" className="!text-[10px]">{c}</Badge>)}
                    </div>
                  </div>
                  <Switch checked={enabled} onChange={() => toggleRestaurant(activeHotel, r.id)} />
                </div>
                <p className="text-[12px] text-text-muted mb-3 line-clamp-2">{r.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] py-2 border-y border-border">
                  <div>
                    <Clock className="h-3.5 w-3.5 mx-auto text-text-muted" />
                    <p className="font-bold text-text mt-1">{r.deliveryMinutes} мин</p>
                  </div>
                  <div>
                    <Truck className="h-3.5 w-3.5 mx-auto text-text-muted" />
                    <p className="font-bold text-text mt-1">{fmtMoney(r.deliveryFee)}</p>
                  </div>
                  <div>
                    <UtensilsCrossed className="h-3.5 w-3.5 mx-auto text-text-muted" />
                    <p className="font-bold text-text mt-1">{r.menu.length} блюд</p>
                  </div>
                </div>
                <div className="text-[11px] text-text-muted mt-2 flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> {r.address}
                  <span>·</span>
                  <Phone className="h-3 w-3" /> {r.phone}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {view === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['new', 'cooking', 'delivering', 'delivered'] as RoomOrderStatus[]).map((col) => (
            <Card key={col} padding="md">
              <CardHeader
                title={ORDER_STATUS_LABEL[col]}
                subtitle={`${orders.filter((o) => o.status === col).length} заказ.`}
              />
              <div className="space-y-2">
                {orders.filter((o) => o.status === col).map((o) => (
                  <div key={o.id} className="rounded-card border border-border bg-surface-2/40 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-text">№ {o.roomNumber}</p>
                      <Badge tone={STATUS_TONE[o.status]}>
                        <span className="inline-flex items-center gap-1">{STATUS_ICON[o.status]} {ORDER_STATUS_LABEL[o.status]}</span>
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-muted">{o.guestName}</p>
                    <p className="text-[11px] text-text-muted">{o.restaurantName}</p>
                    <div className="text-[11px] text-text mt-1.5">
                      {o.items.slice(0, 2).map((i) => <div key={i.menuItemId}>{i.qty}× {i.name}</div>)}
                      {o.items.length > 2 && <div className="text-text-muted">…ещё {o.items.length - 2}</div>}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <span className="text-sm font-bold text-text">{fmtMoney(o.total)}</span>
                      {NEXT_STATUS[o.status] && (
                        <Button size="sm" variant="outline" onClick={() => setStatus(o.id, NEXT_STATUS[o.status]!)}>
                          → {ORDER_STATUS_LABEL[NEXT_STATUS[o.status]!]}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {orders.filter((o) => o.status === col).length === 0 && (
                  <div className="text-center text-xs text-text-muted py-4">Пусто</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <GuestPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} hotelId={activeHotel} enabledIds={enabledIds} />
    </PageTransition>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent: 'primary' | 'info' | 'success' | 'gold' }) {
  const accents: Record<typeof accent, string> = { primary: 'text-primary', info: 'text-info', success: 'text-success', gold: 'text-gold' };
  return (
    <Card padding="md">
      <p className="text-xs uppercase font-bold text-text-muted">{label}</p>
      <p className={cn('font-display text-2xl mt-1', accents[accent])}>{value}</p>
    </Card>
  );
}

// ===== Превью гостевого меню — телефон-мокап =====
function GuestPreviewModal({ open, onClose, hotelId, enabledIds }: { open: boolean; onClose: () => void; hotelId: string; enabledIds: string[] }) {
  const hotel = properties.find((p) => p.id === hotelId);
  const cafes = RESTAURANTS.filter((r) => enabledIds.includes(r.id));

  return (
    <Modal open={open} onClose={onClose} title="Так это видит гость" subtitle="Мобильное меню по QR-коду в номере" size="md">
      <div className="flex flex-col items-center">
        <div className="relative mx-auto" style={{ width: 320 }}>
          {/* phone frame */}
          <div className="bg-[#0d1119] rounded-[40px] p-3 shadow-2xl">
            <div className="rounded-[28px] overflow-hidden bg-bg" style={{ height: 600 }}>
              {/* phone notch */}
              <div className="h-6 bg-[#0d1119] relative">
                <div className="absolute left-1/2 -translate-x-1/2 top-1 w-20 h-3 rounded-full bg-black" />
              </div>
              {/* status bar */}
              <div className="flex items-center justify-between px-4 py-1 text-[10px] text-text-muted">
                <span>9:41</span>
                <span className="font-mono">gino.menu/{hotelId}</span>
                <span>📶</span>
              </div>
              {/* content */}
              <div className="px-3 py-3 overflow-y-auto" style={{ height: 540 }}>
                <div className="text-center mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">{hotel?.name}</p>
                  <h3 className="font-display text-lg text-text">Заказать в номер</h3>
                  <p className="text-[11px] text-text-muted">Доставка 30–60 минут</p>
                </div>
                <div className="space-y-2">
                  {cafes.length === 0 && (
                    <div className="text-center text-xs text-text-muted py-8">
                      Включите кафе в каталоге, чтобы они появились здесь.
                    </div>
                  )}
                  {cafes.map((r) => (
                    <div key={r.id} className="rounded-card border border-border bg-surface p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{r.cover}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-sm text-text truncate">{r.name}</p>
                            {r.verified && <BadgeCheck className="h-3 w-3 text-info shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                            <Star className="h-2.5 w-2.5 text-gold" /> {r.rating}
                            <span>·</span>
                            <Clock className="h-2.5 w-2.5" /> {r.deliveryMinutes} мин
                            <span>·</span>
                            <span>{fmtMoney(r.deliveryFee)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.cuisine.slice(0, 2).map((c) => <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-2 text-text-muted">{c}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2.5 rounded-card bg-gold/10 border border-gold/20 text-center">
                  <p className="text-[10px] text-gold font-bold">⭐ Местная кухня — пироги осетинские</p>
                </div>
              </div>
              <div className="h-1 bg-[#0d1119] flex items-center justify-center">
                <div className="w-24 h-1 rounded-full bg-text/30" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 max-w-md text-center">
          <p className="inline-flex items-center gap-1.5 text-xs text-text-muted">
            <Smartphone className="h-3.5 w-3.5" />
            QR-код для печати в номерах:
            <code className="font-mono bg-surface-2 px-2 py-0.5 rounded">gino.menu/{hotelId}</code>
          </p>
        </div>
      </div>
    </Modal>
  );
}
