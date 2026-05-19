// Менеджер каналов: подключения, синхронизация, лог
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Plug, RefreshCcw, Settings as Cog } from 'lucide-react';
import { PageTransition, StaggerList, staggerItem } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { channels as initial, syncLog, properties } from '@/mock/data';
import type { ChannelConnection } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/format';

export default function ChannelsPage() {
  const [channels, setChannels] = useState(initial);
  const [connectFor, setConnectFor] = useState<ChannelConnection | null>(null);
  const { push } = useToast();

  const handleConnect = (ch: ChannelConnection) => {
    setChannels((arr) => arr.map((c) => c.id === ch.id ? { ...c, connected: true, hasError: false, lastSync: 'только что' } : c));
    push({ tone: 'success', title: 'Канал подключён', description: ch.name });
    setConnectFor(null);
  };

  const handleSyncAll = () => {
    push({ tone: 'info', title: 'Синхронизация запущена', description: 'Обновление всех каналов...' });
    setTimeout(() => push({ tone: 'success', title: 'Готово', description: 'Все каналы синхронизированы' }), 1200);
  };

  return (
    <PageTransition>
      <PageHeader
        title="Менеджер каналов"
        subtitle="Подключения к OTA-площадкам и синхронизация бронирований"
        action={
          <Button size="md" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={handleSyncAll}>
            Синхронизировать все
          </Button>
        }
      />

      {/* Карточки каналов */}
      <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {channels.map((ch) => (
          <motion.div key={ch.id} variants={staggerItem}>
            <Card hoverable padding="md">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 rounded-btn bg-surface-2 flex items-center justify-center text-2xl shrink-0">
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-text leading-tight">{ch.name}</h3>
                  <p className="text-xs text-text-muted mt-0.5">Последняя синхронизация: {ch.lastSync}</p>
                </div>
                {ch.hasError ? (
                  <Badge tone="error" dot>Ошибка</Badge>
                ) : ch.connected ? (
                  <Badge tone="success" dot>Активен</Badge>
                ) : (
                  <Badge tone="neutral" dot>Не подключён</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-border">
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Активных броней</p>
                  <p className="font-display text-xl text-text mt-0.5">{ch.activeBookings}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Наценка</p>
                  <p className="font-display text-xl text-text mt-0.5">{ch.markup}%</p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {ch.connected ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" leftIcon={<RefreshCcw className="h-3.5 w-3.5" />}>
                      Синхронизировать
                    </Button>
                    <Button variant="ghost" size="icon"><Cog className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <Button size="sm" className="w-full" leftIcon={<Plug className="h-3.5 w-3.5" />} onClick={() => setConnectFor(ch)}>
                    Подключить
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </StaggerList>

      {/* Лог синхронизации */}
      <Card padding="md">
        <CardHeader title="Лог синхронизации" subtitle="Последние события всех каналов" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase font-bold text-text-muted border-b border-border">
                <th className="py-2.5 pr-3">Статус</th>
                <th className="py-2.5 pr-3">Канал</th>
                <th className="py-2.5 pr-3">Время</th>
                <th className="py-2.5">Сообщение</th>
              </tr>
            </thead>
            <tbody>
              {syncLog.map((l) => {
                const cfg = {
                  success: { Icon: CheckCircle2, color: 'text-success', tone: 'success' as const, label: 'Успех' },
                  warning: { Icon: AlertCircle, color: 'text-warning', tone: 'warning' as const, label: 'Предупр.' },
                  error: { Icon: XCircle, color: 'text-error', tone: 'error' as const, label: 'Ошибка' },
                }[l.status];
                return (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                    <td className="py-2.5 pr-3"><Badge tone={cfg.tone} dot>{cfg.label}</Badge></td>
                    <td className="py-2.5 pr-3 font-bold text-text">{l.channel}</td>
                    <td className="py-2.5 pr-3 text-text-muted">{l.time}</td>
                    <td className="py-2.5 text-text-muted">{l.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Модалка подключения */}
      <Modal
        open={!!connectFor}
        onClose={() => setConnectFor(null)}
        title={`Подключение: ${connectFor?.name}`}
        subtitle="Настройка API-интеграции"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConnectFor(null)}>Отмена</Button>
            <Button onClick={() => connectFor && handleConnect(connectFor)}>Подключить</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="API Key" placeholder="sk_live_xxxxxxxxxxxx" />
          <Input label="Hotel ID" placeholder="Идентификатор отеля в системе канала" />
          <Select label="Объект для маппинга" options={properties.map((p) => ({ value: p.id, label: p.name }))} />
          <Select label="Стратегия цен" options={[
            { value: 'mirror', label: 'Зеркалить базовые цены' },
            { value: 'markup', label: 'С наценкой' },
            { value: 'custom', label: 'Индивидуально' },
          ]} />
          <Input label="Наценка, %" type="number" defaultValue={0} />
        </div>
      </Modal>
    </PageTransition>
  );
}
