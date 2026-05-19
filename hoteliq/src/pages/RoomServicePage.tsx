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
  CheckCircle2, X, MapPin, Phone, BadgeCheck, Pencil, Trash2, Plus, Smartphone, Navigation,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useRestaurants, MENU_CATEGORY_LABEL } from '@/store/restaurants';
import { useRoomService, ORDER_STATUS_LABEL } from '@/store/roomservice';
import { properties } from '@/mock/data';
import { fmtMoney, cn } from '@/utils/format';
import type { RoomOrderStatus, Restaurant, RestaurantMenuItem, RoomOrder } from '@/types';

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
  const restaurants = useRestaurants((s) => s.restaurants);
  const hotels = properties.filter((p) => p.type === 'hotel');
  const [activeHotel, setActiveHotel] = useState<string>(hotels[0]?.id ?? '');
  const [view, setView] = useState<'catalog' | 'orders' | 'map' | 'preview'>('catalog');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

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
        {(['catalog', 'orders', 'map'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'px-4 h-9 rounded-btn text-sm font-bold transition',
              view === v ? 'bg-surface text-text shadow-soft' : 'text-text-muted hover:text-text'
            )}
          >
            {v === 'catalog' ? 'Каталог кафе' : v === 'orders' ? `Активные заказы (${stats.active})` : 'Карта курьеров'}
          </button>
        ))}
      </div>

      {view === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {restaurants.map((r) => {
            const enabled = enabledIds.includes(r.id);
            return (
              <Card
                key={r.id}
                padding="md"
                className={cn('cursor-pointer hover:shadow-lg transition-shadow', enabled && 'ring-1 ring-primary/40')}
                onClick={() => setMenuOpenFor(r.id)}
              >
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
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch checked={enabled} onChange={() => toggleRestaurant(activeHotel, r.id)} />
                  </div>
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
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[11px] text-text-muted flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> {r.address}
                  </div>
                  <span className="text-[11px] text-primary font-bold">Открыть меню →</span>
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

      {view === 'map' && <CourierMap orders={orders} />}

      <GuestPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} hotelId={activeHotel} enabledIds={enabledIds} />
      <RestaurantMenuModal
        restaurantId={menuOpenFor}
        onClose={() => setMenuOpenFor(null)}
      />
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
  const restaurants = useRestaurants((s) => s.restaurants);
  const cafes = restaurants.filter((r) => enabledIds.includes(r.id));

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

// ============================================================
// Модалка меню кафе — добавление / редактирование / удаление блюд
// ============================================================
const CATEGORY_ORDER: RestaurantMenuItem['category'][] = ['pie', 'starter', 'soup', 'main', 'dessert', 'drink'];

function RestaurantMenuModal({ restaurantId, onClose }: { restaurantId: string | null; onClose: () => void }) {
  const restaurants = useRestaurants((s) => s.restaurants);
  const addMenuItem = useRestaurants((s) => s.addMenuItem);
  const updateMenuItem = useRestaurants((s) => s.updateMenuItem);
  const removeMenuItem = useRestaurants((s) => s.removeMenuItem);
  const restaurant = restaurants.find((r) => r.id === restaurantId) ?? null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RestaurantMenuItem>({
    id: '', name: '', description: '', price: 0, category: 'main', emoji: '🍽️',
  });

  const startAdd = () => {
    setEditingId('__new__');
    setDraft({ id: `m-${Date.now()}`, name: '', description: '', price: 0, category: 'main', emoji: '🍽️' });
  };
  const startEdit = (m: RestaurantMenuItem) => {
    setEditingId(m.id);
    setDraft({ ...m });
  };
  const cancel = () => { setEditingId(null); };
  const save = () => {
    if (!restaurant || !draft.name.trim() || draft.price <= 0) return;
    if (editingId === '__new__') addMenuItem(restaurant.id, draft);
    else if (editingId) updateMenuItem(restaurant.id, editingId, draft);
    setEditingId(null);
  };
  const handleClose = () => { setEditingId(null); onClose(); };

  if (!restaurant) return null;

  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, items: restaurant.menu.filter((m) => m.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <Modal
      open={!!restaurantId}
      onClose={handleClose}
      title={`${restaurant.cover} ${restaurant.name} — меню`}
      subtitle={`${restaurant.menu.length} блюд · мин. заказ ${fmtMoney(restaurant.minOrder)} · доставка ${fmtMoney(restaurant.deliveryFee)}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Шапка с кнопкой добавления */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
          <p className="text-xs text-text-muted">
            Изменения сохраняются локально и применяются и в админке, и в превью гостя.
          </p>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={startAdd} disabled={!!editingId}>
            Добавить блюдо
          </Button>
        </div>

        {/* Форма редактирования / добавления */}
        {editingId && (
          <div className="rounded-card border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-text-muted">Название</label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Например: Осетинский пирог с сыром" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted">Эмодзи</label>
                <Input value={draft.emoji ?? ''} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} maxLength={4} />
              </div>
              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-text-muted">Описание</label>
                <Textarea
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={2}
                  placeholder="Состав, особенности, граммовка…"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted">Категория</label>
                <Select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value as RestaurantMenuItem['category'] })}
                  options={CATEGORY_ORDER.map((c) => ({ value: c, label: MENU_CATEGORY_LABEL[c] }))}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted">Цена, ₽</label>
                <Input
                  type="number"
                  min={0}
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={cancel}>Отмена</Button>
              <Button size="sm" onClick={save} disabled={!draft.name.trim() || draft.price <= 0}>
                {editingId === '__new__' ? 'Добавить' : 'Сохранить'}
              </Button>
            </div>
          </div>
        )}

        {/* Список по категориям */}
        {grouped.length === 0 && (
          <div className="text-center py-10 text-sm text-text-muted">
            Меню пусто. Нажмите «Добавить блюдо», чтобы заполнить.
          </div>
        )}
        {grouped.map((g) => (
          <div key={g.cat}>
            <h4 className="text-[11px] uppercase font-bold text-text-muted mb-2 pb-1 border-b border-border">
              {MENU_CATEGORY_LABEL[g.cat]} · {g.items.length}
            </h4>
            <div className="space-y-1.5">
              {g.items.map((m) => (
                <div key={m.id} className="group flex items-start gap-3 px-2.5 py-2 rounded-btn hover:bg-surface-2/50 transition">
                  <div className="text-xl shrink-0">{m.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="font-bold text-sm text-text truncate">{m.name}</p>
                      <span className="text-xs font-bold text-primary shrink-0 ml-auto">{fmtMoney(m.price)}</span>
                    </div>
                    {m.description && <p className="text-[11px] text-text-muted leading-snug mt-0.5">{m.description}</p>}
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => startEdit(m)}
                      className="h-7 w-7 rounded-btn hover:bg-surface flex items-center justify-center"
                      title="Редактировать"
                      disabled={!!editingId}
                    >
                      <Pencil className="h-3.5 w-3.5 text-text-muted" />
                    </button>
                    <button
                      onClick={() => removeMenuItem(restaurant.id, m.id)}
                      className="h-7 w-7 rounded-btn hover:bg-error/10 flex items-center justify-center"
                      title="Удалить"
                      disabled={!!editingId}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ============================================================
// Карта курьеров Владикавказа (SVG-мок: Терек, парки, улицы, отели, маршруты)
// ============================================================
type CourierStatus = 'delivering' | 'pickup' | 'idle';
interface MockCourier {
  id: string;
  name: string;
  phone: string;
  status: CourierStatus;
  x: number;
  y: number;
  orderIds: string[];
}
const MOCK_COURIERS: MockCourier[] = [
  { id: 'c1', name: 'Тимур Кочиев', phone: '+7 928 100-11-22', status: 'delivering', x: 220, y: 180, orderIds: [] },
  { id: 'c2', name: 'Зураб Дзодзиев', phone: '+7 928 200-33-44', status: 'pickup', x: 380, y: 250, orderIds: [] },
  { id: 'c3', name: 'Алан Бекоев', phone: '+7 928 300-55-66', status: 'idle', x: 470, y: 140, orderIds: [] },
];
const HOTEL_POINTS: Record<string, { x: number; y: number; name: string }> = {
  prop_1: { x: 180, y: 130, name: 'Александровский' },
  prop_2: { x: 320, y: 200, name: 'Иристон' },
  prop_3: { x: 460, y: 280, name: 'Гранд-отель' },
};
const STATUS_BADGE_TONE: Record<CourierStatus, 'success' | 'info' | 'neutral'> = {
  delivering: 'success', pickup: 'info', idle: 'neutral',
};
const STATUS_LABEL_RU: Record<CourierStatus, string> = {
  delivering: 'Доставляет', pickup: 'Забирает заказ', idle: 'Свободен',
};

function CourierMap({ orders }: { orders: RoomOrder[] }) {
  // Распределяем активные заказы между «занятыми» курьерами
  const active = orders.filter((o) => ['accepted', 'cooking', 'delivering'].includes(o.status));
  const couriers = MOCK_COURIERS.map((c, idx) => ({
    ...c,
    orderIds: c.status === 'idle' ? [] : active.filter((_, i) => i % 2 === idx % 2).slice(0, 2).map((o) => o.id),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <Card padding="md" className="overflow-hidden">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Владикавказ — карта курьеров</h3>
          <Badge tone="neutral">Мок-данные</Badge>
        </div>
        <div className="w-full aspect-[3/2] rounded-btn bg-surface-2 overflow-hidden">
          <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
            <defs>
              <linearGradient id="terekGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            {/* Река Терек */}
            <path d="M0 100 Q150 140 300 180 T600 260" stroke="url(#terekGrad)" strokeWidth="14" fill="none" opacity="0.7" />
            {/* Парки */}
            <circle cx="120" cy="240" r="38" fill="#86efac" opacity="0.5" />
            <circle cx="380" cy="90" r="30" fill="#86efac" opacity="0.5" />
            <circle cx="500" cy="340" r="34" fill="#86efac" opacity="0.5" />
            {/* Улицы */}
            <line x1="0" y1="150" x2="600" y2="170" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="0" y1="220" x2="600" y2="240" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="0" y1="290" x2="600" y2="310" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="150" y1="0" x2="170" y2="400" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="320" y1="0" x2="340" y2="400" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="470" y1="0" x2="490" y2="400" stroke="#cbd5e1" strokeWidth="2" />
            {/* Отели */}
            {Object.entries(HOTEL_POINTS).map(([id, p]) => (
              <g key={id}>
                <rect x={p.x - 8} y={p.y - 8} width="16" height="16" fill="#f59e0b" rx="3" />
                <text x={p.x + 12} y={p.y + 4} fontSize="10" fill="#1f2937">{p.name}</text>
              </g>
            ))}
            {/* Маршруты курьер → отель (по orderId.propertyId) */}
            {couriers.map((c) => {
              if (c.status === 'idle') return null;
              const targets = c.orderIds
                .map((oid: string) => orders.find((o) => o.id === oid))
                .filter((o): o is RoomOrder => !!o);
              const stroke = c.status === 'delivering' ? '#10b981' : '#a855f7';
              return targets.map((o, i) => {
                const hp = HOTEL_POINTS[o.propertyId] ?? HOTEL_POINTS.prop_1;
                return (
                  <line
                    key={c.id + '_' + i}
                    x1={c.x} y1={c.y} x2={hp.x} y2={hp.y}
                    stroke={stroke} strokeWidth="2" strokeDasharray="6 4" opacity="0.7"
                  />
                );
              });
            })}
            {/* Курьеры (анимированные) */}
            {couriers.map((c) => {
              const color = c.status === 'delivering' ? '#10b981' : c.status === 'pickup' ? '#a855f7' : '#94a3b8';
              return (
                <g key={c.id}>
                  <circle cx={c.x} cy={c.y} r="14" fill={color} opacity="0.3">
                    <animate attributeName="r" values="14;17;14" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={c.x} cy={c.y} r="8" fill={color} />
                  <text x={c.x} y={c.y + 26} fontSize="10" textAnchor="middle" fill="#1f2937" fontWeight="bold">{c.name.split(' ')[0]}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      <div className="space-y-3">
        {couriers.map((c) => (
          <Card key={c.id} padding="md">
            <div className="flex items-start gap-3">
              <span className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">
                {c.name.split(' ').map((p) => p[0]).join('')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{c.name}</div>
                <div className="text-xs text-text-muted flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</div>
                <Badge tone={STATUS_BADGE_TONE[c.status]} className="mt-1">{STATUS_LABEL_RU[c.status]}</Badge>
                {c.orderIds.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {c.orderIds.map((oid) => {
                      const o = orders.find((x) => x.id === oid);
                      if (!o) return null;
                      return (
                        <div key={oid} className="text-[11px] flex items-center gap-1 text-text-muted">
                          <Navigation className="h-3 w-3" />
                          №{o.roomNumber} · {o.guestName}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        <Card padding="md" className="bg-surface-2">
          <h4 className="text-xs font-bold mb-2">Легенда</h4>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Доставляет</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-purple-500" /> Забирает заказ</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-400" /> Свободен</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-amber-500" /> Отель</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-300" /> Парк</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
