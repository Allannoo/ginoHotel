// Настройки — расширенная панель: профиль, безопасность, уведомления, баланс, контакты,
// сотрудники (тот же TeamManager что и в /team), каналы и источники, шаблоны писем,
// автосообщения, вебхуки.
import { useMemo, useState } from 'react';
import {
  User, Shield, Bell, Wallet, Phone, Users as UsersIcon, PlugZap, MailOpen, MessagesSquare, Webhook, Bot, Copy, Plus, Trash2, Check,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/format';
import { useCurrentUser, useAuth } from '@/store/auth';
import { useSettings, CHANNELS_CATALOG, EMAIL_TAGS, AUTO_MESSAGE_TEMPLATES } from '@/store/settings';
import { TeamManager } from '@/components/TeamManager';

const TABS = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'security', label: 'Безопасность', icon: Shield },
  { id: 'notif', label: 'Уведомления', icon: Bell },
  { id: 'balance', label: 'Баланс', icon: Wallet },
  { id: 'contacts', label: 'Контакты', icon: Phone },
  { id: 'team', label: 'Сотрудники', icon: UsersIcon },
  { id: 'sources', label: 'Каналы и источники', icon: PlugZap },
  { id: 'emails', label: 'Шаблоны писем', icon: MailOpen },
  { id: 'auto', label: 'Автосообщения', icon: MessagesSquare },
  { id: 'webhooks', label: 'Webhooks и API', icon: Webhook },
] as const;

type TabId = typeof TABS[number]['id'];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('profile');
  return (
    <PageTransition>
      <PageHeader title="Настройки" subtitle="Аккаунт, интеграции, уведомления и шаблоны" />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <Card padding="sm" className="lg:sticky lg:top-4 lg:self-start">
          <nav className="space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 h-10 rounded-btn text-sm font-bold transition-colors text-left',
                    tab === t.id ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-2 hover:text-text',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        <div>
          {tab === 'profile' && <ProfileTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'notif' && <NotifTab />}
          {tab === 'balance' && <BalanceTab />}
          {tab === 'contacts' && <ContactsTab />}
          {tab === 'team' && <TeamManager />}
          {tab === 'sources' && <SourcesTab />}
          {tab === 'emails' && <EmailTemplatesTab />}
          {tab === 'auto' && <AutoMessagesTab />}
          {tab === 'webhooks' && <WebhooksTab />}
        </div>
      </div>
    </PageTransition>
  );
}

// ===================== Профиль =====================
function ProfileTab() {
  const { push } = useToast();
  const user = useCurrentUser();
  const updateMember = useAuth((s) => s.updateMember);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [first, ...rest] = name.split(' ');
  const last = rest.join(' ');

  const save = () => {
    if (!user) return;
    updateMember(user.id, { name: name.trim(), email: email.trim(), phone: phone.trim() });
    push({ tone: 'success', title: 'Профиль сохранён' });
  };

  return (
    <Card padding="md">
      <CardHeader title="Личные данные" subtitle="Имя, фамилия, контактные данные" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Имя"
          value={first}
          onChange={(e) => setName(`${e.target.value} ${last}`.trim())}
        />
        <Input
          label="Фамилия"
          value={last}
          onChange={(e) => setName(`${first} ${e.target.value}`.trim())}
        />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (999) 123-45-67" />
      </div>
      <div className="mt-4">
        <Button onClick={save}>Сохранить</Button>
      </div>
    </Card>
  );
}

// ===================== Безопасность =====================
function SecurityTab() {
  const { push } = useToast();
  const user = useCurrentUser();
  const updateMember = useAuth((s) => s.updateMember);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const change = () => {
    if (!user) return;
    if (user.password && cur !== user.password) {
      push({ tone: 'error', title: 'Неверный текущий пароль' });
      return;
    }
    if (next.length < 8) {
      push({ tone: 'error', title: 'Пароль слишком короткий', description: 'Минимум 8 символов' });
      return;
    }
    if (next !== confirm) {
      push({ tone: 'error', title: 'Пароли не совпадают' });
      return;
    }
    updateMember(user.id, { password: next });
    setCur(''); setNext(''); setConfirm('');
    push({ tone: 'success', title: 'Пароль обновлён' });
  };

  return (
    <div className="space-y-4">
      <Card padding="md">
        <CardHeader title="Смена пароля" subtitle="Минимум 8 символов" />
        <div className="space-y-3 max-w-md">
          <Input label="Текущий пароль" type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
          <Input label="Новый пароль" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          <Input label="Повторите новый пароль" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button onClick={change}>Обновить пароль</Button>
        </div>
      </Card>
      <Card padding="md">
        <CardHeader title="Двухфакторная аутентификация" subtitle="Защита через приложение-генератор кодов" />
        <div className="flex items-center justify-between p-3 rounded-btn border border-border">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-bold text-text text-sm">Google Authenticator / Authy</p>
              <p className="text-xs text-text-muted">Подключите приложение для двухфакторной защиты</p>
            </div>
          </div>
          <Badge tone="warning" dot>Не настроена</Badge>
        </div>
      </Card>
    </div>
  );
}

