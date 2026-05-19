// Настройки — расширенная панель: профиль, безопасность, уведомления, баланс, контакты,
// сотрудники (тот же TeamManager что и в /team), каналы и источники, шаблоны писем,
// автосообщения, вебхуки.
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, Shield, Bell, Wallet, Phone, Users as UsersIcon, PlugZap, MailOpen, MessagesSquare, Webhook, Bot, Copy, Plus, Trash2, Check, History, KeyRound, Upload, Lock,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/format';
import { useCurrentUser, useAuth, PERMISSION_LABEL, ROLE_LABEL } from '@/store/auth';
import { useSettings, CHANNELS_CATALOG, EMAIL_TAGS, AUTO_MESSAGE_TEMPLATES, type MessengerKey } from '@/store/settings';
import { useAuditLog, AUDIT_ACTION_LABEL } from '@/store/audit';
import { useFieldRoles, SENSITIVE_FIELD_LABEL } from '@/store/fieldRoles';
import { Avatar } from '@/components/ui/Avatar';
import { TeamManager } from '@/components/TeamManager';
import { ChannelConnectModal } from '@/components/ChannelConnectModal';

const TABS = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'security', label: 'Безопасность', icon: Shield },
  { id: 'notif', label: 'Уведомления', icon: Bell },
  { id: 'balance', label: 'Баланс', icon: Wallet },
  { id: 'contacts', label: 'Контакты', icon: Phone },
  { id: 'team', label: 'Сотрудники', icon: UsersIcon },
  { id: 'roles', label: 'Доступ к полям', icon: Lock },
  { id: 'audit', label: 'Аудит-лог', icon: History },
  { id: 'sources', label: 'Каналы и источники', icon: PlugZap },
  { id: 'emails', label: 'Шаблоны писем', icon: MailOpen },
  { id: 'auto', label: 'Автосообщения', icon: MessagesSquare },
  { id: 'webhooks', label: 'Webhooks и API', icon: Webhook },
] as const;

type TabId = typeof TABS[number]['id'];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const initial = (params.get('tab') as TabId) || 'profile';
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initial) ? initial : 'profile',
  );
  useEffect(() => {
    if (params.get('tab') !== tab) {
      const next = new URLSearchParams(params);
      next.set('tab', tab);
      setParams(next, { replace: true });
    }
     
  }, [tab]);
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
          {tab === 'roles' && <FieldRolesTab />}
          {tab === 'audit' && <AuditTab />}
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
  const log = useAuditLog((s) => s.log);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);
  const [first, ...rest] = name.split(' ');
  const last = rest.join(' ');

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      push({ tone: 'error', title: 'Слишком большой файл', description: 'Максимум 2 MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setAvatar(url);
      if (user) updateMember(user.id, { avatar: url });
      push({ tone: 'success', title: 'Аватар обновлён' });
    };
    reader.readAsDataURL(f);
  };

  const clearAvatar = () => {
    setAvatar(undefined);
    if (user) updateMember(user.id, { avatar: undefined });
  };

  const save = () => {
    if (!user) return;
    updateMember(user.id, { name: name.trim(), email: email.trim(), phone: phone.trim() });
    log({ userId: user.id, userName: user.name, action: 'settings.update', target: 'Профиль' });
    push({ tone: 'success', title: 'Профиль сохранён' });
  };

  return (
    <div className="space-y-4">
      <Card padding="md">
        <CardHeader title="Аватар" subtitle="Показывается в шапке и на всех страницах. PNG/JPG, до 2 MB" />
        <div className="flex items-center gap-5">
          <Avatar name={name || 'Аккаунт'} src={avatar} size="xl" />
          <div className="flex flex-col gap-2">
            <label className="inline-flex">
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPickAvatar} id="avatar-upload-input" />
              <Button leftIcon={<Upload className="h-4 w-4" />} onClick={() => document.getElementById('avatar-upload-input')?.click()}>
                {avatar ? 'Заменить' : 'Загрузить'}
              </Button>
            </label>
            {avatar && (
              <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={clearAvatar}>Удалить</Button>
            )}
          </div>
        </div>
      </Card>
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
    </div>
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
        <CardHeader title="Двухфакторная аутентификация" subtitle="Код из приложения-генератора (Google Authenticator, Authy)" />
        <TwoFactorSection />
      </Card>
    </div>
  );
}

