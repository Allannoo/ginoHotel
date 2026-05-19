// Настройки: профиль / API / уведомления / пользователи
import { useState } from 'react';
import { User, Key, Bell, Users as UsersIcon, Copy, Plus, Shield, Bot } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { users } from '@/mock/data';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/format';

const TABS = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'api', label: 'API-интеграции', icon: Key },
  { id: 'notif', label: 'Уведомления', icon: Bell },
  { id: 'users', label: 'Пользователи', icon: UsersIcon },
] as const;

type TabId = typeof TABS[number]['id'];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('profile');
  return (
    <PageTransition>
      <PageHeader title="Настройки" subtitle="Управление аккаунтом и интеграциями" />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        <Card padding="sm">
          <nav className="space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn('w-full flex items-center gap-3 px-3 h-10 rounded-btn text-sm font-bold transition-colors text-left',
                    tab === t.id ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-2 hover:text-text')}>
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </Card>

        <div>
          {tab === 'profile' && <ProfileTab />}
          {tab === 'api' && <ApiTab />}
          {tab === 'notif' && <NotifTab />}
          {tab === 'users' && <UsersTab />}
        </div>
      </div>
    </PageTransition>
  );
}

function ProfileTab() {
  const { push } = useToast();
  return (
    <div className="space-y-4">
      <Card padding="md">
        <CardHeader title="Личные данные" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Имя" defaultValue="Алексей" />
          <Input label="Фамилия" defaultValue="Смирнов" />
          <Input label="Email" defaultValue="a.smirnov@ginohotel.ru" />
          <Input label="Телефон" defaultValue="+7 (999) 123-45-67" />
        </div>
        <div className="mt-4">
          <Button onClick={() => push({ tone: 'success', title: 'Профиль сохранён' })}>Сохранить</Button>
        </div>
      </Card>
      <Card padding="md">
        <CardHeader title="Безопасность" subtitle="Пароль и двухфакторная аутентификация" />
        <div className="space-y-3">
          <Input label="Текущий пароль" type="password" placeholder="••••••••" />
          <Input label="Новый пароль" type="password" placeholder="Минимум 12 символов" />
          <div className="flex items-center justify-between p-3 rounded-btn border border-border">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-bold text-text text-sm">Двухфакторная аутентификация</p>
                <p className="text-xs text-text-muted">Защита через приложение-генератор кодов</p>
              </div>
            </div>
            <Badge tone="warning" dot>Не настроена</Badge>
          </div>
          <Button>Обновить пароль</Button>
        </div>
      </Card>
    </div>
  );
}

function ApiTab() {
  const { push } = useToast();
  const token = 'sk_live_ginohotel_4f7a92bd6c1e8f9a';
  return (
    <Card padding="md">
      <CardHeader title="API-токены" subtitle="Для интеграций с внешними системами" />
      <div className="p-3 rounded-btn border border-border bg-surface-2 flex items-center gap-3 font-mono text-sm">
        <span className="flex-1 truncate">{token}</span>
        <Button variant="ghost" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />}
          onClick={() => { navigator.clipboard.writeText(token); push({ tone: 'success', title: 'Токен скопирован' }); }}>
          Копировать
        </Button>
      </div>
      <p className="text-xs text-text-muted mt-2">Создан 12.05.2026 · Последнее использование: 2 минуты назад</p>
      <div className="mt-4 flex gap-2">
        <Button variant="outline">Сгенерировать новый</Button>
        <Button variant="danger">Отозвать</Button>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <CardHeader title="Webhooks" subtitle="Уведомления о событиях" />
        <div className="space-y-2">
          {[
            { event: 'booking.created', url: 'https://api.example.com/webhook' },
            { event: 'booking.cancelled', url: 'https://api.example.com/cancel' },
          ].map((w) => (
            <div key={w.event} className="p-3 rounded-btn border border-border flex items-center justify-between">
              <div>
                <p className="font-bold text-text text-sm font-mono">{w.event}</p>
                <p className="text-xs text-text-muted">{w.url}</p>
              </div>
              <Badge tone="success" dot>Активен</Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function NotifTab() {
  return (
    <div className="space-y-4">
      <Card padding="md">
        <CardHeader title="Telegram-бот" subtitle="Получайте уведомления в Telegram" />
        <div className="p-4 rounded-btn bg-info/10 border border-info/30 flex items-center gap-3">
          <div className="h-12 w-12 rounded-btn bg-gradient-to-br from-info to-primary flex items-center justify-center text-white shrink-0 shadow-soft"><Bot className="h-6 w-6" /></div>
          <div className="flex-1">
            <p className="font-bold text-text">@GinoHotelBot</p>
            <p className="text-xs text-text-muted">Чтобы подключить, отправьте боту ваш ID: <span className="font-mono font-bold">HQ-9847</span></p>
          </div>
          <Button>Подключить</Button>
        </div>
      </Card>

      <Card padding="md">
        <CardHeader title="Email-уведомления" />
        <div className="space-y-2">
          {[
            { label: 'Новые брони', enabled: true },
            { label: 'Отмены', enabled: true },
            { label: 'Ежедневный отчёт', enabled: false },
            { label: 'AI-инсайты (еженедельно)', enabled: true },
            { label: 'Алёрты по ошибкам каналов', enabled: true },
          ].map((n) => <Toggle key={n.label} label={n.label} defaultEnabled={n.enabled} />)}
        </div>
      </Card>
    </div>
  );
}

function Toggle({ label, defaultEnabled }: { label: string; defaultEnabled: boolean }) {
  const [on, setOn] = useState(defaultEnabled);
  return (
    <div className="flex items-center justify-between p-3 rounded-btn hover:bg-surface-2">
      <span className="text-sm font-semibold text-text">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={cn('relative h-6 w-11 rounded-full transition-colors',
          on ? 'bg-primary' : 'bg-border')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

function UsersTab() {
  const [open, setOpen] = useState(false);
  const ROLES = { admin: 'Администратор', manager: 'Менеджер', reception: 'Ресепшен', cleaner: 'Горничная' };
  return (
    <Card padding="none">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="font-display text-lg text-text">Пользователи</h3>
          <p className="text-xs text-text-muted">Управление командой и ролями</p>
        </div>
        <Button size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Пригласить</Button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-surface-2">
          <tr>{['Пользователь', 'Email', 'Роль', 'Статус', ''].map((h) =>
            <th key={h} className="px-4 py-3 text-left text-xs uppercase font-bold text-text-muted">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-4 py-3 font-bold text-text">{u.name}</td>
              <td className="px-4 py-3 text-text-muted">{u.email}</td>
              <td className="px-4 py-3"><Badge tone={u.role === 'admin' ? 'primary' : 'neutral'}>{ROLES[u.role]}</Badge></td>
              <td className="px-4 py-3">
                <Badge tone={u.active ? 'success' : 'neutral'} dot>{u.active ? 'Активен' : 'Отключён'}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm">⋯</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={open} onClose={() => setOpen(false)} title="Пригласить пользователя"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button><Button onClick={() => setOpen(false)}>Отправить приглашение</Button></>}>
        <div className="space-y-3">
          <Input label="Email" placeholder="user@example.com" />
          <Select label="Роль" options={Object.entries(ROLES).map(([v, l]) => ({ value: v, label: l }))} />
        </div>
      </Modal>
    </Card>
  );
}