// ===================== Уведомления =====================
function NotifTab() {
  const notif = useSettings((s) => s.notifications);
  const setNotif = useSettings((s) => s.setNotifications);
  const items: Array<{ key: keyof typeof notif; label: string; hint?: string }> = [
    { key: 'email', label: 'Email-уведомления', hint: 'Новые брони, отмены, отчёты' },
    { key: 'sms', label: 'SMS-уведомления', hint: 'Только важные события' },
    { key: 'telegram', label: 'Telegram', hint: 'Через @GinoHotelBot' },
    { key: 'push', label: 'Push-уведомления', hint: 'В браузере и мобильном приложении' },
    { key: 'newBooking', label: 'Новые брони' },
    { key: 'cancellation', label: 'Отмены' },
    { key: 'dailyReport', label: 'Ежедневный отчёт' },
    { key: 'channelErrors', label: 'Ошибки каналов' },
    { key: 'aiInsights', label: 'AI-инсайты (еженедельно)' },
  ];
  return (
    <div className="space-y-4">
      <Card padding="md">
        <CardHeader title="Каналы доставки" />
        <div className="space-y-2">
          {items.slice(0, 4).map((it) => (
            <ToggleRow key={it.key} label={it.label} hint={it.hint} on={!!notif[it.key]} onChange={(v) => setNotif({ [it.key]: v })} />
          ))}
        </div>
      </Card>
      <Card padding="md">
        <CardHeader title="Типы событий" />
        <div className="space-y-2">
          {items.slice(4).map((it) => (
            <ToggleRow key={it.key} label={it.label} hint={it.hint} on={!!notif[it.key]} onChange={(v) => setNotif({ [it.key]: v })} />
          ))}
        </div>
      </Card>
      <Card padding="md">
        <CardHeader title="Telegram-бот" subtitle="Подключение к @GinoHotelBot" />
        <div className="p-4 rounded-btn bg-info/10 border border-info/30 flex items-center gap-3 flex-wrap">
          <div className="h-12 w-12 rounded-btn bg-gradient-to-br from-info to-primary flex items-center justify-center text-white shrink-0 shadow-soft">
            <Bot className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="font-bold text-text">@GinoHotelBot</p>
            <p className="text-xs text-text-muted">Отправьте боту ваш ID: <span className="font-mono font-bold">HQ-9847</span></p>
          </div>
          <Button>Подключить</Button>
        </div>
      </Card>
    </div>
  );
}