// ===================== Уведомления =====================
function NotifTab() {
  const notif = useSettings((s) => s.notifications);
  const setNotif = useSettings((s) => s.setNotifications);
  const connections = useSettings((s) => s.connections);
  const [connectKey, setConnectKey] = useState<MessengerKey | null>(null);

  // Каналы доставки — теперь с привязкой к connections и кнопкой подключения
  const deliveryChannels: Array<{ key: keyof typeof notif; connKey: MessengerKey; label: string; hint: string; icon: typeof Bot; gradient: string }> = [
    { key: 'email', connKey: 'email', label: 'Email-уведомления', hint: 'Через SMTP вашего почтового ящика', icon: MailOpen, gradient: 'from-warning to-gold' },
    { key: 'sms', connKey: 'sms', label: 'SMS-уведомления', hint: 'Через SMS.ru / SMS Aero / Twilio', icon: Phone, gradient: 'from-error to-warning' },
    { key: 'telegram', connKey: 'telegram', label: 'Telegram', hint: 'Через собственного бота', icon: Bot, gradient: 'from-info to-primary' },
    { key: 'whatsapp' as keyof typeof notif, connKey: 'whatsapp', label: 'WhatsApp', hint: 'Через Green-API / Wazzup24', icon: MessagesSquare, gradient: 'from-success to-info' },
    { key: 'max' as keyof typeof notif, connKey: 'max', label: 'MAX-мессенджер', hint: 'Российский мессенджер (VK)', icon: Bot, gradient: 'from-primary to-gold' },
    { key: 'push', connKey: 'telegram', label: 'Push-уведомления', hint: 'В браузере и мобильном приложении', icon: Bell, gradient: 'from-primary to-info' },
  ];

  const eventItems: Array<{ key: keyof typeof notif; label: string; hint?: string }> = [
    { key: 'newBooking', label: 'Новые брони' },
    { key: 'cancellation', label: 'Отмены' },
    { key: 'dailyReport', label: 'Ежедневный отчёт' },
    { key: 'channelErrors', label: 'Ошибки каналов' },
    { key: 'aiInsights', label: 'AI-инсайты (еженедельно)' },
  ];

  return (
    <div className="space-y-4">
      <Card padding="md">
        <CardHeader title="Каналы доставки" subtitle="Подключите мессенджеры и почту, чтобы получать и отправлять уведомления гостям" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {deliveryChannels.map((ch) => {
            const Icon = ch.icon;
            const conn = connections[ch.connKey];
            const isOn = !!notif[ch.key];
            return (
              <div key={ch.key} className="p-3 rounded-btn border border-border bg-surface flex items-start gap-3">
                <div className={cn('h-10 w-10 rounded-btn bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-soft', ch.gradient)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text">{ch.label}</p>
                    {conn.connected
                      ? <Badge tone="success" dot>Подключено</Badge>
                      : <Badge tone="neutral" dot>Не подключено</Badge>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{ch.hint}</p>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      onClick={() => setConnectKey(ch.connKey)}
                    >
                      <PlugZap className="h-3.5 w-3.5" />
                      {conn.connected ? 'Настроить' : 'Подключить'}
                    </button>
                    <Switch
                      size="sm"
                      checked={isOn && conn.connected}
                      onChange={(v) => {
                        if (v && !conn.connected) { setConnectKey(ch.connKey); return; }
                        setNotif({ [ch.key]: v });
                      }}
                      disabled={!conn.connected}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card padding="md">
        <CardHeader title="Типы событий" />
        <div className="space-y-2">
          {eventItems.map((it) => (
            <ToggleRow key={it.key} label={it.label} hint={it.hint} on={!!notif[it.key]} onChange={(v) => setNotif({ [it.key]: v })} />
          ))}
        </div>
      </Card>
      {connectKey && (
        <ChannelConnectModal open={!!connectKey} channel={connectKey} onClose={() => setConnectKey(null)} />
      )}
    </div>
  );
}

function ToggleRow({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-btn hover:bg-surface-2">
      <Switch label={label} hint={hint} checked={on} onChange={onChange} className="w-full" />
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
  const connections = useSettings((s) => s.connections);
  const [connectKey, setConnectKey] = useState<MessengerKey | null>(null);
  // Маппинг ярлыка чипа на ключ подключения в connections
  const channelOptions: Array<{ label: string; key: MessengerKey }> = [
    { label: 'MAX', key: 'max' },
    { label: 'WhatsApp', key: 'whatsapp' },
    { label: 'Telegram', key: 'telegram' },
    { label: 'Email', key: 'email' },
    { label: 'SMS', key: 'sms' },
  ];

  return (
    <div className="space-y-3">
      <Card padding="md" className="bg-info/5 border-info/30">
        <div className="flex items-start gap-3">
          <PlugZap className="h-5 w-5 text-info shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-text">Перед тем как включать автосообщения — подключите хотя бы один канал</p>
            <p className="text-xs text-text-muted mt-1">
              Откройте раздел <b>«Уведомления»</b> или нажмите на «не подключенный» чип канала ниже — откроется пошаговый мастер.
            </p>
          </div>
        </div>
      </Card>
      {AUTO_MESSAGE_TEMPLATES.map((tpl) => {
        const m = messages[tpl.key] ?? { enabled: false, channels: [], text: tpl.defaultText };
        return (
          <Card key={tpl.key} padding="md">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <h3 className="font-bold text-text">{tpl.label}</h3>
                <p className="text-xs text-text-muted">{tpl.description}</p>
              </div>
              <Switch label={m.enabled ? 'Включено' : 'Выключено'} checked={m.enabled} onChange={(v) => update(tpl.key, { enabled: v })} />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {channelOptions.map((ch) => {
                const active = m.channels.includes(ch.label);
                const connected = connections[ch.key].connected;
                return (
                  <button
                    key={ch.label}
                    type="button"
                    onClick={() => {
                      if (!connected) { setConnectKey(ch.key); return; }
                      update(tpl.key, { channels: active ? m.channels.filter((c) => c !== ch.label) : [...m.channels, ch.label] });
                    }}
                    title={connected ? 'Переключить канал' : 'Подключите канал, чтобы использовать его'}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 h-8 rounded-btn text-xs font-bold border transition-colors',
                      active && connected && 'border-primary bg-primary text-white',
                      !active && connected && 'border-border text-text hover:border-primary/40',
                      !connected && 'border-dashed border-border text-text-muted hover:border-primary/40 hover:text-primary',
                    )}
                  >
                    {ch.label}
                    {!connected && <PlugZap className="h-3 w-3" />}
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
      {connectKey && (
        <ChannelConnectModal open={!!connectKey} channel={connectKey} onClose={() => setConnectKey(null)} />
      )}
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

// ===================== 2FA =====================
function TwoFactorSection() {
  const { push } = useToast();
  const user = useCurrentUser();
  const updateMember = useAuth((s) => s.updateMember);
  const log = useAuditLog((s) => s.log);
  const enabled = !!user?.twoFactorEnabled;
  const [stage, setStage] = useState<'idle' | 'setup'>('idle');
  const [code, setCode] = useState('');
  const secret = 'JBSWY3DPEHPK3PXP';

  if (!user) return null;

  const verify = () => {
    if (code.replace(/\s/g, '').length !== 6) {
      push({ tone: 'error', title: 'Введите 6-значный код' });
      return;
    }
    updateMember(user.id, { twoFactorEnabled: true, twoFactorSecret: secret });
    log({ userId: user.id, userName: user.name, action: 'settings.update', target: '2FA включена' });
    setStage('idle'); setCode('');
    push({ tone: 'success', title: 'Двухфакторная защита включена' });
  };
  const disable = () => {
    updateMember(user.id, { twoFactorEnabled: false, twoFactorSecret: undefined });
    log({ userId: user.id, userName: user.name, action: 'settings.update', target: '2FA выключена' });
    push({ tone: 'success', title: '2FA отключена' });
  };

  const otpauth = `otpauth://totp/GinoHotel:${user.email}?secret=${secret}&issuer=GinoHotel`;

  if (enabled) {
    return (
      <div className="flex items-center justify-between p-3 rounded-btn border border-success/40 bg-success/5">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-success" />
          <div>
            <p className="font-bold text-text text-sm">Двухфакторная защита включена</p>
            <p className="text-xs text-text-muted">При следующем входе попросим код из приложения</p>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={disable}>Отключить</Button>
      </div>
    );
  }

  if (stage === 'idle') {
    return (
      <div className="flex items-center justify-between p-3 rounded-btn border border-border">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <p className="font-bold text-text text-sm">Google Authenticator / Authy / Яндекс.Ключ</p>
            <p className="text-xs text-text-muted">Дополнительный 6-значный код при каждом входе</p>
          </div>
        </div>
        <Button onClick={() => { setStage('setup'); setCode(''); }} leftIcon={<KeyRound className="h-4 w-4" />}>Подключить</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-btn border border-border bg-surface-2 text-sm">
        <p className="font-bold mb-2">1. Откройте приложение-генератор и отсканируйте QR (или введите секрет вручную):</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="h-32 w-32 bg-white rounded-btn flex items-center justify-center border border-border p-2">
            <div className="grid grid-cols-8 gap-px w-full h-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={cn('aspect-square', (i * 7 + 3) % 3 ? 'bg-black' : 'bg-white')} />
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-muted">Секретный ключ:</p>
            <code className="font-mono text-sm text-primary break-all">{secret}</code>
            <p className="text-[10px] text-text-muted mt-1 break-all max-w-md">{otpauth}</p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm font-bold mb-2">2. Введите 6-значный код из приложения:</p>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="w-40">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="font-mono text-lg tracking-widest"
            />
          </div>
          <Button onClick={verify}>Подтвердить</Button>
          <Button variant="ghost" onClick={() => { setStage('idle'); setCode(''); }}>Отмена</Button>
        </div>
      </div>
    </div>
  );
}

// ===================== Аудит-лог =====================
function AuditTab() {
  const entries = useAuditLog((s) => s.entries);
  const clear = useAuditLog((s) => s.clear);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState('');
  const users = useMemo(() => Array.from(new Set(entries.map((e) => e.userName))), [entries]);
  const filtered = useMemo(() => entries.filter((e) =>
    (!actionFilter || e.action === actionFilter) &&
    (!userFilter || e.userName === userFilter),
  ), [entries, actionFilter, userFilter]);

  return (
    <Card padding="md">
      <CardHeader
        title="Аудит-лог"
        subtitle={`${entries.length} записей · хранится до 500 последних действий`}
        action={<Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={clear}>Очистить</Button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <Select label="Действие" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          options={[{ value: '', label: 'Все действия' }, ...Object.entries(AUDIT_ACTION_LABEL).map(([k, v]) => ({ value: k, label: v }))]} />
        <Select label="Пользователь" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}
          options={[{ value: '', label: 'Все' }, ...users.map((u) => ({ value: u, label: u }))]} />
      </div>
      <div className="border border-border rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr>
              {['Время', 'Пользователь', 'Действие', 'Объект', 'Детали', 'IP'].map((h) =>
                <th key={h} className="px-3 py-2 text-left text-[11px] uppercase font-bold text-text-muted">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-sm text-text-muted">Нет записей</td></tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-3 py-2 text-text-muted whitespace-nowrap">{new Date(e.at).toLocaleString('ru')}</td>
                <td className="px-3 py-2 font-bold text-text">{e.userName}</td>
                <td className="px-3 py-2"><Badge tone="neutral">{AUDIT_ACTION_LABEL[e.action]}</Badge></td>
                <td className="px-3 py-2 text-text">{e.target ?? '—'}</td>
                <td className="px-3 py-2 text-text-muted">{e.details ?? ''}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-text-muted">{e.ip ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ===================== Доступ к полям =====================
function FieldRolesTab() {
  const matrix = useFieldRoles((s) => s.matrix);
  const toggle = useFieldRoles((s) => s.toggle);
  const reset = useFieldRoles((s) => s.reset);
  const fields = Object.keys(matrix) as Array<keyof typeof matrix>;
  const roles: Array<keyof typeof ROLE_LABEL> = ['admin', 'manager', 'reception', 'cleaner'];
  return (
    <Card padding="md">
      <CardHeader
        title="Доступ к чувствительным полям"
        subtitle="Кто из ролей видит реальные данные. Выключенные поля показываются как «***» для этой роли."
        action={<Button variant="ghost" size="sm" onClick={reset}>Сбросить</Button>}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] uppercase font-bold text-text-muted">Поле</th>
              {roles.map((r) => (
                <th key={r} className="px-3 py-2 text-center text-[11px] uppercase font-bold text-text-muted">{ROLE_LABEL[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f} className="border-t border-border">
                <td className="px-3 py-2 font-bold text-text">{SENSITIVE_FIELD_LABEL[f]}</td>
                {roles.map((r) => {
                  const on = matrix[f].includes(r);
                  const isAdmin = r === 'admin';
                  return (
                    <td key={r} className="px-3 py-2 text-center">
                      <button
                        type="button"
                        disabled={isAdmin}
                        onClick={() => toggle(f, r)}
                        className={cn(
                          'h-6 w-11 rounded-full transition-colors mx-auto inline-flex items-center px-0.5',
                          on ? 'bg-primary' : 'bg-surface-2 border border-border',
                          isAdmin && 'opacity-60 cursor-not-allowed',
                        )}
                        title={isAdmin ? 'Директор видит всегда' : ''}
                      >
                        <span className={cn('h-5 w-5 rounded-full bg-white shadow-soft transition-transform', on && 'translate-x-5')} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