function ToggleRow({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-btn hover:bg-surface-2">
      <div>
        <p className="text-sm font-semibold text-text">{label}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={cn('relative h-6 w-11 rounded-full transition-colors shrink-0', on ? 'bg-primary' : 'bg-border')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

// ===================== Баланс =====================
function BalanceTab() {
  const balance = useSettings((s) => s.balance);
  const topUp = useSettings((s) => s.topUpBalance);
  const { push } = useToast();
  const [amount, setAmount] = useState('5000');
  return (
    <div className="space-y-4">
      <Card padding="md" className="bg-gradient-to-br from-primary/10 to-gold/5 border-primary/20">
        <p className="text-xs uppercase font-bold text-text-muted">Текущий баланс</p>
        <p className="font-display text-4xl text-text mt-1">{balance.amount.toLocaleString('ru')} ₽</p>
        <p className="text-xs text-text-muted mt-1">Списание: 12 ₽ за бронь · хватит на ~{Math.floor(balance.amount / 12)} броней</p>
      </Card>
      <Card padding="md">
        <CardHeader title="Пополнение" />
        <div className="flex gap-3 max-w-md items-end">
          <Input label="Сумма (₽)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} className="flex-1" />
          <Button onClick={() => {
            const v = parseInt(amount || '0', 10);
            if (v <= 0) return;
            topUp(v);
            push({ tone: 'success', title: 'Баланс пополнен', description: `+${v.toLocaleString('ru')} ₽` });
          }}>Пополнить</Button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[1000, 5000, 10000, 50000].map((v) => (
            <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))}>{v.toLocaleString('ru')} ₽</Button>
          ))}
        </div>
      </Card>
      <Card padding="none">
        <div className="p-4 border-b border-border">
          <h3 className="font-display text-lg text-text">История операций</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>{['Дата', 'Операция', 'Сумма', 'Остаток'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs uppercase font-bold text-text-muted">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {balance.history.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-2.5 text-text-muted">{e.date}</td>
                  <td className="px-4 py-2.5 text-text">{e.description}</td>
                  <td className={cn('px-4 py-2.5 font-bold', e.amount > 0 ? 'text-success' : 'text-error')}>
                    {e.amount > 0 ? '+' : ''}{e.amount.toLocaleString('ru')} ₽
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">{e.balanceAfter.toLocaleString('ru')} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ===================== Контакты =====================
function ContactsTab() {
  const contacts = useSettings((s) => s.contacts);
  const setContacts = useSettings((s) => s.setContacts);
  const { push } = useToast();
  return (
    <Card padding="md">
      <CardHeader title="Отображение контактов" subtitle="Эти данные видят гости в письмах и подтверждениях броней" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Название отеля" value={contacts.name} onChange={(e) => setContacts({ name: e.target.value })} />
        <Input label="Телефон" value={contacts.phone} onChange={(e) => setContacts({ phone: e.target.value })} />
        <Input label="Email" type="email" value={contacts.email} onChange={(e) => setContacts({ email: e.target.value })} />
        <Input label="Сайт" value={contacts.site} onChange={(e) => setContacts({ site: e.target.value })} />
        <Input label="WhatsApp" value={contacts.whatsapp} onChange={(e) => setContacts({ whatsapp: e.target.value })} placeholder="+7..." />
        <Input label="Telegram" value={contacts.telegram} onChange={(e) => setContacts({ telegram: e.target.value })} placeholder="@hotelname" />
        <Input label="MAX" value={contacts.max} onChange={(e) => setContacts({ max: e.target.value })} placeholder="@hotelname" />
        <Input label="Адрес" value={contacts.address} onChange={(e) => setContacts({ address: e.target.value })} />
      </div>
      <div className="mt-4">
        <Button onClick={() => push({ tone: 'success', title: 'Контакты сохранены' })}>Сохранить</Button>
      </div>
    </Card>
  );
}

// ===================== Каналы и источники =====================
function SourcesTab() {
  const channels = useSettings((s) => s.channels);
  const toggleChannel = useSettings((s) => s.toggleChannel);
  const [filter, setFilter] = useState('');
  const filtered = useMemo(
    () => CHANNELS_CATALOG.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase())),
    [filter],
  );
  const enabledCount = Object.values(channels).filter(Boolean).length;
  return (
    <Card padding="md">
      <CardHeader
        title="Каналы продаж и источники"
        subtitle={`${enabledCount} из ${CHANNELS_CATALOG.length} подключено`}
      />
      <Input placeholder="Поиск канала..." value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => {
          const on = !!channels[c.id];
          return (
            <button
              key={c.id}
              onClick={() => toggleChannel(c.id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-btn border-2 transition-all text-left',
                on ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-surface-2',
              )}
            >
              <div
                className="h-10 w-10 rounded-btn flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: c.color }}
              >
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text text-sm truncate">{c.name}</p>
                <p className="text-xs text-text-muted truncate">{c.category}</p>
              </div>
              <div className={cn('h-5 w-5 rounded-full flex items-center justify-center shrink-0',
                on ? 'bg-primary text-white' : 'border-2 border-border')}>
                {on && <Check className="h-3 w-3" />}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ===================== Шаблоны писем =====================
function EmailTemplatesTab() {
  const templates = useSettings((s) => s.emailTemplates);
  const updateTemplate = useSettings((s) => s.updateEmailTemplate);
  const [activeKey, setActiveKey] = useState(templates[0]?.key ?? '');
  const active = templates.find((t) => t.key === activeKey) ?? templates[0];
  const { push } = useToast();

  const insertTag = (tag: string) => {
    if (!active) return;
    updateTemplate(active.key, { body: `${active.body}${active.body.endsWith(' ') || active.body === '' ? '' : ' '}${tag}` });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-4">
      <Card padding="sm">
        <p className="text-xs font-bold uppercase text-text-muted px-2 mb-2">Шаблоны</p>
        <nav className="space-y-1">
          {templates.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveKey(t.key)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-semibold text-left',
                activeKey === t.key ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-2 hover:text-text',
              )}
            >
              <span className={cn('h-2 w-2 rounded-full shrink-0', t.enabled ? 'bg-success' : 'bg-border')} />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </nav>
      </Card>

      {active && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-display text-lg text-text">{active.label}</h3>
              <p className="text-xs text-text-muted">{active.description}</p>
            </div>
            <ToggleRow label={active.enabled ? 'Включён' : 'Выключен'} on={active.enabled} onChange={(v) => updateTemplate(active.key, { enabled: v })} />
          </div>
          <Input label="Тема письма" value={active.subject} onChange={(e) => updateTemplate(active.key, { subject: e.target.value })} className="mb-3" />
          <Textarea
            label="Текст письма"
            value={active.body}
            onChange={(e) => updateTemplate(active.key, { body: e.target.value })}
            rows={14}
            className="font-mono text-xs"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={() => push({ tone: 'success', title: 'Шаблон сохранён' })}>Сохранить</Button>
          </div>
        </Card>
      )}

      <Card padding="sm">
        <p className="text-xs font-bold uppercase text-text-muted px-2 mb-2">Теги (вставить)</p>
        <div className="space-y-1 max-h-[520px] overflow-y-auto">
          {EMAIL_TAGS.map((t) => (
            <button
              key={t.tag}
              onClick={() => insertTag(t.tag)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-2 text-xs"
              title={t.description}
            >
              <code className="font-mono text-primary">{t.tag}</code>
              <p className="text-text-muted truncate">{t.description}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ===================== Автосообщения =====================
function AutoMessagesTab() {
  const messages = useSettings((s) => s.autoMessages);
  const update = useSettings((s) => s.updateAutoMessage);
  const channelOptions = ['MAX', 'WhatsApp', 'Telegram', 'Email', 'SMS'] as const;

  return (
    <div className="space-y-3">
      {AUTO_MESSAGE_TEMPLATES.map((tpl) => {
        const m = messages[tpl.key] ?? { enabled: false, channels: [], text: tpl.defaultText };
        return (
          <Card key={tpl.key} padding="md">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <h3 className="font-bold text-text">{tpl.label}</h3>
                <p className="text-xs text-text-muted">{tpl.description}</p>
              </div>
              <ToggleRow label={m.enabled ? 'Включено' : 'Выключено'} on={m.enabled} onChange={(v) => update(tpl.key, { enabled: v })} />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {channelOptions.map((ch) => {
                const active = m.channels.includes(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => update(tpl.key, { channels: active ? m.channels.filter((c) => c !== ch) : [...m.channels, ch] })}
                    className={cn(
                      'px-3 h-8 rounded-btn text-xs font-bold border transition-colors',
                      active ? 'border-primary bg-primary text-white' : 'border-border text-text-muted hover:border-primary/40',
                    )}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
            <Textarea
              value={m.text}
              onChange={(e) => update(tpl.key, { text: e.target.value })}
              rows={4}
              className="text-xs"
            />
          </Card>
        );
      })}
    </div>
  );
}

// ===================== Webhooks и API =====================
function WebhooksTab() {
  const { push } = useToast();
  const webhooks = useSettings((s) => s.webhooks);
  const add = useSettings((s) => s.addWebhook);
  const remove = useSettings((s) => s.removeWebhook);
  const toggle = useSettings((s) => s.toggleWebhook);
  const [event, setEvent] = useState('booking.created');
  const [url, setUrl] = useState('');
  const token = 'sk_live_ginohotel_4f7a92bd6c1e8f9a';

  return (
    <div className="space-y-4">
      <Card padding="md">
        <CardHeader title="API-токен" subtitle="Для внешних интеграций" />
        <div className="p-3 rounded-btn border border-border bg-surface-2 flex items-center gap-3 font-mono text-sm">
          <span className="flex-1 truncate">{token}</span>
          <Button variant="ghost" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />}
            onClick={() => { navigator.clipboard.writeText(token); push({ tone: 'success', title: 'Токен скопирован' }); }}>
            Копировать
          </Button>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button variant="outline">Сгенерировать новый</Button>
          <Button variant="danger">Отозвать</Button>
        </div>
      </Card>

      <Card padding="md">
        <CardHeader title="Webhooks" subtitle="HTTP-уведомления о событиях" />
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-2 mb-3">
          <Select
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            options={[
              { value: 'booking.created', label: 'booking.created' },
              { value: 'booking.cancelled', label: 'booking.cancelled' },
              { value: 'booking.updated', label: 'booking.updated' },
              { value: 'guest.created', label: 'guest.created' },
              { value: 'payment.succeeded', label: 'payment.succeeded' },
              { value: 'channel.error', label: 'channel.error' },
            ]}
          />
          <Input placeholder="https://example.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button leftIcon={<Plus className="h-4 w-4" />} disabled={!url.trim()} onClick={() => {
            add({ event, url: url.trim() });
            setUrl('');
            push({ tone: 'success', title: 'Webhook добавлен' });
          }}>Добавить</Button>
        </div>
        <div className="space-y-2">
          {webhooks.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">Нет настроенных webhook'ов</p>
          ) : webhooks.map((w) => (
            <div key={w.id} className="p-3 rounded-btn border border-border flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-text text-sm font-mono">{w.event}</p>
                <p className="text-xs text-text-muted truncate">{w.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={w.enabled ? 'success' : 'neutral'} dot>{w.enabled ? 'Активен' : 'Выключен'}</Badge>
                <Button variant="ghost" size="sm" onClick={() => toggle(w.id)}>{w.enabled ? 'Выключить' : 'Включить'}</Button>
                <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => remove(w.id)}>Удалить</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
